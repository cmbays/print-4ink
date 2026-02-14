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
PRINT4INK_WORKTREES="$HOME/Github/print-4ink-worktrees"
PRINT4INK_MAX_WORKTREES=6
PRINT4INK_PORT_MIN=3001
PRINT4INK_PORT_MAX=3010

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

# ── Dispatcher ──────────────────────────────────────────────────────────────
work() {
    case "${1:-}" in
        # Phase commands (Wave 2 — stubs for now)
        research)   shift; _work_phase "research" "$@" ;;
        interview)  shift; _work_phase "interview" "$@" ;;
        breadboard) shift; _work_phase "breadboard" "$@" ;;
        plan)       shift; _work_phase "plan" "$@" ;;
        build)      shift; _work_build "$@" ;;
        polish)     shift; _work_phase "polish" "$@" ;;
        review)     shift; _work_phase "review" "$@" ;;
        learnings)  shift; _work_phase "learnings" "$@" ;;
        cooldown)   shift; _work_phase "cooldown" "$@" ;;

        # Session management
        sessions)   shift; _work_sessions "$@" ;;
        resume)     shift; _work_resume "$@" ;;
        fork)       shift; _work_fork "$@" ;;
        status)     _work_status ;;
        next)       _work_next ;;
        clean)      shift; _work_clean "$@" ;;

        # Utilities
        list)       _work_list ;;
        help|--help|-h|"")
            _work_help ;;

        # Legacy: bare topic (creates worktree + Zellij tab)
        --stack)
            shift
            local topic="${1:-}"
            [[ -z "$topic" ]] && { echo "Error: topic required. Usage: work --stack <topic> [--prompt \"...\"]"; return 1; }
            shift
            local prompt=""
            [[ "${1:-}" == "--prompt" ]] && prompt="${2:-}"
            local current_branch
            current_branch=$(git -C "$PWD" rev-parse --abbrev-ref HEAD 2>/dev/null)
            if [[ -z "$current_branch" || "$current_branch" == "HEAD" ]]; then
                echo "Error: Not in a git worktree. Use 'work <topic> <base-branch>' instead."
                return 1
            fi
            _work_new "$topic" "$current_branch" "$prompt"
            ;;
        *)
            # Parse: work <topic> [<base-branch>] [--prompt "..."]
            local topic="$1"; shift
            local base="main"
            local prompt=""
            if [[ "${1:-}" == "--prompt" ]]; then
                prompt="${2:-}"
            elif [[ -n "${1:-}" ]]; then
                base="$1"; shift
                [[ "${1:-}" == "--prompt" ]] && prompt="${2:-}"
            fi
            _work_new "$topic" "$base" "$prompt"
            ;;
    esac
}

# ── Help ────────────────────────────────────────────────────────────────────
_work_help() {
    cat <<'HELP'
work — Claude + Zellij Worktree Orchestrator

USAGE
  work <topic>                            New workstream: worktree + Zellij tab
  work <topic> <base-branch>             Related work: worktree + Zellij tab
  work --stack <topic>                    Stack from current branch (auto-detects $PWD)
  work <topic> --prompt "task desc"       Seed the new Claude with an initial prompt

PHASE COMMANDS
  work research <vertical>                Research phase (vertical-discovery skill)
  work interview <vertical>               Interview phase (requirements-interrogator)
  work breadboard <vertical>              Breadboarding phase (breadboarding skill)
  work plan <vertical>                    Implementation planning
  work build <manifest> [--wave N]        Execute build from YAML manifest (default: wave 0)
  work polish <vertical>                  Post-build polish
  work review <vertical>                  Quality gate + doc sync
  work learnings <vertical>               Cross-cutting pattern synthesis
  work cooldown <vertical>                5-step retrospective

SESSION MANAGEMENT
  work sessions [--vertical <name>]       List sessions from registry
  work resume <topic>                     Resume Claude session by topic
  work fork <new-topic> <source-topic>    Fork a session with new context
  work status                             Show all layers (registry, worktrees, Zellij, ports)
  work next                               AI recommendation: what to work on next

UTILITIES
  work list                               Show worktrees, Zellij sessions, ports
  work clean <topic>                      Remove worktree + Zellij + branch + registry
  work help                               This help text

EXAMPLES
  work invoicing-schema                                     # New workstream
  work invoicing-schema --prompt "Build the Zod schemas"    # With initial task
  work invoicing-ui session/0210-invoicing-schema           # Branch from parent
  work --stack invoicing-tests --prompt "Write tests"       # Stack from $PWD
  work research quoting                                     # Start quoting research
  work resume invoicing-schema                              # Resume Claude session
  work sessions --vertical quoting                          # List quoting sessions
  work clean invoicing-schema                               # Full cleanup

ZELLIJ NAVIGATION
  Ctrl+t       Tab mode (then arrows or number to switch)
  Alt+n        New pane
  Alt+←/→      Switch pane focus
  Ctrl+p       Pane mode
  Ctrl+s       Search (scroll mode)
  Alt+1..9     Quick tab switch

NOTES
  - Inside Zellij: new workstreams open as tabs in current session
  - Outside Zellij: creates a new Zellij session to attach to
  - Branch naming: session/<MMDD>-<topic> (auto-generated, kebab-case enforced)
  - Max 6 concurrent worktrees
  - Session registry: ~/Github/print-4ink-worktrees/.session-registry.json
HELP
}

# ── Create New Worktree + Zellij ────────────────────────────────────────────
_work_new() {
    local TOPIC="$1"
    local BASE="${2:-main}"
    local PROMPT="${3:-}"

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
    local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH}"

    # Safety: branch already exists?
    if git -C "$PRINT4INK_REPO" rev-parse --verify "$BRANCH" &>/dev/null; then
        echo "Error: Branch '$BRANCH' already exists."
        echo "  Use 'work clean ${TOPIC}' first, or choose a different topic name."
        return 1
    fi

    # Safety: worktree limit
    local COUNT
    COUNT=$(git -C "$PRINT4INK_REPO" worktree list | wc -l | tr -d ' ')
    if (( COUNT > PRINT4INK_MAX_WORKTREES )); then
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
        LAYOUT_FILE=$(mktemp "${TMPDIR:-/tmp}/work-tab-XXXXXX.kdl")

        {
            echo "layout {"
            if [[ -n "$PROMPT" ]]; then
                local SAFE_PROMPT
                SAFE_PROMPT=$(_kdl_sanitize_prompt "$PROMPT")
                cat <<KDL
    pane command="claude" cwd="$WORKTREE_DIR" {
        args "$SAFE_PROMPT"
    }
KDL
            else
                echo "    pane command=\"claude\" cwd=\"$WORKTREE_DIR\""
            fi
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
        SESSION_LAYOUT=$(mktemp "${TMPDIR:-/tmp}/work-session-XXXXXX.kdl")

        {
            echo "layout {"
            _kdl_render_tab "$TOPIC" "$WORKTREE_DIR" "$PROMPT"
            echo "}"
        } > "$SESSION_LAYOUT"

        echo ""
        echo "  Attach the new Zellij session:"
        echo "    zellij attach $TOPIC --create --layout $SESSION_LAYOUT"
        echo ""
        echo "  Or start it directly:"
        echo "    zellij --session $TOPIC --layout $SESSION_LAYOUT"
    fi

    # Register in session registry (only pass required args, let defaults handle the rest)
    if type _registry_add &>/dev/null; then
        _registry_add "$TOPIC" "$BRANCH"
    fi
}

# ── Phase Command (Generic Wrapper) ────────────────────────────────────────
# Usage: _work_phase <phase> <vertical> [--prompt "..."]
_work_phase() {
    local PHASE="$1"; shift
    local VERTICAL="${1:-}"
    local VALID_VERTICALS="quoting customer-management invoicing price-matrix jobs screen-room garments dashboard devx"

    [[ -z "$VERTICAL" ]] && {
        echo "Error: vertical required. Usage: work $PHASE <vertical>"
        echo "  Verticals: $VALID_VERTICALS"
        return 1
    }

    # Validate vertical against whitelist
    if [[ ! " $VALID_VERTICALS " == *" $VERTICAL "* ]]; then
        echo "Error: Unknown vertical '$VERTICAL'"
        echo "  Valid verticals: $VALID_VERTICALS"
        return 1
    fi
    shift

    # Parse optional --prompt
    local PROMPT=""
    [[ "${1:-}" == "--prompt" ]] && PROMPT="${2:-}"

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
    _work_new "$TOPIC" "main" "$PROMPT"

    # Update registry with vertical and stage info
    if type _registry_update &>/dev/null; then
        _registry_update "$TOPIC" "vertical" "$VERTICAL"
        _registry_update "$TOPIC" "stage" "$PHASE"
    fi
}

# ── Build from Manifest ─────────────────────────────────────────────────────
# Usage: work build <manifest.yaml> [--wave N]
#   Reads a YAML execution manifest and launches Zellij with one tab per session.
#   If --wave is omitted, defaults to wave 0 (first wave).
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

    # Parse --wave flag (default: 0)
    local WAVE_IDX=0
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --wave) WAVE_IDX="${2:-0}"; shift 2 ;;
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
    echo "  Wave $WAVE_IDX:   $WAVE_NAME"
    echo "  Mode:      $IS_SERIAL"
    echo ""

    # Compute MMDD once (not per iteration)
    local MMDD
    MMDD=$(date +%m%d)

    # Pull latest main once before creating any worktrees
    echo "Pulling latest main..."
    git -C "$PRINT4INK_REPO" pull origin main --quiet 2>/dev/null

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
        local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH}"

        if git -C "$PRINT4INK_REPO" rev-parse --verify "$BRANCH" &>/dev/null; then
            echo "  Branch '$BRANCH' already exists — skipping worktree creation"
        else
            # Create worktree
            if ! git -C "$PRINT4INK_REPO" worktree add "$WORKTREE_DIR" -b "$BRANCH" main --quiet; then
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

    # Generate KDL layout (for outside-Zellij use)
    local KDL_FILE
    KDL_FILE=$(mktemp "${TMPDIR:-/tmp}/work-build-XXXXXX.kdl")
    _kdl_generate_wave "$MANIFEST" "$WAVE_IDX" "$KDL_FILE" || {
        echo "Error: Failed to generate KDL layout"
        rm -f "$KDL_FILE"
        return 1
    }

    echo "=== KDL Layout Generated ==="
    echo "  File: $KDL_FILE"
    echo "  Sessions: ${#created_topics[@]}"
    echo ""

    if [[ -n "${ZELLIJ:-}" ]]; then
        # Inside Zellij: open each session as a new tab
        echo "Opening ${#created_topics[@]} tabs in current Zellij session..."
        local i
        for (( i=0; i<${#created_topics[@]}; i++ )); do
            local t="${created_topics[$i]}"
            local cwd="${session_dirs[$i]}"
            local tab_prompt="${session_prompts[$i]}"

            local tab_kdl
            tab_kdl=$(mktemp "${TMPDIR:-/tmp}/work-tab-XXXXXX.kdl")

            # Use the shared render helper for the tab layout
            {
                echo "layout {"
                _kdl_render_tab "$t" "$cwd" "$tab_prompt"
                echo "}"
            } > "$tab_kdl"

            zellij action new-tab --layout "$tab_kdl" --name "$t"
            (sleep 5 && rm -f "$tab_kdl" 2>/dev/null) &
            disown
            echo "  Opened tab: $t"
        done
    else
        # Outside Zellij: tell user to launch
        local session_name="${VERTICAL}-w${WAVE_IDX}"
        echo "Launch the build session:"
        echo "  zellij --session $session_name --layout $KDL_FILE"
        echo ""
        echo "Or attach to an existing session:"
        echo "  zellij attach $session_name --create --layout $KDL_FILE"
    fi

    echo ""
    echo "=== Build Wave $WAVE_IDX Started ==="
    echo "  Monitor: work sessions --vertical $VERTICAL"
    echo "  Status:  work status"
    if (( WAVE_IDX + 1 < WAVE_COUNT )); then
        echo "  Next:    work build $MANIFEST --wave $((WAVE_IDX + 1))"
    fi
}

# ── Next (Wave 3 — Stub) ───────────────────────────────────────────────────
_work_next() {
    echo "work next: Analyzing project state..."
    echo "  (Full implementation coming in Wave 3 — requires prompt template)"
    echo ""
    echo "  For now, check:"
    echo "    - ROADMAP.md for current priorities"
    echo "    - 'work sessions' for active work"
    echo "    - 'gh issue list --repo cmbays/print-4ink --label priority/high'"
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
    local port pid
    for port in $(seq $PRINT4INK_PORT_MIN $PRINT4INK_PORT_MAX); do
        pid=$(lsof -iTCP:$port -sTCP:LISTEN -t 2>/dev/null)
        [[ -n "$pid" ]] && echo "  :$port  IN USE (pid $pid)"
    done
}

# ── List (Quick Overview) ──────────────────────────────────────────────────
_work_list() {
    _work_show_infra
}

# ── Clean: Remove Worktree + Zellij + Branch + Registry ────────────────────
_work_clean() {
    local TOPIC="$1"
    [[ -z "$TOPIC" ]] && { echo "Error: topic required. Usage: work clean <topic>"; return 1; }

    # Find the branch matching this topic
    local MATCHES
    MATCHES=$(git -C "$PRINT4INK_REPO" branch --list "session/*-${TOPIC}" | tr -d ' *+')
    local MATCH_COUNT
    MATCH_COUNT=$(echo "$MATCHES" | grep -c . 2>/dev/null || echo 0)

    if [[ -z "$MATCHES" || "$MATCH_COUNT" -eq 0 ]]; then
        echo "Error: No branch found matching 'session/*-${TOPIC}'."
        echo "  Run 'work list' to see active worktrees."
        return 1
    fi

    if [[ "$MATCH_COUNT" -gt 1 ]]; then
        echo "Error: Multiple branches match '*-${TOPIC}':"
        echo "$MATCHES" | sed 's/^/  /'
        echo "  Use a more specific topic name."
        return 1
    fi

    local BRANCH="$MATCHES"

    local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH}"

    echo "Will clean up:"
    echo "  Branch:    $BRANCH"
    echo "  Worktree:  $WORKTREE_DIR"
    if type _registry_exists &>/dev/null && _registry_exists "$TOPIC"; then
        echo "  Registry:  session '$TOPIC'"
    fi
    echo ""
    echo -n "Proceed? [y/N] "
    read -r CONFIRM
    [[ "$CONFIRM" != [yY] ]] && { echo "Cancelled."; return 0; }

    # Close Zellij tab if running
    if [[ -n "$ZELLIJ" ]]; then
        # Try to close the tab by name (no direct API — inform user)
        echo "  Note: Close Zellij tab '$TOPIC' manually if still open."
    fi

    # Try closing Zellij session if one was created
    zellij kill-session "$TOPIC" 2>/dev/null && echo "  Closed Zellij session '$TOPIC'"

    # Also try tmux cleanup (migration period)
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

    # Archive in registry
    if type _registry_archive &>/dev/null && _registry_exists "$TOPIC"; then
        _registry_archive "$TOPIC"
        echo "  Archived session '$TOPIC' in registry"
    fi

    # Remove worktree
    if [[ -d "$WORKTREE_DIR" ]]; then
        git -C "$PRINT4INK_REPO" worktree remove "$WORKTREE_DIR" --force 2>/dev/null
        echo "  Removed worktree: $WORKTREE_DIR"
    fi

    # Delete branch
    git -C "$PRINT4INK_REPO" branch -d "$BRANCH" 2>/dev/null || \
        git -C "$PRINT4INK_REPO" branch -D "$BRANCH" 2>/dev/null
    echo "  Deleted branch: $BRANCH"

    echo "Done."
}
