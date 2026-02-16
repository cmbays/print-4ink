#!/usr/bin/env bash
# pipeline-start.sh — Pre-build Orchestration for Screen Print Pro
#
# Implements `work start <pipeline-id>`:
#   1. Validates pipeline is in ready state
#   2. Creates ONE worktree for entire pre-build phase
#   3. Launches Claude session with pipeline context
#   4. Sequentially runs pre-build stages based on pipeline type's stage list
#   5. After each stage: validate gate, update pipeline state, record artifacts
#   6. Transitions: ready → active
#   7. After plan stage: if --auto, transition to building; else wait for approval
#
# Pre-build stages (up to "plan") are run in a single worktree with one Claude session.
# Build stage and beyond are handled by `work build` and `work end`.
#
# Source this file from work.sh (after pipeline-entity.sh, pipeline-registry.sh, pipeline-gates.sh).

# Pre-build stages are all stages BEFORE "build" in the pipeline type's stage list.
# These run in a single worktree with one Claude session.

# _poll_claude_session_id and _claude_projects_dir live in registry.sh
# (shared by pipeline-start.sh, pipeline-build.sh, and work.sh)

# ── Start Command ─────────────────────────────────────────────────────────────

_work_start() {
    local pipeline_id="${1:-}"
    shift 2>/dev/null || true

    # Parse flags
    local claude_args=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --yolo)         claude_args="${claude_args:+$claude_args }--dangerously-skip-permissions"; shift ;;
            --claude-args)  claude_args="${claude_args:+$claude_args }${2:-}"; shift 2 ;;
            *)              shift ;;
        esac
    done

    if [[ -z "$pipeline_id" ]]; then
        echo "Error: pipeline ID required." >&2
        echo "Usage: work start <pipeline-id> [--yolo] [--claude-args \"...\"]" >&2
        echo "" >&2
        echo "  Start pre-build stages for a defined pipeline." >&2
        echo "  The pipeline must be in 'ready' state." >&2
        echo "  See available pipelines: work status" >&2
        return 1
    fi

    # Resolve ID or name
    pipeline_id=$(_pipeline_resolve_id "$pipeline_id") || return 1

    # Validate state is 'ready'
    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 1
    local current_state
    current_state=$(echo "$entity" | jq -r '.state')

    if [[ "$current_state" != "ready" ]]; then
        echo "Error: Pipeline '$pipeline_id' is in state '$current_state', expected 'ready'." >&2
        echo "  Only pipelines in 'ready' state can be started." >&2
        return 1
    fi

    # Get pipeline details
    local p_name p_type p_auto p_issue
    p_name=$(echo "$entity" | jq -r '.name')
    p_type=$(echo "$entity" | jq -r '.type')
    p_auto=$(echo "$entity" | jq -r '.auto')
    p_issue=$(echo "$entity" | jq -r '.issue // empty')

    # Get pre-build stages (everything before "build")
    local all_stages prebuild_stages=() s
    all_stages=$(_pipeline_stages_for_type "$p_type")
    while IFS= read -r s; do
        [[ -z "$s" ]] && continue
        [[ "$s" == "build" ]] && break
        prebuild_stages+=("$s")
    done <<< "$all_stages"

    if [[ ${#prebuild_stages[@]} -eq 0 ]]; then
        echo "Pipeline type '$p_type' has no pre-build stages."
        echo "Transitioning directly to building..."
        _pipeline_transition "$pipeline_id" "active" || return 1
        _pipeline_transition "$pipeline_id" "building" || return 1
        echo ""
        echo "Next: work build $pipeline_id"
        return 0
    fi

    echo "=== work start ==="
    echo "  Pipeline:  $pipeline_id"
    echo "  Name:      $p_name"
    echo "  Type:      $p_type"
    echo "  Auto:      $p_auto"
    echo "  Issue:     ${p_issue:-none}"
    echo "  Stages:    ${prebuild_stages[*]}"
    echo ""

    # Transition to active
    _pipeline_transition "$pipeline_id" "active" || return 1

    # Create single worktree for pre-build
    local MMDD
    MMDD=$(date +%m%d)
    local BRANCH="session/${MMDD}-${p_name}-prebuild"
    local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH//\//-}"

    if git -C "$PRINT4INK_REPO" rev-parse --verify "$BRANCH" &>/dev/null; then
        echo "Branch '$BRANCH' already exists — reusing."
        WORKTREE_DIR=$(git -C "$PRINT4INK_REPO" worktree list --porcelain 2>/dev/null \
            | awk -v branch="$BRANCH" '/^worktree /{wt=$2} /^branch refs\/heads\//{if($2=="refs/heads/"branch) print wt}')
    else
        echo "Pulling latest main..."
        git -C "$PRINT4INK_REPO" pull origin main --quiet || true

        echo "Creating pre-build worktree..."
        git -C "$PRINT4INK_REPO" worktree add "$WORKTREE_DIR" -b "$BRANCH" main --quiet || return 1

        echo "Installing dependencies..."
        (cd "$WORKTREE_DIR" && npm install --silent 2>&1 | tail -1) || true
    fi

    # Track worktree in pipeline entity
    local worktrees_json
    worktrees_json=$(echo "$entity" | jq --arg wt "$BRANCH" '.worktrees + [$wt]')
    _pipeline_update_json "$pipeline_id" "worktrees" "$worktrees_json" || true

    # Ensure artifact directory exists
    _pipeline_init_dirs "$pipeline_id" 2>/dev/null
    local artifact_dir
    artifact_dir=$(_pipeline_artifact_dir "$pipeline_id")

    # Build context prompt for Claude
    local context_prompt
    context_prompt=$(_pipeline_build_start_prompt "$pipeline_id" "$artifact_dir" "${prebuild_stages[@]}")

    echo ""
    echo "  Branch:     $BRANCH"
    echo "  Worktree:   $WORKTREE_DIR"
    echo "  Artifacts:  $artifact_dir"
    echo ""

    # Register session
    if type _registry_add &>/dev/null; then
        _registry_add "${p_name}-prebuild" "$BRANCH"
        _registry_update "${p_name}-prebuild" "vertical" "$p_name"
        _registry_update "${p_name}-prebuild" "stage" "${prebuild_stages[0]}"
    fi

    # ── Session ID Capture (background) ──────────────────────────────
    # Poll for Claude's JSONL file and write session ID to registry.
    # Must start BEFORE Zellij launch so polling begins immediately.
    _poll_claude_session_id "${p_name}-prebuild" "$WORKTREE_DIR" &
    disown

    # ── Generate Zellij Layout ────────────────────────────────────────
    local LAYOUT_FILE
    LAYOUT_FILE=$(mktemp "${TMPDIR:-/tmp}/work-start-XXXXXX")
    chmod 600 "$LAYOUT_FILE"
    {
        echo "layout {"
        _kdl_render_tab "${p_name}-prebuild" "$WORKTREE_DIR" "$context_prompt" "$claude_args"
        echo "}"
    } > "$LAYOUT_FILE"

    echo ""
    echo "=== Pre-build Started ==="
    echo "  Pipeline: $pipeline_id"
    echo "  Stages:   ${prebuild_stages[*]}"
    echo "  Monitor:  work status $pipeline_id"

    # ── Launch via Zellij ─────────────────────────────────────────────
    if [[ -n "${ZELLIJ:-}" ]]; then
        # Inside Zellij — open a new tab in current session
        zellij action new-tab --layout "$LAYOUT_FILE" --name "${p_name}-prebuild"
        echo "  Zellij: tab '${p_name}-prebuild' opened"

        (sleep 5 && rm -f "$LAYOUT_FILE" 2>/dev/null) &
        disown
    else
        # Outside Zellij — create a new Zellij session (blocks until session ends)
        echo "  Launching Zellij session '${p_name}-prebuild'..."
        echo ""

        zellij --new-session-with-layout "$LAYOUT_FILE" --session "${p_name}-prebuild"

        # Cleanup after Zellij session ends
        rm -f "$LAYOUT_FILE" 2>/dev/null
    fi
}

# ── Build Start Prompt ────────────────────────────────────────────────────────

# Construct the context prompt that seeds the Claude pre-build session
# Usage: _pipeline_build_start_prompt <pipeline_id> <artifact_dir> <stage1> [<stage2> ...]
_pipeline_build_start_prompt() {
    local pipeline_id="$1"
    local artifact_dir="$2"
    shift 2
    local stages=("$@")

    local entity
    entity=$(_pipeline_read "$pipeline_id")
    local p_name p_type p_issue p_auto
    p_name=$(echo "$entity" | jq -r '.name')
    p_type=$(echo "$entity" | jq -r '.type')
    p_issue=$(echo "$entity" | jq -r '.issue // empty')
    p_auto=$(echo "$entity" | jq -r '.auto')
    local products tools
    products=$(echo "$entity" | jq -r '.products | join(", ")')
    tools=$(echo "$entity" | jq -r '.tools | join(", ")')

    local prompt="You are running pre-build stages for pipeline '$pipeline_id'.

## Pipeline Context
- **ID**: $pipeline_id
- **Name**: $p_name
- **Type**: $p_type ($(_pipeline_type_description "$p_type"))
- **Products**: ${products:-none yet}
- **Tools**: ${tools:-none yet}
- **Auto mode**: $p_auto
- **Artifact directory**: $artifact_dir"

    if [[ -n "$p_issue" ]]; then
        prompt+="
- **GitHub Issue**: #$p_issue — Read this issue first for full context"
    fi

    prompt+="

## Startup Sequence
1. Read CLAUDE.md for project context and standards
2. Read docs/ROADMAP.md for strategic context"

    if [[ -n "$p_issue" ]]; then
        prompt+="
3. Read GitHub issue #$p_issue (use: gh issue view $p_issue)"
    fi

    prompt+="

## Pre-build Stages (run sequentially)
"
    local idx=1 skill_hint
    for s in "${stages[@]}"; do
        skill_hint=$(_pipeline_stage_skill_hint "$s")
        prompt+="
### Stage $idx: $s
$skill_hint
- Output artifacts to: $artifact_dir/
- After completing: commit artifacts and push"
        idx=$((idx + 1))
    done

    prompt+="

## Artifact Checklist
After each stage, the following artifacts should exist in $artifact_dir/:
"
    local artifacts
    for s in "${stages[@]}"; do
        artifacts=$(_pipeline_gate_artifacts "$s")
        if [[ -n "$artifacts" ]]; then
            prompt+="
**$s stage:**"
            while IFS= read -r a; do
                [[ -z "$a" ]] && continue
                prompt+="
- [ ] $a"
            done <<< "$artifacts"
        fi
    done

    prompt+="

## Rules
- Work in the worktree directory (already set as cwd)
- Commit and push after each stage completion
- All artifacts go in: $artifact_dir/
- After the final stage (plan), the manifest.yaml enables \`work build\`"

    echo "$prompt"
}

# ── Helper: Pipeline Type Description ─────────────────────────────────────────

_pipeline_type_description() {
    local type="$1"
    jq -r --arg t "$type" '.[] | select(.slug == $t) | .description' "$(_pipeline_types_config)" 2>/dev/null
}

# ── Helper: Stage Skill Hints ─────────────────────────────────────────────────

_pipeline_stage_skill_hint() {
    local stage="$1"
    case "$stage" in
        research)
            echo "- Use the vertical-discovery skill for 7-step research methodology
- Use the feature-strategist agent for competitive analysis
- Output: research-findings.md" ;;
        interview)
            echo "- Use the requirements-interrogator agent for exhaustive questioning
- Use the gary-tracker skill to tag deferred questions
- This stage requires human interaction
- Output: interview-notes.md" ;;
        shape)
            echo "- Use the shaping skill (R x S methodology)
- Produce frame.md (requirements) and shaping.md (solution exploration)
- Output: frame.md, shaping.md" ;;
        breadboard)
            echo "- Use the breadboarding skill to map affordances and wiring
- Use the breadboard-reflection skill to audit for design smells
- Output: breadboard.md, reflection.md" ;;
        plan)
            echo "- Use the implementation-planning skill
- Produce a YAML execution manifest (manifest.yaml)
- Include waves, sessions, prompts, and dependency ordering
- Output: manifest.yaml" ;;
        *)
            echo "- Complete this stage and produce required artifacts" ;;
    esac
}

# ── Stage Advancement ─────────────────────────────────────────────────────────

# Advance pipeline to the next stage after gate validation
# Called after a pre-build stage completes
# Usage: _pipeline_advance_stage <pipeline_id>
_pipeline_advance_stage() {
    local pipeline_id="$1"

    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 1
    local current_stage p_auto
    current_stage=$(echo "$entity" | jq -r '.stage')
    p_auto=$(echo "$entity" | jq -r '.auto')

    # Check gate for current stage
    if ! _pipeline_check_gate "$pipeline_id" "$current_stage"; then
        echo "Gate not passed for stage '$current_stage'. Cannot advance." >&2
        return 1
    fi

    # Record stage completion timestamp in artifacts
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Get next stage
    local next_stage
    next_stage=$(_pipeline_gate_next "$current_stage")

    if [[ -z "$next_stage" || "$next_stage" == "null" ]]; then
        echo "Stage '$current_stage' is the final stage."
        return 0
    fi

    # If next stage is "build", pre-build is done
    if [[ "$next_stage" == "build" ]]; then
        _pipeline_update "$pipeline_id" "stage" "build"
        echo "Pre-build complete. Pipeline '$pipeline_id' ready for build."
        echo ""

        if [[ "$p_auto" == "true" ]]; then
            echo "Auto mode: transitioning to building..."
            _pipeline_transition "$pipeline_id" "building"
            echo "Next: work build $pipeline_id"
        else
            echo "Next: work build $pipeline_id"
            echo "  (Human approval of manifest required — run 'work build' when ready)"
        fi
        return 0
    fi

    # Advance to next stage
    _pipeline_update "$pipeline_id" "stage" "$next_stage"
    echo "Pipeline '$pipeline_id': advanced to stage '$next_stage'"
}
