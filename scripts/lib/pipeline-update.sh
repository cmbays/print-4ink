#!/usr/bin/env bash
# pipeline-update.sh — Config-Driven Pipeline Update Command
#
# Implements `work update <pipeline-id> [flags]` — modifies pipeline fields
# after initial `work define`. Reads config/pipeline-fields.json to determine
# which flags are valid and how to validate/apply them.
#
# Adding a new updatable field to pipeline-fields.json automatically makes it
# available as a CLI flag here — zero code changes needed.
#
# Source this file from work.sh (after pipeline-entity.sh).

_work_update() {
    local input="${1:-}"

    # Handle --help before pipeline resolution
    if [[ "$input" == "--help" || "$input" == "-h" ]]; then
        _work_update_help
        return 0
    fi

    if [[ -z "$input" ]]; then
        _work_update_help >&2
        return 1
    fi
    shift

    # Check for --help after pipeline ID (e.g., "work update my-pipe --help")
    if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
        _work_update_help
        return 0
    fi

    # Resolve pipeline ID (accepts ID or name)
    local pipeline_id
    pipeline_id=$(_pipeline_resolve_id "$input") || return 1

    if [[ $# -eq 0 ]]; then
        echo "No updates specified. Run 'work update --help' for available flags." >&2
        return 1
    fi

    local config
    config="$(_pipeline_fields_config)"
    if [[ ! -f "$config" ]]; then
        echo "Error: Pipeline fields config not found: $config" >&2
        return 1
    fi

    local updated=0

    while [[ $# -gt 0 ]]; do
        local flag="$1"

        # Look up field by flag or negateFlag
        local field_name json_type is_negate
        is_negate=false

        # Try matching as a regular flag
        field_name=$(jq -r --arg f "$flag" 'to_entries[] | select(.value.flag == $f and .value.updatable == true) | .key' "$config" | head -1)

        # Try matching as a negateFlag if not found
        if [[ -z "$field_name" ]]; then
            field_name=$(jq -r --arg f "$flag" 'to_entries[] | select(.value.negateFlag == $f and .value.updatable == true) | .key' "$config" | head -1)
            if [[ -n "$field_name" ]]; then
                is_negate=true
            fi
        fi

        # Check if it matches a non-updatable field's would-be flag
        if [[ -z "$field_name" && "$flag" == --* ]]; then
            local flag_stem="${flag#--}"
            flag_stem="${flag_stem#no-}"
            local non_updatable_match
            non_updatable_match=$(jq -r --arg f "$flag_stem" 'to_entries[] | select(.key == $f and .value.updatable == false) | .key' "$config" | head -1)
            if [[ -n "$non_updatable_match" ]]; then
                echo "Error: Field '$non_updatable_match' is not updatable. Use lifecycle commands instead." >&2
                return 1
            fi
        fi

        if [[ -z "$field_name" ]]; then
            echo "Error: Unknown flag '$flag'" >&2
            return 1
        fi

        json_type=$(jq -r --arg f "$field_name" '.[$f].jsonType' "$config")

        # Boolean fields: no value arg consumed
        if [[ "$json_type" == "boolean" ]]; then
            local bool_value="true"
            if [[ "$is_negate" == true ]]; then
                bool_value="false"
            fi
            _pipeline_apply_field "$pipeline_id" "$field_name" "$bool_value" || return 1
            updated=$((updated + 1))
            shift
        else
            # Non-boolean: consume next arg as value
            if [[ -z "${2:-}" ]]; then
                echo "Error: $flag requires a value." >&2
                return 1
            fi
            _pipeline_apply_field "$pipeline_id" "$field_name" "$2" || return 1
            updated=$((updated + 1))
            shift 2
        fi
    done

    echo "Updated $updated field(s) on pipeline '$pipeline_id'."
    echo ""
    _work_pipeline_status "$pipeline_id"
}

# Auto-generate help text from pipeline-fields.json
_work_update_help() {
    echo "Usage: work update <pipeline-id> [flags]"
    echo ""
    echo "Modify pipeline fields after 'work define'."
    echo ""
    echo "FLAGS"

    local config
    config="$(_pipeline_fields_config)"
    if [[ ! -f "$config" ]]; then
        echo "  (could not load pipeline-fields.json)"
        return
    fi

    # Iterate updatable fields and print their flags + description
    local entries
    entries=$(jq -r '
        to_entries[]
        | select(.value.updatable == true)
        | [.key, .value.flag // "", .value.negateFlag // "", .value.jsonType, .value.description]
        | @tsv
    ' "$config")

    while IFS=$'\t' read -r name flag negate jtype desc; do
        [[ -z "$name" ]] && continue
        if [[ "$jtype" == "boolean" ]]; then
            printf "  %-28s %s\n" "$flag / $negate" "$desc"
        else
            local value_hint="<value>"
            [[ "$jtype" == "array" ]] && value_hint="<csv>"
            [[ "$jtype" == "number" ]] && value_hint="<n>"
            printf "  %-28s %s\n" "$flag $value_hint" "$desc"
        fi
    done <<< "$entries"

    echo ""
    echo "EXAMPLES"
    echo "  work update my-pipeline --auto"
    echo "  work update my-pipeline --type bug-fix --products garments"
    echo "  work update my-pipeline --no-auto --issue 327"
}
