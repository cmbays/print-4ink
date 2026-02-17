#!/usr/bin/env bash
# pipeline-define.sh — Config-Driven Pipeline Define Command
#
# Implements `work define [<name>] [flags]` — creates a new pipeline entity.
# Reads config/pipeline-fields.json to determine which flags are valid and
# how to validate/apply them. The --prompt flag is define-specific (not in schema).
#
# When --issue <N> is provided, labels on the issue are used to infer type,
# products, tools, and domains. The positional <name> becomes optional and is
# derived from the issue title if not explicitly supplied. Explicit flags always
# override inferred values, and the output block shows both.
#
# Adding a new updatable field to pipeline-fields.json automatically makes it
# available as a CLI flag here — zero code changes needed.
#
# Source this file from work.sh (after pipeline-entity.sh and pipeline-registry.sh).

# ── Helpers ───────────────────────────────────────────────────────────────────

# Derive a kebab-case pipeline name from a GitHub issue title.
# Strips conventional-commit prefix (feat(x):), code spans, angle brackets,
# issue refs, special chars — then takes the first 5 meaningful words.
_derive_name_from_issue_title() {
    local title="$1"
    printf '%s' "$title" \
        | sed -E \
            -e 's/`[^`]*`//g' \
            -e 's/<[^>]*>//g' \
            -e 's/\(#[0-9][^)]*\)//g' \
            -e 's/#[0-9]+//g' \
            -e 's/^[a-z]+\([^)]+\): *//' \
        | tr '[:upper:]' '[:lower:]' \
        | tr -cs 'a-z0-9' ' ' \
        | tr -s ' ' \
        | sed 's/^ //;s/ $//' \
        | awk '{
            r = ""; count = 0
            n = split($0, w, " ")
            for (i = 1; i <= n && count < 5; i++) {
                if (w[i] != "") {
                    r = r (r != "" ? "-" : "") w[i]
                    count++
                }
            }
            print r
        }'
}

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
    # Space-separated list of field names the user explicitly provided via flags
    local explicit_keys=""

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
                # Track that this field was explicitly set by the user
                explicit_keys="$explicit_keys $field_name"
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

    # ── Issue Inference ───────────────────────────────────────────────────────

    local issue_num
    issue_num=$(echo "$collected" | jq -r '.issue // empty')

    if [[ -n "$issue_num" ]]; then
        local issue_data issue_title issue_labels_json
        issue_data=$(gh issue view "$issue_num" \
            --repo "${PRINT4INK_GH_REPO:-}" \
            --json labels,title 2>/dev/null)

        if [[ -z "$issue_data" || "$issue_data" == "null" ]]; then
            echo "Warning: Could not fetch issue #${issue_num} — skipping label inference." >&2
        else
            issue_title=$(echo "$issue_data" | jq -r '.title // empty')
            issue_labels_json=$(echo "$issue_data" | jq '.labels')

            # Parse label groups
            local inferred_type inferred_products inferred_tools inferred_domains type_warn=""

            inferred_type=$(echo "$issue_labels_json" | jq -r \
                '[.[] | select(.name | startswith("pipeline/")) | .name | ltrimstr("pipeline/")] | first // empty')

            if [[ -z "$inferred_type" ]]; then
                inferred_type="vertical"
                type_warn="  ⚠  No pipeline/* label found — defaulting type to 'vertical'"
            fi

            inferred_products=$(echo "$issue_labels_json" | jq -r \
                '[.[] | select(.name | startswith("product/")) | .name | ltrimstr("product/")] | join(",")')

            inferred_tools=$(echo "$issue_labels_json" | jq -r \
                '[.[] | select(.name | startswith("tool/")) | .name | ltrimstr("tool/")] | join(",")')

            inferred_domains=$(echo "$issue_labels_json" | jq -r \
                '[.[] | select(.name | startswith("domain/")) | .name | ltrimstr("domain/")] | join(",")')

            # Derive name from title if not explicitly provided
            local inferred_name=""
            if [[ -z "$name" ]]; then
                inferred_name=$(_derive_name_from_issue_title "$issue_title")
            fi

            # Print inference block
            echo ""
            echo "=== Inferred from issue #${issue_num} ==="
            local short_title="${issue_title:0:60}"
            [[ "${#issue_title}" -gt 60 ]] && short_title="${short_title}…"
            echo "  Title:    $short_title"
            if [[ -n "$inferred_name" ]]; then
                echo "  Name:     $inferred_name  (derived)"
            fi
            printf "  Type:     %-20s" "$inferred_type"
            [[ -z "$type_warn" ]] && echo "(from pipeline/* label)" || echo "(default)"
            echo "  Products: ${inferred_products:-none}"
            echo "  Tools:    ${inferred_tools:-none}"
            echo "  Domains:  ${inferred_domains:-none}"
            [[ -n "$type_warn" ]] && echo "$type_warn"

            # Detect fields where explicit flags override inferred values
            local overrides=""
            for infer_key in type products tools domains; do
                if echo " $explicit_keys " | grep -q " $infer_key "; then
                    local explicit_val inferred_val
                    explicit_val=$(echo "$collected" | jq -r --arg k "$infer_key" '.[$k] // empty')
                    case "$infer_key" in
                        type)     inferred_val="$inferred_type" ;;
                        products) inferred_val="$inferred_products" ;;
                        tools)    inferred_val="$inferred_tools" ;;
                        domains)  inferred_val="$inferred_domains" ;;
                    esac
                    if [[ "$explicit_val" != "$inferred_val" ]]; then
                        overrides="${overrides}  ${infer_key}: '${explicit_val}'  (flag overrides inferred: '${inferred_val:-none}')\n"
                    fi
                fi
            done

            if [[ -n "$overrides" ]]; then
                echo ""
                echo "=== Explicit overrides ==="
                printf "%b" "$overrides"
            fi

            echo ""

            # Apply inferred values for fields the user did NOT explicitly set
            [[ -z "$name" && -n "$inferred_name" ]] && name="$inferred_name"

            if ! echo " $explicit_keys " | grep -q " type "; then
                collected=$(echo "$collected" | jq --arg v "$inferred_type" '. + {type: $v}')
            fi
            if [[ -n "$inferred_products" ]] && ! echo " $explicit_keys " | grep -q " products "; then
                collected=$(echo "$collected" | jq --arg v "$inferred_products" '. + {products: $v}')
            fi
            if [[ -n "$inferred_tools" ]] && ! echo " $explicit_keys " | grep -q " tools "; then
                collected=$(echo "$collected" | jq --arg v "$inferred_tools" '. + {tools: $v}')
            fi
            if [[ -n "$inferred_domains" ]] && ! echo " $explicit_keys " | grep -q " domains "; then
                collected=$(echo "$collected" | jq --arg v "$inferred_domains" '. + {domains: $v}')
            fi
        fi
    fi

    # ── Validate name ─────────────────────────────────────────────────────────

    if [[ -z "$name" ]]; then
        if [[ -n "$issue_num" ]]; then
            echo "Error: Could not derive a name from issue #${issue_num}. Provide one explicitly." >&2
        else
            echo "Error: name required." >&2
            echo "Usage: work define <name> [flags]  (run 'work define --help' for details)" >&2
        fi
        return 1
    fi

    # Validate kebab-case
    if [[ ! "$name" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
        echo "Error: Name must be kebab-case (lowercase letters, numbers, hyphens)." >&2
        echo "  Got: '$name'" >&2
        return 1
    fi

    # Extract fields needed by _pipeline_create
    local type products tools domains
    type=$(echo "$collected" | jq -r '.type // "vertical"')
    products=$(echo "$collected" | jq -r '.products // empty')
    tools=$(echo "$collected" | jq -r '.tools // empty')
    domains=$(echo "$collected" | jq -r '.domains // empty')

    # Build _pipeline_create args
    local create_args=("$name" "$type")
    [[ -n "$products" ]] && create_args+=(--products "$products")
    [[ -n "$tools" ]]    && create_args+=(--tools "$tools")
    [[ -n "$domains" ]]  && create_args+=(--domains "$domains")

    # Create pipeline entity
    local pipeline_id
    if ! pipeline_id=$(_pipeline_create "${create_args[@]}") || [[ -z "$pipeline_id" ]]; then
        echo "Error: Failed to create pipeline." >&2
        return 1
    fi

    # Apply remaining collected fields via the generic field applier
    # (skip type, products, tools, domains — already handled by _pipeline_create)
    local remaining_fields apply_errors=0
    remaining_fields=$(echo "$collected" | jq -r 'del(.type, .products, .tools, .domains) | to_entries[] | "\(.key)\t\(.value)"')
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
    local p_type p_state p_stage p_auto p_issue p_products p_tools p_domains
    p_type=$(echo "$entity" | jq -r '.type')
    p_state=$(echo "$entity" | jq -r '.state')
    p_stage=$(echo "$entity" | jq -r '.stage')
    p_auto=$(echo "$entity" | jq -r '.auto')
    p_issue=$(echo "$entity" | jq -r '.issue // "none"')
    p_products=$(echo "$entity" | jq -r '[.products[]? // empty] | join(", ")' 2>/dev/null || echo "none")
    p_tools=$(echo "$entity" | jq -r '[.tools[]? // empty] | join(", ")' 2>/dev/null || echo "none")
    p_domains=$(echo "$entity" | jq -r '[.domains[]? // empty] | join(", ")' 2>/dev/null || echo "none")
    [[ -z "$p_products" ]] && p_products="none"
    [[ -z "$p_tools" ]] && p_tools="none"
    [[ -z "$p_domains" ]] && p_domains="none"

    # Display summary
    echo ""
    echo "=== Pipeline Defined ==="
    echo "  ID:       $pipeline_id"
    echo "  Name:     $name"
    echo "  Type:     $p_type"
    echo "  Stage:    $p_stage"
    echo "  State:    $p_state"
    echo "  Auto:     $p_auto"
    echo "  Issue:    $p_issue"
    echo "  Products: $p_products"
    echo "  Tools:    $p_tools"
    echo "  Domains:  $p_domains"
    echo ""
    echo "Next: work start $pipeline_id"
}

# Auto-generate help text from pipeline-fields.json + define-specific flags
_work_define_help() {
    echo "Usage: work define [<name>] [flags]"
    echo ""
    echo "Create a new pipeline entity (→ ready state)."
    echo ""
    echo "ARGUMENTS"
    echo "  <name>                         Pipeline name (kebab-case)"
    echo "                                 Optional when --issue is provided (derived from title)"
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
    echo "ISSUE INFERENCE (--issue <N>)"
    echo "  When --issue is provided, labels on the issue are read to auto-populate:"
    echo "    pipeline/<type>  → type  (falls back to 'vertical' with a warning)"
    echo "    product/<slug>   → products"
    echo "    tool/<slug>      → tools"
    echo "    domain/<slug>    → domains"
    echo "  The issue title is used to derive a name if none is given."
    echo "  Any explicit flag overrides its inferred value — both are shown in output."
    echo ""
    echo "EXAMPLES"
    echo "  work define my-feature --type vertical --products quotes"
    echo "  work define quick-fix --type bug-fix --issue 327"
    echo "  work define --issue 324                    # auto-populate name + fields from labels"
    echo "  work define my-override --issue 324 --type polish  # explicit type overrides label"
    echo "  work define new-thing --prompt \"Build the new widget feature\""
}
