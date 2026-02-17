#!/usr/bin/env bash
# work() — Claude + Zellij Worktree Orchestrator for Screen Print Pro
#
# Source this file in your shell profile:
#   source ~/Github/print-4ink/scripts/work.sh
#
# Then use: work <topic>, work list, work clean <topic>, etc.
#
# UX Model:
#   - New workstream (work <topic>) → Zellij tab or new session
#   - Related work (work <topic> <base>) → Zellij tab in current session
#   - Phase commands (work research <vertical>) → auto-named worktree + Claude with phase prompt
#   - Build (work build <manifest>) → multi-tab Zellij layout from YAML manifest
#   - Session management: resume, fork, sessions, status

# ── Config ──────────────────────────────────────────────────────────────────
PRINT4INK_REPO="$HOME/Github/print-4ink"
PRINT4INK_ROOT="$PRINT4INK_REPO"
PRINT4INK_WORKTREES="$HOME/Github/print-4ink-worktrees"
PRINT4INK_GH_REPO="cmbays/print-4ink"  # GitHub owner/repo for gh CLI
PRINT4INK_MAX_WORKTREES=15
PRINT4INK_PORT_MIN=3001
PRINT4INK_PORT_MAX=3015

# ── Source Libraries ────────────────────────────────────────────────────────
# Resolve script directory (works when sourced from both Zsh and Bash)
if [[ -n "${ZSH_VERSION:-}" ]]; then
    WORK_SCRIPT_DIR="${${(%):-%x}:a:h}"
else
    WORK_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
# shellcheck source=lib/registry.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/registry.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/registry.sh"
# shellcheck source=lib/kdl-generator.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/kdl-generator.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/kdl-generator.sh"
# shellcheck source=lib/pipeline-registry.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-registry.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-registry.sh"
# shellcheck source=lib/pipeline-entity.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-entity.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-entity.sh"
# shellcheck source=lib/pipeline-gates.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-gates.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-gates.sh"
# shellcheck source=lib/pipeline-define.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-define.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-define.sh"
# shellcheck source=lib/pipeline-update.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-update.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-update.sh"
# shellcheck source=lib/pipeline-status.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-status.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-status.sh"
# shellcheck source=lib/pipeline-start.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-start.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-start.sh"
# shellcheck source=lib/pipeline-build.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-build.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-build.sh"
# shellcheck source=lib/pipeline-end.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-end.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-end.sh"
# shellcheck source=lib/pipeline-cooldown.sh
[[ -f "${WORK_SCRIPT_DIR}/lib/pipeline-cooldown.sh" ]] && source "${WORK_SCRIPT_DIR}/lib/pipeline-cooldown.sh"

# ── Dispatcher ──────────────────────────────────────────────────────────────
work() {
    case "${1:-}" in
        # Pipeline lifecycle commands
        define)     shift; _work_define "$@" ;;
        update)     shift; _work_update "$@" ;;
        start)      shift; _work_start "$@" ;;
        build)      shift; _work_build_dispatch "$@" ;;
        end)        shift; _work_end "$@" ;;
        cooldown)   shift; _work_cooldown "$@" ;;
        status)     shift; _work_pipeline_status "$@" ;;

        # Legacy phase commands (still functional for non-pipeline usage)
        research)   shift; _work_phase "research" "$@" ;;
        interview)  shift; _work_phase "interview" "$@" ;;
        breadboard) shift; _work_phase "breadboard" "$@" ;;
        plan)       shift; _work_phase "plan" "$@" ;;
        polish)     shift; _work_phase "polish" "$@" ;;
        review)     shift; _work_phase "review" "$@" ;;
        learnings)  shift; _work_phase "learnings" "$@" ;;

        # Session management
        sessions)   shift; _work_sessions "$@" ;;
        resume)     shift; _work_resume "$@" ;;
        fork)       shift; _work_fork "$@" ;;
        next)       _work_next ;;
        clean)      shift; _work_clean "$@" ;;

        # Progress
        progress)   shift; _work_progress "$@" ;;

        # Utilities
        list)       _work_list ;;
        help|--help|-h|"")
            _work_help ;;

        # Legacy: bare topic (creates worktree + Zellij tab)
        --stack)
            shift
            local topic="${1:-}"
            [[ -z "$topic" ]] && { echo "Error: topic required. Usage: work --stack <topic> [--prompt \"...\"] [--yolo] [--claude-args \"...\"]"; return 1; }
            shift
            local prompt="" claude_args=""
            while [[ $# -gt 0 ]]; do
                case "$1" in
                    --prompt)       prompt="${2:-}"; shift 2 ;;
                    --yolo)         claude_args="${claude_args:+$claude_args }--dangerously-skip-permissions"; shift ;;
                    --claude-args)  claude_args="${claude_args:+$claude_args }${2:-}"; shift 2 ;;
                    *)              shift ;;
                esac
            done
            local current_branch
            current_branch=$(git -C "$PWD" rev-parse --abbrev-ref HEAD 2>/dev/null)
            if [[ -z "$current_branch" || "$current_branch" == "HEAD" ]]; then
                echo "Error: Not in a git worktree. Use 'work <topic> <base-branch>' instead."
                return 1
            fi
            _work_new "$topic" "$current_branch" "$prompt" "$claude_args"
            ;;
        *)
            # Parse: work <topic> [<base-branch>] [--prompt "..."] [--yolo] [--claude-args "..."]
            local topic="$1"; shift
            local base="main"
            local prompt="" claude_args=""
            # First non-flag arg after topic is the base branch
            if [[ -n "${1:-}" && "${1:0:2}" != "--" ]]; then
                base="$1"; shift
            fi
            while [[ $# -gt 0 ]]; do
                case "$1" in
                    --prompt)       prompt="${2:-}"; shift 2 ;;
                    --yolo)         claude_args="${claude_args:+$claude_args }--dangerously-skip-permissions"; shift ;;
                    --claude-args)  claude_args="${claude_args:+$claude_args }${2:-}"; shift 2 ;;
                    *)              shift ;;
                esac
            done
            _work_new "$topic" "$base" "$prompt" "$claude_args"
            ;;
    esac
}

# ── Help ────────────────────────────────────────────────────────────────────
_work_help() {
    cat <<'HELP'
work — Pipeline-Aware Worktree Orchestrator for Screen Print Pro

USAGE
  work <topic>                            New workstream: worktree + Zellij tab
  work <topic> <base-branch>             Related work: worktree + Zellij tab
  work --stack <topic>                    Stack from current branch (auto-detects $PWD)
  work <topic> --prompt "task desc"       Seed the new Claude with an initial prompt
  work <topic> --yolo                     Skip Claude permissions
  work <topic> --claude-args "..."        Pass arbitrary flags to Claude CLI

PIPELINE LIFECYCLE
  work define <name> [flags]              Create a pipeline entity (→ ready state)
    (flags are config-driven — run 'work define --help' for details)
  work update <pipeline-id> [flags]       Modify pipeline fields after define
    (flags are config-driven — run 'work update --help' for details)
  work start <pipeline-id>                Run pre-build stages (→ active state)
    --yolo                                  Skip Claude permissions
    --claude-args "..."                     Pass flags to Claude
  work build <pipeline-id> [flags]        Run build waves from manifest (→ building state)
    --wave N                                Start at wave N (default: 0)
    --yolo / --claude-args "..."            Passed to Claude sessions
  work build <manifest.yaml> [flags]      Legacy: build from YAML file directly
  work end <pipeline-id>                  Create final PR, poll for merge, wrap up (→ wrapped)
    --skip-poll                             Skip merge detection polling
  work cooldown                           Batch process all wrapped pipelines (→ cooled)
    --dry-run                               Preview without changes
    --skip-progress                         Skip PROGRESS.md update

PIPELINE STATUS
  work status                             Dashboard: all pipelines grouped by state
  work status <pipeline-id>               Deep dive: single pipeline detail

LEGACY PHASE COMMANDS
  work research <name>                    Research phase (vertical-discovery skill)
  work interview <name>                   Interview phase (requirements-interrogator)
  work breadboard <name>                  Breadboarding phase (breadboarding skill)
  work plan <name>                        Implementation planning
  work polish <name>                      Post-build polish
  work review <name>                      Quality gate + doc sync
  work learnings <name>                   Cross-cutting pattern synthesis
  (All phase commands accept --yolo and --claude-args)

SESSION MANAGEMENT
  work sessions [--vertical <name>]       List sessions from registry
  work resume <topic>                     Resume Claude session by topic
  work fork <new-topic> <source-topic>    Fork a session with new context
  work next                               AI recommendation: what to work on next

PROGRESS
  work progress                           Generate PROGRESS.md from live GitHub data
  work progress --output <path>           Write report to custom path

UTILITIES
  work list                               Show worktrees, Zellij sessions, ports
  work clean <topic>                      Remove worktree + Zellij + branch + registry
  work help                               This help text

PIPELINE LIFECYCLE FLOW
  define → start → build → end → cooldown
  (ready)  (active) (building) (reviewing→wrapped) (cooled)

EXAMPLES
  # Pipeline workflow
  work define colors --type vertical --issue 42         # Create pipeline
  work start 20260216-colors                            # Run pre-build stages
  work build 20260216-colors                            # Launch build waves
  work build 20260216-colors --wave 1                   # Next wave
  work end 20260216-colors                              # Final PR + wrap up
  work cooldown                                         # Process all wrapped

  # Ad-hoc workstreams (non-pipeline)
  work invoicing-schema                                 # New workstream
  work invoicing-schema --prompt "Build the Zod schemas"
  work --stack invoicing-tests --prompt "Write tests"   # Stack from $PWD

  # Session management
  work status                                           # Pipeline dashboard
  work status 20260216-colors                           # Pipeline detail
  work sessions --vertical quoting                      # List sessions
  work resume invoicing-schema                          # Resume Claude session
  work clean invoicing-schema                           # Full cleanup

NOTES
  - Pipeline IDs: YYYYMMDD-<topic> (e.g., 20260216-colors)
  - Branch naming: session/<MMDD>-<topic> for sessions, build/<pipeline-id> for base
  - Inside Zellij: new workstreams open as tabs in current session
  - Outside Zellij: creates a new Zellij session to attach to
  - Max 15 concurrent worktrees
  - Pipeline registry: ~/Github/print-4ink-worktrees/.pipeline-registry.json
  - Session registry: ~/Github/print-4ink-worktrees/.session-registry.json
HELP
}

# ── Create New Worktree + Zellij ────────────────────────────────────────────
_work_new() {
    local TOPIC="$1"
    local BASE="${2:-main}"
    local PROMPT="${3:-}"
    local CLAUDE_ARGS="${4:-}"

    # Validate topic
    [[ -z "$TOPIC" ]] && { echo "Error: topic required"; return 1; }

    # Validate topic format (kebab-case: lowercase letters, numbers, hyphens)
    if [[ ! "$TOPIC" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
        echo "Error: Topic must be kebab-case (lowercase letters, numbers, hyphens)."
        echo "  Got: '$TOPIC'"
        echo "  Example: work invoicing-schema"
        return 1
    fi

    local MMDD
    MMDD=$(date +%m%d)
    local BRANCH="session/${MMDD}-${TOPIC}"
    local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH//\//-}"

    # Safety: branch already exists?
    if git -C "$PRINT4INK_REPO" rev-parse --verify "$BRANCH" &>/dev/null; then
        echo "Error: Branch '$BRANCH' already exists."
        echo "  Use 'work clean ${TOPIC}' first, or choose a different topic name."
        return 1
    fi

    # Safety: worktree limit
    local COUNT
    COUNT=$(git -C "$PRINT4INK_REPO" worktree list | wc -l | tr -d ' ')
    if (( COUNT >= PRINT4INK_MAX_WORKTREES )); then
        echo "Warning: $COUNT worktrees active (max $PRINT4INK_MAX_WORKTREES)."
        echo "  Run 'work list' then 'work clean <topic>' first."
        return 1
    fi

    # Pull latest (only for main base)
    if [[ "$BASE" == "main" ]]; then
        echo "Pulling latest main..."
        git -C "$PRINT4INK_REPO" pull origin main || return 1
    fi

    # Ensure worktrees parent directory exists
    mkdir -p "$PRINT4INK_WORKTREES"

    # Create worktree (always from main repo)
    echo "Creating worktree..."
    git -C "$PRINT4INK_REPO" worktree add "$WORKTREE_DIR" -b "$BRANCH" "$BASE" || return 1

    # Install deps
    echo "Installing dependencies..."
    (cd "$WORKTREE_DIR" && npm install --silent 2>&1 | tail -1) || return 1

    # Find available port
    local PORT=$PRINT4INK_PORT_MIN
    while lsof -iTCP:$PORT -sTCP:LISTEN &>/dev/null && (( PORT <= PRINT4INK_PORT_MAX )); do
        PORT=$((PORT + 1))
    done
    if (( PORT > PRINT4INK_PORT_MAX )); then
        echo "Warning: No available ports in range $PRINT4INK_PORT_MIN-$PRINT4INK_PORT_MAX."
        PORT=$PRINT4INK_PORT_MIN
    fi

    # Write session context scratchpad
    cat > "${WORKTREE_DIR}/.session-context.md" <<CONTEXT
# Session: ${BRANCH}
# Created: $(date '+%Y-%m-%d %H:%M')
# Base: ${BASE}
# Port: ${PORT}

## Task
${PROMPT:-}

## Decisions

## Blockers
CONTEXT

    # Summary
    echo ""
    echo "  Branch:    $BRANCH"
    echo "  Directory: $WORKTREE_DIR"
    echo "  Port:      $PORT"
    echo "  Dev:       PORT=$PORT npm run dev"

    # ── Zellij Integration ───────────────────────────────────────────────────
    if [[ -n "${ZELLIJ:-}" ]]; then
        # ── Inside Zellij: add tab to current session ────────────────────
        local LAYOUT_FILE
        LAYOUT_FILE=$(mktemp "${TMPDIR:-/tmp}/work-tab-XXXXXX")

        {
            echo "layout {"
            _kdl_render_tab "$TOPIC" "$WORKTREE_DIR" "$PROMPT" "$CLAUDE_ARGS"
            echo "}"
        } > "$LAYOUT_FILE"

        zellij action new-tab --layout "$LAYOUT_FILE" --name "$TOPIC"
        echo "  Zellij:    tab '$TOPIC' opened"

        # Clean up temp file after Zellij reads it
        (sleep 5 && rm -f "$LAYOUT_FILE" 2>/dev/null) &
        disown
    else
        # ── Outside Zellij: create new session ───────────────────────────
        local SESSION_LAYOUT
        SESSION_LAYOUT=$(mktemp "${TMPDIR:-/tmp}/work-session-XXXXXX")

        {
            echo "layout {"
            _kdl_render_tab "$TOPIC" "$WORKTREE_DIR" "$PROMPT" "$CLAUDE_ARGS"
            echo "}"
        } > "$SESSION_LAYOUT"

        echo ""
        echo "  Start the new Zellij session:"
        echo "    zellij --new-session-with-layout $SESSION_LAYOUT --session $TOPIC"
    fi

    # Register in session registry (only pass required args, let defaults handle the rest)
    if type _registry_add &>/dev/null; then
        _registry_add "$TOPIC" "$BRANCH"
    fi

    # Capture Claude session ID in background (for `work resume`)
    if type _poll_claude_session_id &>/dev/null; then
        _poll_claude_session_id "$TOPIC" "$WORKTREE_DIR" &
        disown
    fi
}

# ── Phase Command (Generic Wrapper) ────────────────────────────────────────
# Usage: _work_phase <phase> <pipeline-name> [--prompt "..."] [--yolo] [--claude-args "..."]
_work_phase() {
    local PHASE="$1"; shift
    # NOTE: Variable named VERTICAL for backward compat with manifest .vertical field.
    # Wave 2 renames to PIPELINE_NAME when manifest schema migrates.
    local VERTICAL="${1:-}"

    [[ -z "$VERTICAL" ]] && {
        echo "Error: pipeline name required. Usage: work $PHASE <pipeline-name>"
        return 1
    }

    # Validate kebab-case format
    if [[ ! "$VERTICAL" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
        echo "Error: Pipeline name must be kebab-case (lowercase letters, numbers, hyphens)."
        echo "  Got: '$VERTICAL'"
        return 1
    fi
    shift

    # Parse optional flags
    local PROMPT=""
    local CLAUDE_ARGS=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --prompt)       PROMPT="${2:-}"; shift 2 ;;
            --yolo)         CLAUDE_ARGS="${CLAUDE_ARGS:+$CLAUDE_ARGS }--dangerously-skip-permissions"; shift ;;
            --claude-args)  CLAUDE_ARGS="${CLAUDE_ARGS:+$CLAUDE_ARGS }${2:-}"; shift 2 ;;
            *)              shift ;;
        esac
    done

    # Auto-generate topic name
    local TOPIC="${VERTICAL}-${PHASE}"

    # Load phase prompt template if available and no custom prompt given
    local PROMPT_FILE="${WORK_SCRIPT_DIR}/prompts/${PHASE}.md"
    if [[ -z "$PROMPT" && -f "$PROMPT_FILE" ]]; then
        # Gather context for template interpolation
        local KB_DIR="knowledge-base/src/content/sessions"
        local PRIOR_KB_DOCS=""
        if [[ -d "${PRINT4INK_REPO}/${KB_DIR}" ]]; then
            # Use a while-read loop to handle filenames with spaces safely
            local docs_list=""
            while IFS= read -r -d '' filepath; do
                local fname="${filepath##*/}"
                [[ -n "$docs_list" ]] && docs_list="${docs_list}, "
                docs_list="${docs_list}${fname}"
            done < <(find "${PRINT4INK_REPO}/${KB_DIR}" -maxdepth 1 -name "*-${VERTICAL}-*" -print0 2>/dev/null)
            PRIOR_KB_DOCS="$docs_list"
        fi
        local BREADBOARD_PATH="docs/breadboards/${VERTICAL}-breadboard.md"

        # Interpolate variables using parameter expansion (avoids sed delimiter conflicts)
        PROMPT=$(<"$PROMPT_FILE")
        PROMPT="${PROMPT//\{VERTICAL\}/$VERTICAL}"
        PROMPT="${PROMPT//\{PHASE\}/$PHASE}"
        PROMPT="${PROMPT//\{REPO\}/$PRINT4INK_REPO}"
        PROMPT="${PROMPT//\{PRIOR_KB_DOCS\}/$PRIOR_KB_DOCS}"
        PROMPT="${PROMPT//\{BREADBOARD_PATH\}/$BREADBOARD_PATH}"
        PROMPT="${PROMPT//\{KB_DIR\}/$KB_DIR}"
    elif [[ -z "$PROMPT" ]]; then
        PROMPT="You are starting the $PHASE phase for the $VERTICAL vertical. Read the CLAUDE.md and relevant docs first."
    fi

    # Create worktree + Zellij tab via _work_new
    _work_new "$TOPIC" "main" "$PROMPT" "$CLAUDE_ARGS"

    # Update registry with vertical and stage info
    if type _registry_update &>/dev/null; then
        _registry_update "$TOPIC" "vertical" "$VERTICAL"
        _registry_update "$TOPIC" "stage" "$PHASE"
    fi
}

# ── Build from Manifest ─────────────────────────────────────────────────────
# Usage: work build <manifest.yaml> [--wave N] [--yolo] [--claude-args "..."]
#   Reads a YAML execution manifest and launches Zellij with one tab per session.
#   If --wave is omitted, defaults to wave 0 (first wave).
#   --yolo passes --dangerously-skip-permissions to all Claude sessions.
_work_build() {
    local MANIFEST="${1:-}"
    [[ -n "$MANIFEST" ]] && shift

    if [[ -z "$MANIFEST" ]]; then
        echo "Error: manifest required. Usage: work build <manifest.yaml> [--wave N]"
        echo ""
        echo "  The manifest is a YAML file produced by the implementation-planning skill."
        echo "  It defines sessions, their prompts, and dependency ordering."
        return 1
    fi

    if [[ ! -f "$MANIFEST" ]]; then
        echo "Error: Manifest file not found: $MANIFEST"
        return 1
    fi

    # Check yq dependency once at entry
    _kdl_check_deps || return 1

    # Parse --wave, --yolo, and --claude-args flags (stackable)
    local WAVE_IDX=0
    local CLAUDE_ARGS=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --wave) WAVE_IDX="${2:-0}"; shift 2 ;;
            --yolo) CLAUDE_ARGS="${CLAUDE_ARGS:+$CLAUDE_ARGS }--dangerously-skip-permissions"; shift ;;
            --claude-args) CLAUDE_ARGS="${CLAUDE_ARGS:+$CLAUDE_ARGS }${2:-}"; shift 2 ;;
            *) echo "Error: Unknown flag '$1'"; return 1 ;;
        esac
    done

    # Validate manifest has required fields
    local VERTICAL
    VERTICAL=$(yq -r '.vertical // ""' "$MANIFEST")
    [[ -z "$VERTICAL" ]] && {
        echo "Error: Manifest missing required 'vertical' field"
        return 1
    }

    # Read baseBranch from manifest (defaults to "main" if not set)
    local BASE_BRANCH
    BASE_BRANCH=$(yq -r '.baseBranch // "main"' "$MANIFEST")

    # Validate wave exists
    local WAVE_COUNT
    WAVE_COUNT=$(_kdl_wave_count "$MANIFEST") || return 1
    if (( WAVE_IDX >= WAVE_COUNT )); then
        echo "Error: Wave $WAVE_IDX does not exist (manifest has $WAVE_COUNT waves: 0-$((WAVE_COUNT-1)))"
        return 1
    fi

    local WAVE_NAME
    WAVE_NAME=$(_kdl_wave_name "$MANIFEST" "$WAVE_IDX")
    local IS_SERIAL="parallel"
    _kdl_wave_is_serial "$MANIFEST" "$WAVE_IDX" && IS_SERIAL="serial"

    echo "=== work build ==="
    echo "  Manifest:  $MANIFEST"
    echo "  Vertical:  $VERTICAL"
    echo "  Base:      $BASE_BRANCH"
    echo "  Wave $WAVE_IDX:   $WAVE_NAME"
    echo "  Mode:      $IS_SERIAL"
    echo ""

    # Compute MMDD once (not per iteration)
    local MMDD
    MMDD=$(date +%m%d)

    # Pull latest base branch once before creating any worktrees
    echo "Pulling latest $BASE_BRANCH..."
    if ! git -C "$PRINT4INK_REPO" pull origin "$BASE_BRANCH" --quiet; then
        echo "Error: Failed to pull base branch '$BASE_BRANCH'." >&2
        echo "  Check the 'baseBranch' field in your execution manifest." >&2
        return 1
    fi

    # Create worktrees for all sessions in this wave
    local TOPICS
    TOPICS=$(_kdl_wave_topics "$MANIFEST" "$WAVE_IDX") || return 1

    local topic
    local session_idx=0
    local created_topics=()
    # Parallel arrays: store per-session data during creation for reuse in Zellij path
    local -a session_prompts=()
    local -a session_dirs=()

    while IFS= read -r topic; do
        [[ -z "$topic" ]] && continue
        echo "--- Creating session: $topic ---"

        local stage
        stage=$(_kdl_session_detail "$MANIFEST" "$WAVE_IDX" "$session_idx" "stage")
        [[ -z "$stage" ]] && stage="build"

        local prompt
        prompt=$(_kdl_session_detail "$MANIFEST" "$WAVE_IDX" "$session_idx" "prompt")

        # Prepend build-session-protocol skill invocation to prompt
        local full_prompt="Use the build-session-protocol skill to guide your workflow. ${prompt}"

        local BRANCH="session/${MMDD}-${topic}"
        local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH//\//-}"

        if git -C "$PRINT4INK_REPO" rev-parse --verify "$BRANCH" &>/dev/null; then
            echo "  Branch '$BRANCH' already exists — skipping worktree creation"
        else
            # Create worktree
            if ! git -C "$PRINT4INK_REPO" worktree add "$WORKTREE_DIR" -b "$BRANCH" "$BASE_BRANCH" --quiet; then
                echo "  Error creating worktree for $topic — skipping"
                session_idx=$((session_idx + 1))
                continue
            fi

            # Install deps (show last line for summary, but capture errors)
            local npm_output
            npm_output=$(cd "$WORKTREE_DIR" && npm install --silent 2>&1)
            local npm_exit=$?
            if [[ $npm_exit -ne 0 ]]; then
                echo "  Warning: npm install failed (exit $npm_exit)"
                echo "  $npm_output" | tail -3
            else
                echo "  $(echo "$npm_output" | tail -1)"
            fi
        fi

        # Register session
        if type _registry_add &>/dev/null; then
            _registry_add "$topic" "$BRANCH"
            if type _registry_update &>/dev/null; then
                _registry_update "$topic" "vertical" "$VERTICAL"
                _registry_update "$topic" "stage" "$stage"
            fi
            if type _registry_update_json &>/dev/null; then
                _registry_update_json "$topic" "wave" "$WAVE_IDX"
            fi
        fi

        created_topics+=("$topic")
        session_prompts+=("$full_prompt")
        session_dirs+=("$WORKTREE_DIR")
        echo "  Created: $WORKTREE_DIR"
        echo ""

        session_idx=$((session_idx + 1))
    done <<< "$TOPICS"

    if [[ ${#created_topics[@]} -eq 0 ]]; then
        echo "No sessions created."
        return 1
    fi

    # Generate KDL layout from parallel arrays (uses prefixed prompts, not raw manifest)
    # NOTE: This script is sourced into Zsh (arrays 1-indexed) despite #!/bin/bash shebang.
    # Use indexed for-in loop: iterate topics by value, track index for parallel arrays.
    local _arr_start=0
    [[ -n "${ZSH_VERSION:-}" ]] && _arr_start=1
    local KDL_FILE
    KDL_FILE=$(mktemp "${TMPDIR:-/tmp}/work-build-XXXXXX")
    {
        echo "layout {"
        local _k=$_arr_start
        local _topic
        for _topic in "${created_topics[@]}"; do
            _kdl_render_tab "$_topic" "${session_dirs[$_k]}" "${session_prompts[$_k]}" "$CLAUDE_ARGS"
            _k=$((_k + 1))
        done
        echo "}"
    } > "$KDL_FILE"

    echo "=== KDL Layout Generated ==="
    echo "  File: $KDL_FILE"
    echo "  Sessions: ${#created_topics[@]}"
    echo ""

    if [[ -n "${ZELLIJ:-}" ]]; then
        # Inside Zellij: open each session as a new tab
        echo "Opening ${#created_topics[@]} tabs in current Zellij session..."
        local _j=$_arr_start
        local _t
        for _t in "${created_topics[@]}"; do
            local cwd="${session_dirs[$_j]}"
            local tab_prompt="${session_prompts[$_j]}"

            local tab_kdl
            tab_kdl=$(mktemp "${TMPDIR:-/tmp}/work-tab-XXXXXX")

            # Use the shared render helper for the tab layout
            {
                echo "layout {"
                _kdl_render_tab "$_t" "$cwd" "$tab_prompt" "$CLAUDE_ARGS"
                echo "}"
            } > "$tab_kdl"

            zellij action new-tab --layout "$tab_kdl" --name "$_t"
            (sleep 5 && rm -f "$tab_kdl" 2>/dev/null) &
            disown
            echo "  Opened tab: $_t"
            _j=$((_j + 1))
        done
    else
        # Outside Zellij: tell user to launch
        local session_name="${VERTICAL}-w${WAVE_IDX}"
        echo "Launch the build session:"
        echo "  zellij --new-session-with-layout $KDL_FILE --session $session_name"
    fi

    echo ""
    echo "=== Build Wave $WAVE_IDX Started ==="
    echo "  Monitor: work sessions --vertical $VERTICAL"
    echo "  Status:  work status"
    if (( WAVE_IDX + 1 < WAVE_COUNT )); then
        echo "  Next:    work build $MANIFEST --wave $((WAVE_IDX + 1))"
    fi
}

# ── Next (AI-powered focus recommendation) ─────────────────────────────────
_work_next() {
    local PROMPT_FILE="${WORK_SCRIPT_DIR}/prompts/next.md"

    if [[ ! -f "$PROMPT_FILE" ]]; then
        echo "Error: Prompt template not found: $PROMPT_FILE"
        return 1
    fi

    if ! command -v claude &>/dev/null; then
        echo "Error: claude CLI not found. Install Claude Code first."
        return 1
    fi

    echo "Analyzing project state..."
    echo ""

    # Run Claude in print mode (non-interactive) with the next prompt
    claude -p "$(cat "$PROMPT_FILE")" --allowedTools "Bash(gh *)" "Bash(cat *)" "Bash(jq *)" "Read" "Grep" "Glob"
}

# ── Session Management ──────────────────────────────────────────────────────

# Resume a Claude session by topic
_work_resume() {
    local topic="$1"
    [[ -z "$topic" ]] && { echo "Usage: work resume <topic>"; return 1; }

    if ! type _registry_get &>/dev/null; then
        echo "Error: Session registry not loaded. Cannot look up sessions."
        return 1
    fi

    local session_id
    session_id=$(_registry_get "$topic" | jq -r '.claudeSessionId // empty')

    if [[ -z "$session_id" ]]; then
        echo "Error: No Claude session ID found for topic '$topic'"
        echo "  The session may not have been registered, or the ID wasn't captured."
        echo "  Run 'work sessions' to see registered sessions."
        echo ""
        echo "  Tip: You can find session IDs with:"
        echo "    ls -t ~/.claude/projects/*/*.jsonl | head -5"
        return 1
    fi

    echo "Resuming Claude session for '$topic'..."
    echo "  Session ID: $session_id"
    claude --resume "$session_id"
}

# Fork a session (create new worktree + link to source context)
_work_fork() {
    local new_topic="$1"
    local source_topic="$2"
    [[ -z "$new_topic" || -z "$source_topic" ]] && {
        echo "Usage: work fork <new-topic> <source-topic>"
        echo "  Creates a new worktree and links it to the source session's context."
        return 1
    }

    if ! type _registry_get &>/dev/null; then
        echo "Error: Session registry not loaded. Cannot look up sessions."
        return 1
    fi

    local source_id
    source_id=$(_registry_get "$source_topic" | jq -r '.claudeSessionId // empty')

    if [[ -z "$source_id" ]]; then
        echo "Error: No Claude session ID found for source topic '$source_topic'"
        echo "  Run 'work sessions' to see registered sessions."
        return 1
    fi

    # Create worktree for the fork
    _work_new "${new_topic}" "main" ""

    # Register with forkedFrom reference
    if type _registry_update &>/dev/null; then
        _registry_update "$new_topic" "forkedFrom" "$source_topic"
    fi

    echo ""
    echo "Fork created. Resume with forked context:"
    echo "  claude --resume $source_id --fork-session"
}

# List sessions from registry
_work_sessions() {
    local vertical_filter=""
    [[ "${1:-}" == "--vertical" ]] && vertical_filter="${2:-}"

    echo "=== Session Registry ==="
    if [[ -n "$vertical_filter" ]]; then
        # Use jq --arg for safe parameterized filtering (no injection)
        _registry_init
        local header=$'TOPIC\tSTATUS\tVERTICAL\tSTAGE\tBRANCH\tKB DOC'
        local rows
        rows=$(jq -r --arg v "$vertical_filter" \
            '.sessions[] | select(.vertical == $v) | "\(.topic)\t\(.status)\t\(.vertical)\t\(.stage)\t\(.branch)\t\(.kbDoc // "-")"' \
            "$REGISTRY_FILE" 2>/dev/null)
        if [[ -z "$rows" ]]; then
            echo "  (no sessions for vertical '$vertical_filter')"
        else
            printf '%s\n%s\n' "$header" "$rows" | column -t -s $'\t'
        fi
    else
        _registry_list
    fi
}

# Show status across all layers
_work_status() {
    echo "=== Active Sessions ==="
    if type _registry_list &>/dev/null; then
        _registry_list '.sessions[] | select(.status == "active")'
    else
        echo "  (registry not loaded)"
    fi
    echo ""

    _work_show_infra
}

# ── Shared Infrastructure Display ──────────────────────────────────────────
_work_show_infra() {
    echo "=== Worktrees ==="
    git -C "$PRINT4INK_REPO" worktree list
    echo ""

    echo "=== Zellij Sessions ==="
    zellij list-sessions 2>/dev/null || echo "  No Zellij sessions running"
    echo ""

    echo "=== Dev Server Ports ==="
    local port pid found=0
    for port in $(seq $PRINT4INK_PORT_MIN $PRINT4INK_PORT_MAX); do
        pid=$(lsof -iTCP:$port -sTCP:LISTEN -t 2>/dev/null)
        [[ -n "$pid" ]] && { echo "  :$port  IN USE (pid $pid)"; found=1; }
    done
    (( found == 0 )) && echo "  (no active dev servers)"
    return 0
}

# ── List (Quick Overview) ──────────────────────────────────────────────────
_work_list() {
    _work_show_infra
}

# ── Clean: Remove Worktree + Zellij + Branch + Registry ────────────────────
# Best-effort cleanup: each resource is cleaned independently so partial
# state (e.g., branch gone but Zellij session lingers) is handled gracefully.
_work_clean() {
    local TOPIC="$1"
    [[ -z "$TOPIC" ]] && { echo "Error: topic required. Usage: work clean <topic>"; return 1; }

    # ── Discovery phase: find what exists ──
    local BRANCH="" WORKTREE_DIR="" HAS_ZELLIJ=false HAS_TMUX=false HAS_REGISTRY=false
    local FOUND_ANYTHING=false

    # Try to find the branch matching this topic
    local MATCHES
    MATCHES=$(git -C "$PRINT4INK_REPO" branch --list "session/[0-9][0-9][0-9][0-9]-${TOPIC}" | tr -d ' *+')
    local MATCH_COUNT=0
    if [[ -n "$MATCHES" ]]; then
        MATCH_COUNT=$(echo "$MATCHES" | grep -c .)
    fi

    if [[ "$MATCH_COUNT" -gt 1 ]]; then
        echo "Error: Multiple branches match 'session/MMDD-${TOPIC}':"
        echo "$MATCHES" | sed 's/^/  /'
        echo "  Use a more specific topic name."
        return 1
    fi

    if [[ "$MATCH_COUNT" -eq 1 ]]; then
        BRANCH="$MATCHES"
        # Query git for the actual worktree path (handles both old session/ and new session- formats)
        WORKTREE_DIR=$(git -C "$PRINT4INK_REPO" worktree list --porcelain 2>/dev/null \
            | awk -v branch="$BRANCH" '/^worktree /{wt=$2} /^branch refs\/heads\//{if($2=="refs/heads/"branch) print wt}')
        FOUND_ANYTHING=true
    else
        # No branch — try to find worktree dir by pattern (covers already-deleted branches)
        # Use find to avoid zsh NOMATCH error (zsh expands globs before command runs)
        local candidate
        candidate=$(find "${PRINT4INK_WORKTREES}" -maxdepth 2 -type d -name "*-${TOPIC}" 2>/dev/null | head -1)
        if [[ -n "$candidate" && -d "$candidate" ]]; then
            WORKTREE_DIR="$candidate"
            FOUND_ANYTHING=true
        fi
    fi

    # Check Zellij session (strip ANSI codes before grep — zellij may colorize output)
    if zellij list-sessions 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | grep -q "^${TOPIC}"; then
        HAS_ZELLIJ=true
        FOUND_ANYTHING=true
    fi

    # Check tmux session/window
    if tmux has-session -t "$TOPIC" 2>/dev/null; then
        HAS_TMUX=true
        FOUND_ANYTHING=true
    elif tmux info &>/dev/null; then
        local sess
        for sess in $(tmux list-sessions -F '#S' 2>/dev/null); do
            if tmux list-windows -t "$sess" -F '#W' 2>/dev/null | grep -q "^${TOPIC}$"; then
                HAS_TMUX=true
                FOUND_ANYTHING=true
                break
            fi
        done
    fi

    # Check registry
    if type _registry_exists &>/dev/null && _registry_exists "$TOPIC"; then
        HAS_REGISTRY=true
        FOUND_ANYTHING=true
    fi

    # Nothing to clean?
    if [[ "$FOUND_ANYTHING" == false ]]; then
        echo "Nothing found for topic '$TOPIC'."
        echo "  No matching branch, worktree, Zellij session, tmux session, or registry entry."
        echo "  Run 'work list' to see active sessions."
        return 1
    fi

    # ── Preview phase ──
    echo "Will clean up:"
    [[ -n "$BRANCH" ]]       && echo "  Branch:    $BRANCH"
    [[ -n "$WORKTREE_DIR" && -d "$WORKTREE_DIR" ]] && echo "  Worktree:  $WORKTREE_DIR"
    [[ "$HAS_ZELLIJ" == true ]]   && echo "  Zellij:    session '$TOPIC'"
    [[ "$HAS_TMUX" == true ]]     && echo "  Tmux:      session/window '$TOPIC'"
    [[ "$HAS_REGISTRY" == true ]] && echo "  Registry:  session '$TOPIC'"
    echo ""
    echo -n "Proceed? [y/N] "
    read -r CONFIRM
    [[ "$CONFIRM" != [yY] ]] && { echo "Cancelled."; return 0; }

    # ── Cleanup phase ──
    # Order: resources first (worktree, branch), then metadata (registry),
    # then session kill last (may terminate our own shell).
    #
    # CWD safety: if we're inside the worktree we're about to delete,
    # cd out first — otherwise git worktree remove fails and subsequent
    # shell commands break (orphaned CWD).

    # 0. CWD safety — escape the worktree before deleting it
    #    Boundary-aware: match exact dir or any subdir (trailing /), not prefix siblings
    if [[ -n "$WORKTREE_DIR" && ( "$PWD" == "$WORKTREE_DIR" || "$PWD" == "$WORKTREE_DIR"/* ) ]]; then
        echo "  Moving to main repo (CWD is inside target worktree)..."
        cd "$PRINT4INK_REPO" || return 1
    fi

    # 1. Worktree
    if [[ -n "$WORKTREE_DIR" && -d "$WORKTREE_DIR" ]]; then
        # NB: local and assignment MUST be separate lines. In bash,
        # 'local var=$(cmd)' clobbers $? with local's exit status (always 0).
        local wt_err
        wt_err=$(git -C "$PRINT4INK_REPO" worktree remove "$WORKTREE_DIR" --force 2>&1)
        if [[ $? -eq 0 ]]; then
            echo "  Removed worktree: $WORKTREE_DIR"
        else
            echo "  FAILED to remove worktree: $WORKTREE_DIR"
            echo "$wt_err" | sed 's/^/    /'
            echo "  Skipping branch deletion (branch is still checked out in worktree)."
            echo "  Fix: close any processes using the worktree, then retry 'work clean $TOPIC'."
            # Skip branch deletion — it will fail if the worktree still exists
            BRANCH=""
        fi
    fi

    # 2. Branch (skipped if worktree removal failed — branch can't be deleted while checked out)
    if [[ -n "$BRANCH" ]]; then
        # NB: local and assignment MUST be separate lines (see worktree comment above).
        local br_err
        br_err=$(git -C "$PRINT4INK_REPO" branch -d "$BRANCH" 2>&1)
        if [[ $? -eq 0 ]]; then
            echo "  Deleted branch: $BRANCH"
        else
            # -d failed (unmerged?) — try -D
            br_err=$(git -C "$PRINT4INK_REPO" branch -D "$BRANCH" 2>&1)
            if [[ $? -eq 0 ]]; then
                echo "  Deleted branch: $BRANCH (force)"
            else
                echo "  FAILED to delete branch: $BRANCH"
                echo "$br_err" | sed 's/^/    /'
            fi
        fi
    fi

    # 3. Registry (before session kill — accepts the tradeoff that if the
    #    session kill fails, the entry is already archived. That failure is
    #    immediately obvious: you're still sitting in the session.)
    if [[ "$HAS_REGISTRY" == true ]]; then
        if _registry_archive "$TOPIC"; then
            echo "  Archived session '$TOPIC' in registry"
        else
            echo "  Warning: failed to archive session '$TOPIC' in registry"
        fi
    fi

    # 4. Tmux session/window (migration period — may kill current shell)
    if [[ "$HAS_TMUX" == true ]]; then
        if tmux has-session -t "$TOPIC" 2>/dev/null; then
            tmux kill-session -t "focus-${TOPIC}" 2>/dev/null
            tmux kill-session -t "$TOPIC" 2>/dev/null
            echo "  Closed tmux session '$TOPIC'"
        elif tmux info &>/dev/null; then
            local sess
            for sess in $(tmux list-sessions -F '#S' 2>/dev/null); do
                if tmux list-windows -t "$sess" -F '#W' 2>/dev/null | grep -q "^${TOPIC}$"; then
                    tmux kill-window -t "${sess}:${TOPIC}" 2>/dev/null
                    echo "  Closed tmux window '$TOPIC' in session '$sess'"
                    break
                fi
            done
        fi
    fi

    # 5. Zellij session (LAST — may kill our own shell if running inside it)
    if [[ "$HAS_ZELLIJ" == true ]]; then
        echo "  Deleting Zellij session '$TOPIC'..."
        zellij delete-session "$TOPIC" --force 2>/dev/null && echo "  Deleted Zellij session '$TOPIC'"
    fi

    echo "Done."
}

# ── Progress Report Generator ──────────────────────────────────────────────
# Usage: work progress [--output <path>]
#   Queries GitHub API and writes a PROGRESS.md report to repo root (or --output path).
#   Sections: Milestones, Now (priority/now), Next (priority/next),
#             Tracked In, Recent PRs, Stale (>30 days).
#   ~5 API calls total (1 GraphQL milestones, 1 now, 1 next, 1 GraphQL tracked,
#   1 recent PRs via --search, 1 stale via --search). All loops use @tsv extraction.
_work_progress() {
    # ── Local declarations (all at function top) ─────────────────────────────
    local OWNER="cmbays"
    local REPO="print-4ink"
    local OUTPUT="${PRINT4INK_ROOT:-}/PROGRESS.md"
    local TIMESTAMP
    local milestones_section milestones_data milestones_tsv
    local m_title m_due m_desc m_open m_closed m_total due_display
    local m_issues_tsv i_num i_title i_state
    local now_section now_tsv now_count now_items
    local next_section next_tsv next_count next_items
    local tracked_section tracked_tsv tracked_count tracked_items
    local t_num t_title t_parents
    local recent_section seven_days_ago recent_tsv recent_count recent_items
    local p_num p_title p_date
    local stale_section thirty_days_ago stale_tsv stale_count stale_items
    local s_num s_title s_updated
    local total_open report_content

    # ── Environment guard ────────────────────────────────────────────────────
    [[ -z "${PRINT4INK_ROOT:-}" ]] && {
        echo "Error: PRINT4INK_ROOT not set. Source work.sh properly."
        return 1
    }

    # ── Parse flags ──────────────────────────────────────────────────────────
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --output)
                [[ -z "${2:-}" ]] && { echo "Error: --output requires a path argument"; return 1; }
                OUTPUT="$2"; shift 2 ;;
            *) echo "Unknown flag: $1"; return 1 ;;
        esac
    done

    # ── Pre-flight checks ────────────────────────────────────────────────────
    if ! command -v gh &>/dev/null; then
        echo "Error: gh CLI not found. Install GitHub CLI first."
        return 1
    fi

    if ! command -v jq &>/dev/null; then
        echo "Error: jq not found. Install with: brew install jq"
        return 1
    fi

    if ! gh auth status &>/dev/null; then
        echo "Error: GitHub CLI not authenticated. Run: gh auth login"
        return 1
    fi

    echo "Generating progress report..."

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M %Z')

    # ── Section 1: Milestones (single GraphQL query) ─────────────────────────
    milestones_section=""
    milestones_data=$(gh api graphql \
        -F owner="$OWNER" -F repo="$REPO" \
        -f query='
        query($owner: String!, $repo: String!) {
            repository(owner: $owner, name: $repo) {
                milestones(first: 20, states: OPEN, orderBy: {field: DUE_DATE, direction: ASC}) {
                    nodes {
                        title
                        dueOn
                        description
                        closedIssues: issues(states: CLOSED) { totalCount }
                        openIssues: issues(states: OPEN) { totalCount }
                        issues(first: 50, orderBy: {field: CREATED_AT, direction: ASC}) {
                            nodes { number title state }
                        }
                    }
                }
            }
        }') || {
        milestones_section="## Milestones"$'\n'"[Warning: Failed to fetch milestones]"$'\n'
        milestones_data=""
    }

    if [[ -n "$milestones_data" ]]; then
        # Extract milestone-level data as TSV (title, dueOn, description, openCount, closedCount)
        milestones_tsv=$(printf '%s' "$milestones_data" | jq -r '
            .data.repository.milestones.nodes[] |
            [.title, (.dueOn // ""), (.description // ""),
             (.openIssues.totalCount | tostring), (.closedIssues.totalCount | tostring)] | @tsv')

        if [[ -z "$milestones_tsv" ]]; then
            milestones_section="## Milestones"$'\n'"None."$'\n'
        else
            milestones_section="## Milestones"$'\n'
            while IFS=$'\t' read -r m_title m_due m_desc m_open m_closed; do
                m_total=$(( ${m_open:-0} + ${m_closed:-0} ))

                due_display=""
                if [[ -n "$m_due" ]]; then
                    due_display=" (${m_due:0:10})"
                fi

                milestones_section+=$'\n'"### ${m_title}${due_display} — ${m_closed}/${m_total} complete"$'\n'
                [[ -n "$m_desc" ]] && milestones_section+="${m_desc}"$'\n'

                # Extract issues for this milestone as TSV (number, title, state)
                m_issues_tsv=$(printf '%s' "$milestones_data" | jq -r --arg mt "$m_title" '
                    .data.repository.milestones.nodes[] | select(.title == $mt) |
                    .issues.nodes[] | [(.number | tostring), .title, .state] | @tsv')

                if [[ -n "$m_issues_tsv" ]]; then
                    while IFS=$'\t' read -r i_num i_title i_state; do
                        if [[ "$i_state" == "CLOSED" ]]; then
                            milestones_section+="- [x] #${i_num} ${i_title}"$'\n'
                        else
                            milestones_section+="- [ ] #${i_num} ${i_title}"$'\n'
                        fi
                    done <<< "$m_issues_tsv"
                fi
            done <<< "$milestones_tsv"
        fi
    fi

    # ── Section 2: Now (priority/now) ────────────────────────────────────────
    now_tsv=$(gh issue list --repo "${OWNER}/${REPO}" \
        -l "priority/now" --state open --limit 100 \
        --json number,title --jq '.[] | [(.number | tostring), .title] | @tsv') || {
        now_section="## Now (priority/now)"$'\n'"[Warning: Failed to fetch priority/now issues]"$'\n'
        now_tsv=""
    }

    if [[ -n "$now_tsv" ]]; then
        now_count=0
        now_items=""
        while IFS=$'\t' read -r i_num i_title; do
            now_items+="- #${i_num} ${i_title}"$'\n'
            now_count=$((now_count + 1))
        done <<< "$now_tsv"
        now_section="## Now (priority/now) -- ${now_count} items"$'\n'
        now_section+="*May include milestone-assigned issues.*"$'\n'
        now_section+="${now_items}"
    elif [[ -z "${now_section:-}" ]]; then
        now_section="## Now (priority/now) -- 0 items"$'\n'"None."$'\n'
    fi

    # ── Section 3: Next (priority/next) ──────────────────────────────────────
    next_tsv=$(gh issue list --repo "${OWNER}/${REPO}" \
        -l "priority/next" --state open --limit 100 \
        --json number,title --jq '.[] | [(.number | tostring), .title] | @tsv') || {
        next_section="## Next (priority/next)"$'\n'"[Warning: Failed to fetch priority/next issues]"$'\n'
        next_tsv=""
    }

    if [[ -n "$next_tsv" ]]; then
        next_count=0
        next_items=""
        while IFS=$'\t' read -r i_num i_title; do
            next_items+="- #${i_num} ${i_title}"$'\n'
            next_count=$((next_count + 1))
        done <<< "$next_tsv"
        next_section="## Next (priority/next) -- ${next_count} items"$'\n'"${next_items}"
    elif [[ -z "${next_section:-}" ]]; then
        next_section="## Next (priority/next) -- 0 items"$'\n'"None."$'\n'
    fi

    # ── Section 4: Tracked In (sub-issue hierarchy, paginated GraphQL) ───────
    tracked_tsv=$(gh api graphql --paginate \
        -F owner="$OWNER" -F repo="$REPO" \
        -f query='
        query($owner: String!, $repo: String!, $endCursor: String) {
            repository(owner: $owner, name: $repo) {
                issues(first: 100, states: OPEN, after: $endCursor) {
                    pageInfo { hasNextPage endCursor }
                    nodes {
                        number
                        title
                        trackedInIssues(first: 5) {
                            nodes { number title }
                        }
                    }
                }
            }
        }' --jq '
        .data.repository.issues.nodes[] |
        select(.trackedInIssues.nodes | length > 0) |
        [(.number | tostring), .title,
         ([.trackedInIssues.nodes[] | "#\(.number)"] | join(", "))] | @tsv') || {
        tracked_section="## Tracked In"$'\n'"[Warning: Failed to fetch tracked-in data]"$'\n'
        tracked_tsv=""
    }

    if [[ -n "$tracked_tsv" ]]; then
        tracked_count=0
        tracked_items=""
        while IFS=$'\t' read -r t_num t_title t_parents; do
            tracked_items+="- #${t_num} ${t_title} (tracked in ${t_parents})"$'\n'
            tracked_count=$((tracked_count + 1))
        done <<< "$tracked_tsv"
        tracked_section="## Tracked In -- ${tracked_count} items"$'\n'
        tracked_section+="*Shows issues tracked within parent issues (sub-issue hierarchy).*"$'\n'
        tracked_section+="${tracked_items}"
    elif [[ -z "${tracked_section:-}" ]]; then
        tracked_section="## Tracked In -- 0 items"$'\n'"None."$'\n'
    fi

    # ── Section 5: Recent PRs (last 7 days, server-side date filter) ─────────
    seven_days_ago=$(date -v-7d '+%Y-%m-%d' 2>/dev/null || date -d '7 days ago' '+%Y-%m-%d' 2>/dev/null)

    if [[ -z "$seven_days_ago" ]]; then
        recent_section="## Recent PRs (last 7 days)"$'\n'"Unable to compute date filter."$'\n'
    else
        recent_tsv=$(gh pr list --repo "${OWNER}/${REPO}" \
            --state merged \
            --search "merged:>=${seven_days_ago}" \
            --limit 30 \
            --json number,title,mergedAt \
            --jq '.[] | [(.number | tostring), .title, (.mergedAt[:10])] | @tsv') || {
            recent_section="## Recent PRs (last 7 days)"$'\n'"[Warning: Failed to fetch recent PRs]"$'\n'
            recent_tsv=""
        }

        if [[ -n "$recent_tsv" ]]; then
            recent_count=0
            recent_items=""
            while IFS=$'\t' read -r p_num p_title p_date; do
                recent_items+="- PR #${p_num} ${p_title} (merged ${p_date})"$'\n'
                recent_count=$((recent_count + 1))
            done <<< "$recent_tsv"
            recent_section="## Recent PRs (last 7 days) -- ${recent_count} items"$'\n'"${recent_items}"
        elif [[ -z "${recent_section:-}" ]]; then
            recent_section="## Recent PRs (last 7 days) -- 0 items"$'\n'"None."$'\n'
        fi
    fi

    # ── Section 6: Stale (>30 days, server-side date filter) ─────────────────
    thirty_days_ago=$(date -v-30d '+%Y-%m-%d' 2>/dev/null || date -d '30 days ago' '+%Y-%m-%d' 2>/dev/null)

    if [[ -z "$thirty_days_ago" ]]; then
        stale_section="## Stale (>30 days)"$'\n'"Unable to compute stale threshold."$'\n'
    else
        stale_tsv=$(gh issue list --repo "${OWNER}/${REPO}" \
            --state open \
            --search "updated:<${thirty_days_ago}" \
            --limit 200 \
            --json number,title,updatedAt \
            --jq '.[] | [(.number | tostring), .title, (.updatedAt[:10])] | @tsv') || {
            stale_section="## Stale (>30 days)"$'\n'"[Warning: Failed to fetch stale issues]"$'\n'
            stale_tsv=""
        }

        if [[ -n "$stale_tsv" ]]; then
            stale_count=0
            stale_items=""
            while IFS=$'\t' read -r s_num s_title s_updated; do
                stale_items+="- #${s_num} ${s_title} (last updated ${s_updated})"$'\n'
                stale_count=$((stale_count + 1))
            done <<< "$stale_tsv"
            stale_section="## Stale (>30 days) -- ${stale_count} items"$'\n'"${stale_items}"
        elif [[ -z "${stale_section:-}" ]]; then
            stale_section="## Stale (>30 days) -- 0 items"$'\n'"None."$'\n'
        fi
    fi

    # ── Derive summary count from already-fetched data ───────────────────────
    # Count unique open issues across now + next + stale (avoids extra API call)
    total_open=$(( ${now_count:-0} + ${next_count:-0} + ${stale_count:-0} + ${tracked_count:-0} ))

    # ── Assemble & write report ──────────────────────────────────────────────
    report_content="# Progress Report
Generated: ${TIMESTAMP}

${milestones_section}
${now_section}
${next_section}
${tracked_section}
${recent_section}
${stale_section}"

    if ! printf '%s\n' "$report_content" > "$OUTPUT"; then
        echo "Error: Failed to write report to ${OUTPUT}"
        return 1
    fi

    echo "Written to ${OUTPUT}"
    echo ""
    echo "  Open issues (approx): ${total_open}"
    echo "  Report: ${OUTPUT}"
}
