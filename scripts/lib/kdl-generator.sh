#!/usr/bin/env bash
# kdl-generator.sh — Generate Zellij KDL layouts from YAML execution manifests
#
# Requires: yq (https://github.com/mikefarah/yq — brew install yq)
# Source this file from work.sh.

# Check yq availability
_kdl_check_deps() {
    if ! command -v yq &>/dev/null; then
        echo "Error: yq is required for manifest parsing." >&2
        echo "  Install: brew install yq" >&2
        return 1
    fi
}

# Generate a Zellij KDL layout for a wave from a YAML manifest
# Usage: _kdl_generate_wave <manifest_file> <wave_index> <output_file>
#   wave_index is 0-based
_kdl_generate_wave() {
    _kdl_check_deps || return 1

    local manifest="$1"
    local wave_idx="$2"
    local output="$3"

    [[ ! -f "$manifest" ]] && {
        echo "Error: Manifest not found: $manifest" >&2
        return 1
    }

    local vertical
    vertical=$(yq '.vertical' "$manifest")
    [[ -z "$vertical" || "$vertical" == "null" ]] && {
        echo "Error: Manifest missing 'vertical' field" >&2
        return 1
    }

    local wave_name
    wave_name=$(yq ".waves[$wave_idx].name" "$manifest")
    [[ -z "$wave_name" || "$wave_name" == "null" ]] && {
        echo "Error: Wave $wave_idx not found in manifest" >&2
        return 1
    }

    local session_count
    session_count=$(yq ".waves[$wave_idx].sessions | length" "$manifest")
    [[ "$session_count" -eq 0 ]] && {
        echo "Error: Wave '$wave_name' has no sessions" >&2
        return 1
    }

    # Start KDL layout
    {
        echo "layout {"

        local i topic prompt stage cwd safe_prompt
        for (( i=0; i<session_count; i++ )); do
            topic=$(yq -r ".waves[$wave_idx].sessions[$i].topic" "$manifest")
            prompt=$(yq -r ".waves[$wave_idx].sessions[$i].prompt" "$manifest")
            stage=$(yq -r ".waves[$wave_idx].sessions[$i].stage // \"build\"" "$manifest")

            # Derive worktree path from topic
            local mmdd
            mmdd=$(date +%m%d)
            cwd="${PRINT4INK_WORKTREES}/session/${mmdd}-${topic}"

            # Escape double-quotes in prompt for KDL safety
            safe_prompt="${prompt//\"/\\\"}"
            # Collapse newlines to spaces for KDL args
            safe_prompt=$(echo "$safe_prompt" | tr '\n' ' ' | sed 's/  */ /g; s/^ *//; s/ *$//')

            if [[ -n "$safe_prompt" && "$safe_prompt" != "null" ]]; then
                cat <<KDL_TAB
    tab name="$topic" cwd="$cwd" {
        pane command="claude" {
            args "$safe_prompt"
        }
    }
KDL_TAB
            else
                cat <<KDL_TAB
    tab name="$topic" cwd="$cwd" {
        pane command="claude"
    }
KDL_TAB
            fi
        done

        echo "}"
    } > "$output"
}

# Get wave count from manifest
# Usage: _kdl_wave_count <manifest_file>
_kdl_wave_count() {
    _kdl_check_deps || return 1
    yq '.waves | length' "$1"
}

# Get wave name from manifest
# Usage: _kdl_wave_name <manifest_file> <wave_index>
_kdl_wave_name() {
    _kdl_check_deps || return 1
    yq ".waves[$2].name" "$1"
}

# Get session topics for a wave
# Usage: _kdl_wave_topics <manifest_file> <wave_index>
_kdl_wave_topics() {
    _kdl_check_deps || return 1
    yq -r ".waves[$2].sessions[].topic" "$1"
}

# Check if a wave is serial (sessions run one at a time)
# Usage: _kdl_wave_is_serial <manifest_file> <wave_index>
_kdl_wave_is_serial() {
    _kdl_check_deps || return 1
    local val
    val=$(yq ".waves[$2].serial // false" "$1")
    [[ "$val" == "true" ]]
}

# Get session details from manifest
# Usage: _kdl_session_detail <manifest_file> <wave_index> <session_index> <field>
_kdl_session_detail() {
    _kdl_check_deps || return 1
    yq -r ".waves[$2].sessions[$3].$4 // \"\"" "$1"
}
