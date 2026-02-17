#!/usr/bin/env bash
# kdl-generator.sh — Generate Zellij KDL layouts from YAML execution manifests
#
# Requires: yq (https://github.com/mikefarah/yq — brew install yq)
# Source this file from work.sh.

# ── Dependency Check ──────────────────────────────────────────────────────
# Call once at entry points (_work_build), not on every helper.
_kdl_check_deps() {
    if ! command -v yq &>/dev/null; then
        echo "Error: yq is required for manifest parsing." >&2
        echo "  Install: brew install yq" >&2
        return 1
    fi
}

# ── KDL Tab Rendering ────────────────────────────────────────────────────
# Render a single KDL tab block. Used by both _kdl_generate_wave and _work_build.
# Usage: _kdl_render_tab <tab_name> <cwd> [prompt] [claude_args]
#   Writes KDL to stdout. Caller redirects as needed.
#   If a prompt is provided, it is written to .session-prompt.md in the cwd
#   and Claude is told to read it (avoids KDL escaping issues with backticks/quotes).
#   claude_args are prepended as CLI flags (e.g., "--dangerously-skip-permissions").
#
#   Uses a launcher script (.session-launch.sh) so that when Claude exits,
#   the pane drops to an interactive shell instead of showing "Process exited".
_kdl_render_tab() {
    local tab_name="$1"
    local cwd="$2"
    local prompt="${3:-}"
    local claude_args="${4:-}"

    mkdir -p "$cwd"

    # Build the claude command for the launcher script
    local claude_cmd="claude"
    [[ -n "$claude_args" ]] && claude_cmd="claude $claude_args"

    if [[ -n "$prompt" && "$prompt" != "null" ]]; then
        # Write prompt to file in worktree (gitignored via .session-* pattern)
        echo "$prompt" > "${cwd}/.session-prompt.md"
        claude_cmd="$claude_cmd 'Read .session-prompt.md for your task instructions, then follow them.'"
    fi

    # Write launcher script: runs Claude, then drops to interactive shell.
    # Uses single quotes for the prompt instruction to avoid escaping issues.
    # exec replaces the process so the Zellij pane stays alive as an interactive shell.
    cat > "${cwd}/.session-launch.sh" <<LAUNCHER
#!/usr/bin/env zsh
$claude_cmd
exec zsh -i
LAUNCHER
    chmod +x "${cwd}/.session-launch.sh"

    cat <<KDL_TAB
    tab name="$tab_name" cwd="$cwd" {
        pane command="${cwd}/.session-launch.sh"
    }
KDL_TAB
}

# ── Layout Launch ──────────────────────────────────────────────────────────
# Launch a pre-built KDL layout file via Zellij using a 3-path dispatch:
#   Inside Zellij ($ZELLIJ set): opens a new tab, delayed cleanup
#   Outside + --no-launch:       prints attach command (temp file persists)
#   Outside (default):           auto-launches blocking session, cleanup after
#
# Usage: _kdl_launch_layout <layout_file> <session_name> [--no-launch]
#   layout_file:  path to a KDL layout file (caller creates with mktemp + chmod 600)
#   session_name: used as Zellij tab name (inside) or session name (outside)
#   --no-launch:  opt out of auto-launch; print attach command instead
_kdl_launch_layout() {
    local layout_file="$1"
    local session_name="$2"
    local no_launch=""

    if [[ "${3:-}" == "--no-launch" ]]; then
        no_launch="1"
    fi

    if [[ -n "${ZELLIJ:-}" ]]; then
        # Inside Zellij: add tab to current session
        zellij action new-tab --layout "$layout_file" --name "$session_name"
        echo "  Zellij:    tab '$session_name' opened"

        # Clean up temp file after Zellij reads it
        (sleep 5 && rm -f "$layout_file" 2>/dev/null) &
        disown
    elif [[ -n "$no_launch" ]]; then
        # No-launch mode: print attach command
        echo ""
        echo "  Zellij session ready. Attach with:"
        echo "    zellij --new-session-with-layout \"$layout_file\" --session \"$session_name\""
        echo ""
        echo "  (layout file is temporary — attach before next reboot)"
    else
        # Outside Zellij: auto-launch session (blocking)
        echo "  Launching Zellij session '$session_name'..."
        echo ""

        zellij --new-session-with-layout "$layout_file" --session "$session_name"

        # Cleanup after Zellij session ends
        rm -f "$layout_file" 2>/dev/null
    fi
}

# ── Layout Generation ─────────────────────────────────────────────────────
# Generate a Zellij KDL layout for a wave from a YAML manifest.
# Usage: _kdl_generate_wave <manifest_file> <wave_index> <output_file>
#   wave_index is 0-based.
#   worktree_base defaults to $PRINT4INK_WORKTREES if not set.
_kdl_generate_wave() {
    local manifest="$1"
    local wave_idx="$2"
    local output="$3"
    local worktree_base="${PRINT4INK_WORKTREES:?PRINT4INK_WORKTREES must be set}"

    [[ ! -f "$manifest" ]] && {
        echo "Error: Manifest not found: $manifest" >&2
        return 1
    }

    local vertical
    vertical=$(yq -r '.vertical // ""' "$manifest")
    [[ -z "$vertical" ]] && {
        echo "Error: Manifest missing 'vertical' field" >&2
        return 1
    }

    local wave_name
    wave_name=$(yq -r ".waves[$wave_idx].name // \"\"" "$manifest")
    [[ -z "$wave_name" ]] && {
        echo "Error: Wave $wave_idx not found in manifest" >&2
        return 1
    }

    local session_count
    session_count=$(yq ".waves[$wave_idx].sessions | length" "$manifest")
    if [[ -z "$session_count" || "$session_count" == "null" ]]; then
        echo "Error: Wave '$wave_name' is missing sessions" >&2
        return 1
    fi
    (( session_count == 0 )) && {
        echo "Error: Wave '$wave_name' has no sessions" >&2
        return 1
    }

    local mmdd
    mmdd=$(date +%m%d)

    # Build KDL layout
    {
        echo "layout {"

        local i topic prompt cwd
        for (( i=0; i<session_count; i++ )); do
            topic=$(yq -r ".waves[$wave_idx].sessions[$i].topic" "$manifest")
            prompt=$(yq -r ".waves[$wave_idx].sessions[$i].prompt // \"\"" "$manifest")
            cwd="${worktree_base}/session/${mmdd}-${topic}"

            _kdl_render_tab "$topic" "$cwd" "$prompt"
        done

        echo "}"
    } > "$output"
}

# ── Manifest Queries ──────────────────────────────────────────────────────
# These are lightweight yq wrappers. The caller (_work_build) should have
# already verified yq is available via _kdl_check_deps.

# Get wave count from manifest
_kdl_wave_count() {
    yq '.waves | length' "$1"
}

# Get wave name from manifest
_kdl_wave_name() {
    yq -r ".waves[$2].name // \"\"" "$1"
}

# Get session topics for a wave (one per line)
_kdl_wave_topics() {
    yq -r ".waves[$2].sessions[].topic" "$1"
}

# Check if a wave is serial (sessions run one at a time)
# Returns exit code: 0 = serial, 1 = parallel.
# Usage: if _kdl_wave_is_serial "$manifest" "$idx"; then ...
_kdl_wave_is_serial() {
    local val
    val=$(yq -r ".waves[$2].serial // \"false\"" "$1")
    [[ "$val" == "true" ]]
}

# Get a session field from manifest
# Usage: _kdl_session_detail <manifest> <wave_idx> <session_idx> <field>
_kdl_session_detail() {
    yq -r ".waves[$2].sessions[$3].$4 // \"\"" "$1"
}
