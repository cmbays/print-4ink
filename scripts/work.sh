#!/usr/bin/env bash
# work() — Claude + Tmux Worktree Orchestrator for Screen Print Pro
#
# Source this file in your shell profile:
#   source ~/Github/print-4ink/scripts/work.sh
#
# Then use: work <topic>, work list, work focus, work clean <topic>, etc.
#
# UX Model:
#   - New workstream (work <topic>) → detached tmux session. You attach from a new Ghostty pane.
#   - Related work (work <topic> <base>) → new window in parent's tmux session. Appears as a tab.
#   - Agent Teams → hook converts pane splits to windows in the same session.
#   - work focus → read-only tiled monitor of all windows in current session.

# ── Config ──────────────────────────────────────────────────────────────────
PRINT4INK_REPO="$HOME/Github/print-4ink"
PRINT4INK_WORKTREES="$HOME/Github/print-4ink-worktrees"
PRINT4INK_MAX_WORKTREES=6
PRINT4INK_PORT_MIN=3001
PRINT4INK_PORT_MAX=3010

# ── Dispatcher ──────────────────────────────────────────────────────────────
work() {
    case "${1:-}" in
        list)    _work_list ;;
        focus)   _work_focus ;;
        unfocus) _work_unfocus ;;
        clean)   _work_clean "$2" ;;
        help|--help|-h|"")
            _work_help ;;
        --stack)
            shift
            local topic="${1:-}"
            [[ -z "$topic" ]] && { echo "Error: topic required. Usage: work --stack <topic> [--prompt \"...\"]"; return 1; }
            shift
            local prompt=""
            [[ "${1:-}" == "--prompt" ]] && prompt="${2:-}"
            # Auto-detect current branch from $PWD
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
            # Next arg is either a base-branch or --prompt
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
work — Claude + Tmux Worktree Orchestrator

USAGE
  work <topic>                          New workstream: worktree + detached tmux session
  work <topic> <base-branch>           Related work: worktree + window in parent's session
  work --stack <topic>                  Stack from current branch (auto-detects $PWD)
  work <topic> --prompt "task desc"     Seed the new Claude with an initial prompt
  work list                             Show sessions, windows, worktrees, and ports
  work focus                            Read-only tiled monitor of all windows
  work unfocus                          Close monitor, return to original session
  work clean <topic>                    Remove worktree + tmux + branch
  work help                             This help text

WORKFLOW
  New workstream (new Ghostty pane needed):
    1. Claude tells you: work invoicing-schema
    2. You split a new pane in Ghostty
    3. Run: tmux attach -t invoicing-schema
    4. Claude is already running with your prompt

  Related work (Claude does this automatically):
    1. Claude runs: work invoicing-ui session/0210-invoicing-schema --prompt "..."
    2. New window appears in the "invoicing-schema" tmux session
    3. Navigate: Ctrl+b n (next window) or Ctrl+b w (window tree)

  Agent Teams (automatic):
    1. Claude uses TeamCreate → agents spawn via split-window
    2. after-split-window hook converts each pane to a window
    3. All agents appear as tabs in the same session

EXAMPLES
  work invoicing-schema                                     # New workstream
  work invoicing-schema --prompt "Build the Zod schemas"    # With initial task
  work invoicing-ui session/0210-invoicing-schema           # Window in parent
  work --stack invoicing-tests --prompt "Write tests"       # Stack from $PWD
  work focus                                                # Monitor all
  work clean invoicing-schema                               # Full cleanup

TMUX NAVIGATION
  Ctrl+b s   Session picker (switch between workstreams)
  Ctrl+b n   Next window (cycle agents/branches in session)
  Ctrl+b p   Previous window
  Ctrl+b w   Window tree (all sessions + windows)
  Ctrl+b z   Zoom pane (in focus view)

NOTES
  - New workstreams create detached sessions — attach from a new Ghostty pane
  - Related work creates windows in parent's session — no pane splitting needed
  - Branch naming: session/<MMDD>-<topic> (auto-generated, kebab-case enforced)
  - Max 6 concurrent worktrees
HELP
}

# ── Create New Worktree + Tmux ──────────────────────────────────────────────
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

    # ── Tmux Integration ────────────────────────────────────────────────────
    if [[ -n "$TMUX" ]]; then
        if [[ "$BASE" == "main" ]]; then
            # ── New workstream: detached tmux session ───────────────────────
            # Creates session in background. User attaches from a new Ghostty pane.
            tmux new-session -d -s "$TOPIC" -c "$WORKTREE_DIR"

            # Set hook to auto-convert Agent Teams panes → windows
            tmux set-hook -t "$TOPIC" after-split-window 'break-pane -t "#{hook_pane}"'

            # Launch Claude in the new session
            tmux send-keys -t "$TOPIC" "claude" Enter

            # Seed with initial prompt if provided
            if [[ -n "$PROMPT" ]]; then
                sleep 3
                tmux send-keys -t "$TOPIC" "$PROMPT" Enter
            fi

            echo "  Session:   $TOPIC (detached)"
            echo ""
            echo "  Attach from a new Ghostty pane:"
            echo "    tmux attach -t $TOPIC"

        else
            # ── Related work: new window in parent's tmux session ───────────
            # Finds the parent session and adds a window tab. No pane splitting.
            local PARENT_SESSION=""
            local sess

            # Strategy 1: Check if any session's windows are in the base branch worktree
            for sess in $(tmux list-sessions -F '#S' 2>/dev/null); do
                [[ "$sess" == focus-* ]] && continue
                local win_paths
                win_paths=$(tmux list-windows -t "$sess" -F '#{pane_current_path}' 2>/dev/null)
                if echo "$win_paths" | grep -q "${PRINT4INK_WORKTREES}/${BASE}" 2>/dev/null; then
                    PARENT_SESSION="$sess"
                    break
                fi
            done

            # Strategy 2: Match session name to base branch slug
            if [[ -z "$PARENT_SESSION" ]]; then
                local base_slug
                base_slug=$(echo "$BASE" | sed 's|session/[0-9]*-||')
                for sess in $(tmux list-sessions -F '#S' 2>/dev/null); do
                    [[ "$sess" == focus-* ]] && continue
                    if [[ "$sess" == "$base_slug" ]]; then
                        PARENT_SESSION="$sess"
                        break
                    fi
                done
            fi

            # Strategy 3: Check current session (Claude calling work for related work)
            if [[ -z "$PARENT_SESSION" ]]; then
                local current_session
                current_session=$(tmux display-message -p '#S' 2>/dev/null)
                if [[ -n "$current_session" && "$current_session" != focus-* ]]; then
                    PARENT_SESSION="$current_session"
                fi
            fi

            if [[ -n "$PARENT_SESSION" ]]; then
                # Create window WITHOUT switching to it (-d flag)
                tmux new-window -d -t "$PARENT_SESSION" -n "$TOPIC" -c "$WORKTREE_DIR"

                # Launch Claude
                tmux send-keys -t "${PARENT_SESSION}:${TOPIC}" "claude" Enter

                # Seed with initial prompt if provided
                if [[ -n "$PROMPT" ]]; then
                    sleep 3
                    tmux send-keys -t "${PARENT_SESSION}:${TOPIC}" "$PROMPT" Enter
                fi

                echo "  Window:    $TOPIC in session '$PARENT_SESSION'"
                echo "  Navigate:  Ctrl+b n (next) or Ctrl+b w (tree)"
            else
                # Fallback: create detached session if parent not found
                tmux new-session -d -s "$TOPIC" -c "$WORKTREE_DIR"
                tmux set-hook -t "$TOPIC" after-split-window 'break-pane -t "#{hook_pane}"'
                tmux send-keys -t "$TOPIC" "claude" Enter

                if [[ -n "$PROMPT" ]]; then
                    sleep 3
                    tmux send-keys -t "$TOPIC" "$PROMPT" Enter
                fi

                echo "  Session:   $TOPIC (parent not found, created detached session)"
                echo ""
                echo "  Attach from a new Ghostty pane:"
                echo "    tmux attach -t $TOPIC"
            fi
        fi
    else
        # ── Not in tmux: still create a detached session ────────────────
        # tmux new-session -d works fine outside tmux
        tmux new-session -d -s "$TOPIC" -c "$WORKTREE_DIR"
        tmux set-hook -t "$TOPIC" after-split-window 'break-pane -t "#{hook_pane}"'
        tmux send-keys -t "$TOPIC" "claude" Enter

        if [[ -n "$PROMPT" ]]; then
            sleep 3
            tmux send-keys -t "$TOPIC" "$PROMPT" Enter
        fi

        echo "  Session:   $TOPIC (detached)"
        echo ""
        echo "  Attach from a new Ghostty pane:"
        echo "    tmux attach -t $TOPIC"
    fi
}

# ── List Sessions ───────────────────────────────────────────────────────────
_work_list() {
    echo "=== Worktrees ==="
    git -C "$PRINT4INK_REPO" worktree list
    echo ""

    if [[ -n "$TMUX" ]]; then
        echo "=== Tmux Sessions ==="
        local sess
        for sess in $(tmux list-sessions -F '#S' 2>/dev/null); do
            # Skip focus sessions in main listing
            [[ "$sess" == focus-* ]] && continue
            echo "  [$sess]"
            tmux list-windows -t "$sess" -F '    #{window_index}: #{window_name}  #{pane_current_path}' 2>/dev/null
        done
    fi

    echo ""
    echo "=== Dev Server Ports ==="
    local port
    for port in $(seq $PRINT4INK_PORT_MIN $PRINT4INK_PORT_MAX); do
        local pid
        pid=$(lsof -iTCP:$port -sTCP:LISTEN -t 2>/dev/null)
        if [[ -n "$pid" ]]; then
            echo "  :$port  IN USE (pid $pid)"
        fi
    done
}

# ── Focus: Non-Destructive Tiled Monitor ────────────────────────────────────
_work_focus() {
    if [[ -z "$TMUX" ]]; then
        echo "Error: Not in a tmux session."
        return 1
    fi

    local SESSION
    SESSION=$(tmux display-message -p '#S')

    # Don't focus a focus session
    [[ "$SESSION" == focus-* ]] && { echo "Already in focus mode."; return 1; }

    local WINDOWS
    WINDOWS=$(tmux list-windows -t "$SESSION" -F '#I:#W')
    local COUNT
    COUNT=$(echo "$WINDOWS" | wc -l | tr -d ' ')

    if (( COUNT <= 1 )); then
        echo "Only 1 window in '$SESSION'. Nothing to tile."
        return 0
    fi

    local FOCUS="focus-${SESSION}"

    # Kill existing focus session if present
    tmux kill-session -t "$FOCUS" 2>/dev/null

    # Create focus session with first pane
    local FIRST_WIN
    FIRST_WIN=$(echo "$WINDOWS" | head -1 | cut -d: -f1)
    tmux new-session -d -s "$FOCUS" \
        "watch -n 0.5 -t 'tmux capture-pane -p -t \"${SESSION}:${FIRST_WIN}\" -S -50'"

    # Add remaining windows as panes (no hook — we WANT panes for tiled view)
    echo "$WINDOWS" | tail -n +2 | while IFS= read -r line; do
        local WIN_IDX
        WIN_IDX=$(echo "$line" | cut -d: -f1)
        tmux split-window -t "$FOCUS" \
            "watch -n 0.5 -t 'tmux capture-pane -p -t \"${SESSION}:${WIN_IDX}\" -S -50'"
        tmux select-layout -t "$FOCUS" tiled
    done

    tmux select-layout -t "$FOCUS" tiled
    tmux switch-client -t "$FOCUS"
    echo "Focus mode: $COUNT windows tiled. 'work unfocus' to exit."
}

# ── Unfocus: Return to Original Session ─────────────────────────────────────
_work_unfocus() {
    if [[ -z "$TMUX" ]]; then
        echo "Error: Not in a tmux session."
        return 1
    fi

    local SESSION
    SESSION=$(tmux display-message -p '#S')

    if [[ "$SESSION" != focus-* ]]; then
        echo "Not in focus mode."
        return 1
    fi

    local ORIGINAL="${SESSION#focus-}"
    tmux switch-client -t "$ORIGINAL"
    tmux kill-session -t "$SESSION"
    echo "Exited focus mode. Back to '$ORIGINAL'."
}

# ── Clean: Remove Worktree + Tmux + Branch ──────────────────────────────────
_work_clean() {
    local TOPIC="$1"
    [[ -z "$TOPIC" ]] && { echo "Error: topic required. Usage: work clean <topic>"; return 1; }

    # Find the branch matching this topic
    local BRANCH
    BRANCH=$(git -C "$PRINT4INK_REPO" branch --list "session/*-${TOPIC}" | tr -d ' *+' | head -1)

    if [[ -z "$BRANCH" ]]; then
        echo "Error: No branch found matching 'session/*-${TOPIC}'."
        echo "  Run 'work list' to see active worktrees."
        return 1
    fi

    local WORKTREE_DIR="${PRINT4INK_WORKTREES}/${BRANCH}"

    echo "Will clean up:"
    echo "  Branch:    $BRANCH"
    echo "  Worktree:  $WORKTREE_DIR"
    [[ -n "$TMUX" ]] && echo "  Tmux:      session/window '$TOPIC'"
    echo ""
    echo -n "Proceed? [y/N] "
    read -r CONFIRM
    [[ "$CONFIRM" != [yY] ]] && { echo "Cancelled."; return 0; }

    # Close tmux window or session
    if [[ -n "$TMUX" ]]; then
        # Try closing as a session first
        if tmux has-session -t "$TOPIC" 2>/dev/null; then
            # Kill focus session if it exists
            tmux kill-session -t "focus-${TOPIC}" 2>/dev/null
            tmux kill-session -t "$TOPIC" 2>/dev/null
            echo "  Closed tmux session '$TOPIC'"
        else
            # Try finding it as a window in any session
            local sess
            for sess in $(tmux list-sessions -F '#S' 2>/dev/null); do
                if tmux list-windows -t "$sess" -F '#W' | grep -q "^${TOPIC}$"; then
                    tmux kill-window -t "${sess}:${TOPIC}" 2>/dev/null
                    echo "  Closed tmux window '$TOPIC' in session '$sess'"
                    break
                fi
            done
        fi
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
