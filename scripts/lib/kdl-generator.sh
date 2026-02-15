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

# ── Prompt Sanitization ──────────────────────────────────────────────────
# Escape and flatten a multi-line prompt for safe KDL embedding.
# Handles: double-quotes, backslashes, backticks, newlines → single space.
# Usage: sanitized=$(_kdl_sanitize_prompt "$raw_prompt")
_kdl_sanitize_prompt() {
    local raw="$1"
    # Escape backslashes first, then double-quotes, then backticks
    local escaped="${raw//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    escaped="${escaped//\`/\\\`}"
    # Collapse newlines to spaces, compress whitespace, trim
    echo "$escaped" | tr '\n' ' ' | sed 's/  */ /g; s/^ *//; s/ *$//'
}

# ── KDL Tab Rendering ────────────────────────────────────────────────────
# Render a single KDL tab block. Used by both _kdl_generate_wave and _work_build.
# Usage: _kdl_render_tab <tab_name> <cwd> [prompt] [claude_args]
#   Writes KDL to stdout. Caller redirects as needed.
#   If a prompt is provided, it is written to .session-prompt.md in the cwd
#   and Claude is told to read it (avoids KDL escaping issues with backticks/quotes).
#   claude_args are prepended as CLI flags (e.g., "--dangerously-skip-permissions").
_kdl_render_tab() {
    local tab_name="$1"
    local cwd="$2"
    local prompt="${3:-}"
    local claude_args="${4:-}"

    # Build KDL args line: [claude_args] [prompt_instruction]
    local args_parts=""
    [[ -n "$claude_args" ]] && args_parts="\"$claude_args\""

    if [[ -n "$prompt" && "$prompt" != "null" ]]; then
        # Write prompt to file in worktree (gitignored via .session-* pattern)
        local prompt_file="${cwd}/.session-prompt.md"
        mkdir -p "$cwd"
        echo "$prompt" > "$prompt_file"

        local prompt_instruction="Read .session-prompt.md for your task instructions, then follow them."
        if [[ -n "$args_parts" ]]; then
            args_parts="$args_parts \"$prompt_instruction\""
        else
            args_parts="\"$prompt_instruction\""
        fi
    fi

    if [[ -n "$args_parts" ]]; then
        cat <<KDL_TAB
    tab name="$tab_name" cwd="$cwd" {
        pane command="claude" {
            args $args_parts
        }
    }
KDL_TAB
    else
        cat <<KDL_TAB
    tab name="$tab_name" cwd="$cwd" {
        pane command="claude"
    }
KDL_TAB
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
