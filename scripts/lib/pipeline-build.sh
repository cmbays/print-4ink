#!/usr/bin/env bash
# pipeline-build.sh — Pipeline-Aware Build for Screen Print Pro
#
# Implements `work build <pipeline-id|manifest>`:
#   - Pipeline mode: Creates base branch build/<pipeline-id>, reads manifest from
#     artifact directory, launches build waves with PRs targeting base branch.
#   - Legacy mode: If arg is a .yaml file (not a pipeline ID), falls through to
#     the original _work_build behavior for backward compatibility.
#
# Build flow:
#   1. Create base branch: build/<pipeline-id> from main
#   2. Read manifest from pipeline artifact directory
#   3. For each wave: create sessions from base, PRs target base
#   4. Track sessions in pipeline entity
#   5. Transition: active → building (if not already)
#   6. After final wave: ready for `work end`
#
# Source this file from work.sh (after pipeline-entity.sh, pipeline-registry.sh).

# ── Pipeline Build ────────────────────────────────────────────────────────────

_work_pipeline_build() {
    local pipeline_id="${1:-}"
    [[ -n "$pipeline_id" ]] && shift

    if [[ -z "$pipeline_id" ]]; then
        echo "Error: pipeline ID required." >&2
        echo "Usage: work build <pipeline-id> [--wave N] [--yolo] [--claude-args \"...\"]" >&2
        return 1
    fi

    # Parse flags
    local wave_idx=0
    local claude_args=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --wave)        wave_idx="${2:-0}"; shift 2 ;;
            --yolo)        claude_args="${claude_args:+$claude_args }--dangerously-skip-permissions"; shift ;;
            --claude-args) claude_args="${claude_args:+$claude_args }${2:-}"; shift 2 ;;
            *)             echo "Error: Unknown flag '$1'" >&2; return 1 ;;
        esac
    done

    # Resolve ID or name
    pipeline_id=$(_pipeline_resolve_id "$pipeline_id") || return 1

    # Get entity
    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 1
    local p_name p_type p_state p_auto
    p_name=$(echo "$entity" | jq -r '.name')
    p_type=$(echo "$entity" | jq -r '.type')
    p_state=$(echo "$entity" | jq -r '.state')
    p_auto=$(echo "$entity" | jq -r '.auto')

    # Validate state: must be active or building
    if [[ "$p_state" != "active" && "$p_state" != "building" ]]; then
        echo "Error: Pipeline '$pipeline_id' is in state '$p_state'." >&2
        echo "  Expected 'active' or 'building'. Run 'work start $pipeline_id' first." >&2
        return 1
    fi

    # Find manifest in artifact directory
    local artifact_dir
    artifact_dir=$(_pipeline_artifact_dir "$pipeline_id")
    local manifest="${artifact_dir}/manifest.yaml"

    if [[ ! -f "$manifest" ]]; then
        echo "Error: Manifest not found: $manifest" >&2
        echo "  Run pre-build stages first (work start $pipeline_id) to generate the manifest." >&2
        return 1
    fi

    # Check yq dependency
    _kdl_check_deps || return 1

    # Create or verify base branch
    local base_branch="build/${pipeline_id}"
    local base_exists=false
    if git -C "$PRINT4INK_REPO" rev-parse --verify "$base_branch" &>/dev/null; then
        base_exists=true
        echo "Base branch '$base_branch' already exists."
    else
        echo "Creating base branch: $base_branch"
        git -C "$PRINT4INK_REPO" pull origin main --quiet || true
        git -C "$PRINT4INK_REPO" branch "$base_branch" main || return 1
        git -C "$PRINT4INK_REPO" push -u origin "$base_branch" --quiet || return 1
    fi

    # Store base branch in entity
    _pipeline_update "$pipeline_id" "baseBranch" "$base_branch" || true

    # Transition to building if still active
    if [[ "$p_state" == "active" ]]; then
        _pipeline_transition "$pipeline_id" "building" || return 1
        _pipeline_update "$pipeline_id" "stage" "build" || true
    fi

    # Validate wave exists
    local wave_count
    wave_count=$(_kdl_wave_count "$manifest") || return 1
    if (( wave_idx >= wave_count )); then
        echo "Error: Wave $wave_idx does not exist (manifest has $wave_count waves: 0-$((wave_count-1)))" >&2
        return 1
    fi

    local wave_name
    wave_name=$(_kdl_wave_name "$manifest" "$wave_idx")
    local is_serial="parallel"
    _kdl_wave_is_serial "$manifest" "$wave_idx" && is_serial="serial"

    echo ""
    echo "=== work build (pipeline) ==="
    echo "  Pipeline:  $pipeline_id"
    echo "  Manifest:  $manifest"
    echo "  Base:      $base_branch"
    echo "  Wave $wave_idx:   $wave_name"
    echo "  Mode:      $is_serial"
    echo ""

    # Compute MMDD
    local MMDD
    MMDD=$(date +%m%d)

    # Pull base branch
    echo "Pulling latest $base_branch..."
    git -C "$PRINT4INK_REPO" pull origin "$base_branch" --quiet || true

    # Create worktrees for all sessions in this wave
    local TOPICS
    TOPICS=$(_kdl_wave_topics "$manifest" "$wave_idx") || return 1

    local topic session_idx=0
    local created_topics=()
    local -a session_prompts=()
    local -a session_dirs=()

    # Declare loop body variables before the loop (zsh local re-declaration bug)
    local stage prompt full_prompt BRANCH WORKTREE_DIR npm_output npm_exit wt_json

    while IFS= read -r topic; do
        [[ -z "$topic" ]] && continue
        echo "--- Creating session: $topic ---"

        stage=$(_kdl_session_detail "$manifest" "$wave_idx" "$session_idx" "stage")
        [[ -z "$stage" ]] && stage="build"

        prompt=$(_kdl_session_detail "$manifest" "$wave_idx" "$session_idx" "prompt")
        full_prompt="Use the build-session-protocol skill to guide your workflow. ${prompt}"

        BRANCH="session/${MMDD}-${topic}"
        WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH//\//-}"

        if git -C "$PRINT4INK_REPO" rev-parse --verify "$BRANCH" &>/dev/null; then
            echo "  Branch '$BRANCH' already exists — skipping worktree creation"
        else
            if ! git -C "$PRINT4INK_REPO" worktree add "$WORKTREE_DIR" -b "$BRANCH" "$base_branch" --quiet; then
                echo "  Error creating worktree for $topic — skipping" >&2
                session_idx=$((session_idx + 1))
                continue
            fi

            npm_output=$(cd "$WORKTREE_DIR" && npm install --silent 2>&1)
            npm_exit=$?
            if [[ $npm_exit -ne 0 ]]; then
                echo "  Warning: npm install failed (exit $npm_exit)" >&2
            else
                echo "  $(echo "$npm_output" | tail -1)"
            fi
        fi

        # Register session
        if type _registry_add &>/dev/null; then
            _registry_add "$topic" "$BRANCH"
            _registry_update "$topic" "vertical" "$p_name"
            _registry_update "$topic" "stage" "$stage"
            if type _registry_update_json &>/dev/null; then
                _registry_update_json "$topic" "wave" "$wave_idx"
            fi
        fi

        # Track worktree in pipeline entity
        wt_json=$(_pipeline_read "$pipeline_id" | jq --arg wt "$BRANCH" '.worktrees + [$wt]')
        _pipeline_update_json "$pipeline_id" "worktrees" "$wt_json" 2>/dev/null || true

        created_topics+=("$topic")
        session_prompts+=("$full_prompt")
        session_dirs+=("$WORKTREE_DIR")
        echo "  Created: $WORKTREE_DIR (base: $base_branch)"
        echo ""

        session_idx=$((session_idx + 1))
    done <<< "$TOPICS"

    if [[ ${#created_topics[@]} -eq 0 ]]; then
        echo "No sessions created." >&2
        return 1
    fi

    # Generate KDL layout (reuse the pattern from _work_build)
    local _arr_start=0
    [[ -n "${ZSH_VERSION:-}" ]] && _arr_start=1

    if [[ -n "${ZELLIJ:-}" ]]; then
        echo "Opening ${#created_topics[@]} tabs in current Zellij session..."
        local _j=$_arr_start
        local _t cwd tab_prompt tab_kdl
        for _t in "${created_topics[@]}"; do
            cwd="${session_dirs[$_j]}"
            tab_prompt="${session_prompts[$_j]}"

            tab_kdl=$(mktemp "${TMPDIR:-/tmp}/work-tab-XXXXXX")
            {
                echo "layout {"
                _kdl_render_tab "$_t" "$cwd" "$tab_prompt" "$claude_args"
                echo "}"
            } > "$tab_kdl"

            zellij action new-tab --layout "$tab_kdl" --name "$_t"
            (sleep 5 && rm -f "$tab_kdl" 2>/dev/null) &
            disown
            echo "  Opened tab: $_t"
            _j=$((_j + 1))
        done
    else
        local KDL_FILE
        KDL_FILE=$(mktemp "${TMPDIR:-/tmp}/work-build-XXXXXX")
        {
            echo "layout {"
            local _k=$_arr_start
            local _topic
            for _topic in "${created_topics[@]}"; do
                _kdl_render_tab "$_topic" "${session_dirs[$_k]}" "${session_prompts[$_k]}" "$claude_args"
                _k=$((_k + 1))
            done
            echo "}"
        } > "$KDL_FILE"

        local session_name="${p_name}-w${wave_idx}"
        echo "Launch the build session:"
        echo "  zellij --new-session-with-layout $KDL_FILE --session $session_name"
    fi

    echo ""
    echo "=== Build Wave $wave_idx Started ==="
    echo "  Pipeline: $pipeline_id"
    echo "  Base:     $base_branch"
    echo "  Sessions: ${#created_topics[@]}"
    echo "  PRs should target: $base_branch (not main)"
    echo ""
    echo "  Monitor: work status $pipeline_id"
    if (( wave_idx + 1 < wave_count )); then
        echo "  Next wave: work build $pipeline_id --wave $((wave_idx + 1))"
    else
        echo "  After all waves merge: work end $pipeline_id"
    fi
}

# ── Build Dispatcher ──────────────────────────────────────────────────────────
# Routes to pipeline build or legacy build based on first argument.

_work_build_dispatch() {
    local first_arg="${1:-}"

    if [[ -z "$first_arg" ]]; then
        echo "Error: argument required." >&2
        echo "Usage:" >&2
        echo "  work build <pipeline-id> [--wave N] [--yolo]   Pipeline build" >&2
        echo "  work build <manifest.yaml> [--wave N] [--yolo] Legacy manifest build" >&2
        return 1
    fi

    # If first arg is a .yaml or .yml file, use legacy build
    if [[ "$first_arg" == *.yaml || "$first_arg" == *.yml ]]; then
        _work_build "$@"
        return $?
    fi

    # If first arg is a file that exists, use legacy build
    if [[ -f "$first_arg" ]]; then
        _work_build "$@"
        return $?
    fi

    # Otherwise, treat as pipeline ID
    _work_pipeline_build "$@"
}
