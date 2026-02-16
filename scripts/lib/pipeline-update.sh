#!/usr/bin/env bash
# pipeline-update.sh — Pipeline Update Command for Screen Print Pro
#
# Implements `work update <pipeline-id> [flags]` — modifies pipeline fields
# after initial `work define`.
#
# Delegates to _pipeline_update (string fields) and _pipeline_update_json
# (boolean, number, array fields) from pipeline-entity.sh. State is protected
# — use lifecycle commands (work start, work end, etc.) instead.
#
# Source this file from work.sh (after pipeline-entity.sh).

_work_update() {
    local input="${1:-}"
    if [[ -z "$input" ]]; then
        echo "Usage: work update <pipeline-id> [--auto] [--no-auto] [--issue <n>] [--type <t>] [--products <list>] [--tools <list>]" >&2
        return 1
    fi
    shift

    # Resolve pipeline ID (accepts ID or name)
    local pipeline_id
    pipeline_id=$(_pipeline_resolve_id "$input") || return 1

    if [[ $# -eq 0 ]]; then
        echo "No updates specified. Use --auto, --no-auto, --issue, --type, --products, or --tools." >&2
        return 1
    fi

    local updated=0

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --auto)
                _pipeline_update_json "$pipeline_id" "auto" "true" || return 1
                ((updated++))
                shift ;;
            --no-auto)
                _pipeline_update_json "$pipeline_id" "auto" "false" || return 1
                ((updated++))
                shift ;;
            --issue)
                local issue_num="${2:?'--issue requires a value'}"
                # Validate issue exists on GitHub (best-effort)
                if ! gh issue view "$issue_num" --repo "$PRINT4INK_GH_REPO" --json number >/dev/null 2>&1; then
                    echo "Warning: Could not verify GitHub issue #${issue_num}. Linking anyway." >&2
                fi
                _pipeline_update_json "$pipeline_id" "issue" "$issue_num" || return 1
                ((updated++))
                shift 2 ;;
            --type)
                local new_type="${2:?'--type requires a value'}"
                _pipeline_validate_type "$new_type" || return 1
                _pipeline_update "$pipeline_id" "type" "$new_type" || return 1
                ((updated++))
                shift 2 ;;
            --products)
                local products_csv="${2:?'--products requires a value'}"
                local products_json
                products_json=$(echo "$products_csv" | jq -Rc 'split(",")')
                _pipeline_update_json "$pipeline_id" "products" "$products_json" || return 1
                ((updated++))
                shift 2 ;;
            --tools)
                local tools_csv="${2:?'--tools requires a value'}"
                local tools_json
                tools_json=$(echo "$tools_csv" | jq -Rc 'split(",")')
                _pipeline_update_json "$pipeline_id" "tools" "$tools_json" || return 1
                ((updated++))
                shift 2 ;;
            *)
                echo "Error: Unknown flag '$1'" >&2
                return 1 ;;
        esac
    done

    echo "Updated $updated field(s) on pipeline '$pipeline_id'."
    echo ""
    _work_pipeline_status "$pipeline_id"
}
