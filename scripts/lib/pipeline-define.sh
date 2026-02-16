#!/usr/bin/env bash
# pipeline-define.sh — Pipeline Define Command for Screen Print Pro
#
# Implements `work define <name>` — creates a new pipeline entity in the registry.
# A pipeline is an instance of development work with a lifecycle:
# ready → active → building → reviewing → wrapped → cooled.
#
# Usage: work define <name> [--type <type>] [--issue <number>] [--prompt "<text>"] [--auto]
#
# Source this file from work.sh (after pipeline-entity.sh and pipeline-registry.sh).

# ── Define Command ────────────────────────────────────────────────────────────

_work_define() {
    local name="" type="vertical" issue="" prompt="" auto=false
    local products="" tools=""

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --type)     type="${2:-}"; shift 2 ;;
            --issue)    issue="${2:-}"; shift 2 ;;
            --prompt)   prompt="${2:-}"; shift 2 ;;
            --auto)     auto=true; shift ;;
            --products) products="${2:-}"; shift 2 ;;
            --tools)    tools="${2:-}"; shift 2 ;;
            --*)        echo "Error: Unknown flag '$1'" >&2; return 1 ;;
            *)
                if [[ -z "$name" ]]; then
                    name="$1"
                else
                    echo "Error: Unexpected argument '$1'" >&2
                    return 1
                fi
                shift ;;
        esac
    done

    # Validate name
    if [[ -z "$name" ]]; then
        echo "Error: name required." >&2
        echo "Usage: work define <name> [--type <type>] [--issue <number>] [--prompt \"...\"] [--auto]" >&2
        return 1
    fi

    # Validate kebab-case
    if [[ ! "$name" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
        echo "Error: Name must be kebab-case (lowercase letters, numbers, hyphens)." >&2
        echo "  Got: '$name'" >&2
        return 1
    fi

    # Build _pipeline_create args
    local create_args=("$name" "$type")
    [[ -n "$products" ]] && create_args+=(--products "$products")
    [[ -n "$tools" ]]    && create_args+=(--tools "$tools")

    # Create pipeline entity
    local pipeline_id
    if ! pipeline_id=$(_pipeline_create "${create_args[@]}") || [[ -z "$pipeline_id" ]]; then
        echo "Error: Failed to create pipeline." >&2
        return 1
    fi

    # Set auto flag
    if [[ "$auto" == true ]]; then
        _pipeline_update_json "$pipeline_id" "auto" "true" || true
    fi

    # Link GitHub issue
    if [[ -n "$issue" ]]; then
        # Validate issue exists
        if ! gh issue view "$issue" --repo "$PRINT4INK_GH_REPO" --json number >/dev/null 2>&1; then
            echo "Warning: Could not verify GitHub issue #${issue}. Linking anyway." >&2
        fi
        _pipeline_update_json "$pipeline_id" "issue" "$issue" || true
    elif [[ -n "$prompt" ]]; then
        # Auto-create GitHub issue from prompt
        local issue_title="Pipeline: ${name}"
        local issue_body="$prompt"
        local created_issue
        created_issue=$(gh issue create --repo "$PRINT4INK_GH_REPO" \
            --title "$issue_title" --body "$issue_body" \
            --json number -q '.number' 2>/dev/null)
        if [[ -n "$created_issue" ]]; then
            _pipeline_update_json "$pipeline_id" "issue" "$created_issue" || true
            echo "  Created GitHub issue #${created_issue}"
        else
            echo "  Warning: Could not create GitHub issue. Continuing without." >&2
        fi
    fi

    # Create artifact directories
    _pipeline_init_dirs "$pipeline_id" 2>/dev/null

    # Get pipeline entity for display
    local entity
    entity=$(_pipeline_read "$pipeline_id")
    local p_type p_state p_stage p_auto p_issue
    p_type=$(echo "$entity" | jq -r '.type')
    p_state=$(echo "$entity" | jq -r '.state')
    p_stage=$(echo "$entity" | jq -r '.stage')
    p_auto=$(echo "$entity" | jq -r '.auto')
    p_issue=$(echo "$entity" | jq -r '.issue // "none"')

    # Display summary
    echo ""
    echo "=== Pipeline Defined ==="
    echo "  ID:      $pipeline_id"
    echo "  Name:    $name"
    echo "  Type:    $p_type"
    echo "  Stage:   $p_stage"
    echo "  State:   $p_state"
    echo "  Auto:    $p_auto"
    echo "  Issue:   $p_issue"
    echo ""
    echo "Next: work start $pipeline_id"
}
