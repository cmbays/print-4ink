#!/usr/bin/env bash
# pipeline-define.sh — Config-Driven Pipeline Define Command
#
# Implements `work define <name> [flags]` — creates a new pipeline entity.
# Reads config/pipeline-fields.json to determine which flags are valid and
# how to validate/apply them. The --prompt flag is define-specific (not in schema).
#
# Adding a new updatable field to pipeline-fields.json automatically makes it
# available as a CLI flag here — zero code changes needed.
#
# Source this file from work.sh (after pipeline-entity.sh and pipeline-registry.sh).

# ── Define Command ────────────────────────────────────────────────────────────

_work_define() {
    # Handle --help before anything else
    if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
        _work_define_help
        return 0
    fi

    local config
    config="$(_pipeline_fields_config)"
    if [[ ! -f "$config" ]]; then
        echo "Error: Pipeline fields config not found: $config" >&2
        return 1
    fi

    local name="" prompt=""
    # JSON accumulator for schema-driven fields (Zsh-safe — no associative arrays)
    local collected="{}"

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --prompt)
                # Define-specific: not in schema
                if [[ -z "${2:-}" ]]; then
                    echo "Error: --prompt requires a value." >&2
                    return 1
                fi
                prompt="$2"
                shift 2
                ;;
            --help|-h)
                _work_define_help
                return 0
                ;;
            --*)
                # Look up flag in schema
                local flag="$1"
                local field_name json_type is_negate
                is_negate=false

                # Try matching as a regular flag
                field_name=$(jq -r --arg f "$flag" 'to_entries[] | select(.value.flag == $f and .value.updatable == true) | .key' "$config" | head -1)

                # Try matching as a negateFlag
                if [[ -z "$field_name" ]]; then
                    field_name=$(jq -r --arg f "$flag" 'to_entries[] | select(.value.negateFlag == $f and .value.updatable == true) | .key' "$config" | head -1)
                    if [[ -n "$field_name" ]]; then
                        is_negate=true
                    fi
                fi

                if [[ -z "$field_name" ]]; then
                    echo "Error: Unknown flag '$flag'" >&2
                    return 1
                fi

                json_type=$(jq -r --arg f "$field_name" '.[$f].jsonType' "$config")

                if [[ "$json_type" == "boolean" ]]; then
                    local bool_val="true"
                    [[ "$is_negate" == true ]] && bool_val="false"
                    collected=$(echo "$collected" | jq --arg k "$field_name" --argjson v "$bool_val" '. + {($k): $v}')
                    shift
                else
                    if [[ -z "${2:-}" ]]; then
                        echo "Error: $flag requires a value." >&2
                        return 1
                    fi
                    collected=$(echo "$collected" | jq --arg k "$field_name" --arg v "$2" '. + {($k): $v}')
                    shift 2
                fi
                ;;
            *)
                if [[ -z "$name" ]]; then
                    name="$1"
                else
                    echo "Error: Unexpected argument '$1'" >&2
                    return 1
                fi
                shift
                ;;
        esac
    done

    # Validate name
    if [[ -z "$name" ]]; then
        echo "Error: name required." >&2
        echo "Usage: work define <name> [flags]  (run 'work define --help' for details)" >&2
        return 1
    fi

    # Validate kebab-case
    if [[ ! "$name" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
        echo "Error: Name must be kebab-case (lowercase letters, numbers, hyphens)." >&2
        echo "  Got: '$name'" >&2
        return 1
    fi

    # Extract fields needed by _pipeline_create
    local type products tools
    type=$(echo "$collected" | jq -r '.type // "vertical"')
    products=$(echo "$collected" | jq -r '.products // empty')
    tools=$(echo "$collected" | jq -r '.tools // empty')

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

    # Apply remaining collected fields via the generic field applier
    # (skip type, products, tools — already handled by _pipeline_create)
    local remaining_fields apply_errors=0
    remaining_fields=$(echo "$collected" | jq -r 'del(.type, .products, .tools) | to_entries[] | "\(.key)\t\(.value)"')
    while IFS=$'\t' read -r field_name field_value; do
        [[ -z "$field_name" ]] && continue
        if ! _pipeline_apply_field "$pipeline_id" "$field_name" "$field_value"; then
            echo "Warning: Failed to set '$field_name'. Fix with: work update $pipeline_id --$field_name $field_value" >&2
            apply_errors=$((apply_errors + 1))
        fi
    done <<< "$remaining_fields"

    # Handle --prompt: auto-create GitHub issue and link it
    if [[ -n "$prompt" ]]; then
        local issue_title="Pipeline: ${name}"
        local issue_body="$prompt"
        local created_issue
        created_issue=$(gh issue create --repo "$PRINT4INK_GH_REPO" \
            --title "$issue_title" --body "$issue_body" \
            --json number -q '.number' 2>/dev/null)
        if [[ -n "$created_issue" ]]; then
            if ! _pipeline_apply_field "$pipeline_id" "issue" "$created_issue"; then
                echo "Warning: Failed to link issue #${created_issue}. Fix with: work update $pipeline_id --issue $created_issue" >&2
                apply_errors=$((apply_errors + 1))
            fi
            echo "  Created GitHub issue #${created_issue}"
        else
            echo "  Warning: Could not create GitHub issue. Continuing without." >&2
        fi
    fi

    if [[ "$apply_errors" -gt 0 ]]; then
        echo "Warning: $apply_errors field(s) failed to apply. Pipeline created but partially configured." >&2
    fi

    # Create artifact directories
    if ! _pipeline_init_dirs "$pipeline_id"; then
        echo "Warning: Could not create artifact directories. Create manually if needed." >&2
    fi

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

# Auto-generate help text from pipeline-fields.json + define-specific flags
_work_define_help() {
    echo "Usage: work define <name> [flags]"
    echo ""
    echo "Create a new pipeline entity (→ ready state)."
    echo ""
    echo "ARGUMENTS"
    echo "  <name>                         Pipeline name (kebab-case, required)"
    echo ""
    echo "FLAGS (from pipeline-fields.json)"

    local config
    config="$(_pipeline_fields_config)"
    if [[ -f "$config" ]]; then
        local entries
        entries=$(jq -r '
            to_entries[]
            | select(.value.updatable == true)
            | [.key, .value.flag // "", .value.negateFlag // "", .value.jsonType, .value.description, (.value.default | tostring)]
            | @tsv
        ' "$config")

        while IFS=$'\t' read -r fname flag negate jtype desc default_val; do
            [[ -z "$fname" ]] && continue
            local suffix=""
            [[ "$default_val" != "null" && -n "$default_val" ]] && suffix=" (default: $default_val)"
            if [[ "$jtype" == "boolean" ]]; then
                printf "  %-28s %s%s\n" "$flag / $negate" "$desc" "$suffix"
            else
                local value_hint="<value>"
                [[ "$jtype" == "array" ]] && value_hint="<csv>"
                [[ "$jtype" == "number" ]] && value_hint="<n>"
                printf "  %-28s %s%s\n" "$flag $value_hint" "$desc" "$suffix"
            fi
        done <<< "$entries"
    else
        echo "  (could not load pipeline-fields.json)"
    fi

    echo ""
    echo "DEFINE-SPECIFIC FLAGS"
    printf "  %-28s %s\n" "--prompt <text>" "Create GitHub issue from text and link it"
    echo ""
    echo "EXAMPLES"
    echo "  work define my-feature --type vertical --auto --products quotes,garments"
    echo "  work define quick-fix --type bug-fix --issue 327"
    echo "  work define new-thing --prompt \"Build the new widget feature\""
}
