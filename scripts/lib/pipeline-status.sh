#!/usr/bin/env bash
# pipeline-status.sh — Pipeline Status Command for Screen Print Pro
#
# Implements `work status [<pipeline-id>]`:
#   - No args: dashboard — all pipelines grouped by state, progress indicators, staleness
#   - With ID: deep dive — full entity detail, artifacts, worktrees, PRs, KB docs
#
# The detail view is config-driven: it reads display metadata from
# config/pipeline-fields.json to auto-generate the output. Adding a new field
# with display metadata auto-shows in status output with zero code changes.
#
# NOTE: All loop body variables MUST be declared before the loop, not inside it.
# In zsh, `local` (alias for `typeset`) re-declaration inside a loop prints
# the old value to stdout. Declare once before the loop to avoid this.
#
# Source this file from work.sh (after pipeline-entity.sh and pipeline-registry.sh).

# ── Status Dashboard (no args) ───────────────────────────────────────────────

_work_pipeline_status_dashboard() {
    _registry_pipeline_init

    local total
    total=$(jq '.pipelines | length' "$PIPELINE_REGISTRY_FILE")

    if [[ "$total" -eq 0 ]]; then
        echo "=== Pipeline Status ==="
        echo "  No pipelines defined."
        echo "  Create one: work define <name> [--type <type>]"
        return 0
    fi

    echo "=== Pipeline Status ($total pipelines) ==="
    echo ""

    # Declare all loop variables ONCE before the loop (zsh local re-declaration bug)
    local state count label rows ids id
    local p_type p_stage total_stages stage_list
    local current_idx idx s
    local created_at created_epoch now_epoch diff_days

    # Display pipelines grouped by state (in lifecycle order)
    for state in ready active building reviewing wrapped cooled; do
        count=$(jq --arg s "$state" '[.pipelines[] | select(.state == $s)] | length' "$PIPELINE_REGISTRY_FILE")
        [[ "$count" -eq 0 ]] && continue

        # State header with count
        case "$state" in
            ready)     label="Ready (awaiting start)" ;;
            active)    label="Active (pre-build)" ;;
            building)  label="Building (waves running)" ;;
            reviewing) label="Reviewing (awaiting merge)" ;;
            wrapped)   label="Wrapped (awaiting cooldown)" ;;
            cooled)    label="Cooled (complete)" ;;
        esac
        echo "--- $label ($count) ---"

        # List pipelines in this state
        rows=$(jq -r --arg s "$state" '
            .pipelines[] | select(.state == $s) |
            "  \(.id)  \(.type)  stage=\(.stage // "-")  \(if .auto then "[auto]" else "" end)  \(if .issue then "issue=#\(.issue)" else "" end)"
        ' "$PIPELINE_REGISTRY_FILE")
        echo "$rows"

        # Progress indicator: stages completed / total for this pipeline type
        ids=$(jq -r --arg s "$state" '.pipelines[] | select(.state == $s) | .id' "$PIPELINE_REGISTRY_FILE")
        while IFS= read -r id; do
            [[ -z "$id" ]] && continue
            p_type=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .type' "$PIPELINE_REGISTRY_FILE")
            p_stage=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .stage' "$PIPELINE_REGISTRY_FILE")

            # Count stages
            total_stages=$(jq -r --arg t "$p_type" '.[] | select(.slug == $t) | .stages | length' "$(_pipeline_types_config)")
            stage_list=$(jq -r --arg t "$p_type" '.[] | select(.slug == $t) | .stages[]' "$(_pipeline_types_config)")

            current_idx=0
            idx=0
            while IFS= read -r s; do
                [[ -z "$s" ]] && continue
                if [[ "$s" == "$p_stage" ]]; then
                    current_idx=$idx
                    break
                fi
                idx=$((idx + 1))
            done <<< "$stage_list"

            echo "    progress: stage $((current_idx + 1))/$total_stages ($p_stage)"

            # Staleness check (>3 days since last activity)
            # Use startedAt if available, else createdAt
            created_at=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | (.startedAt // .createdAt)' "$PIPELINE_REGISTRY_FILE")
            if [[ -n "$created_at" && "$created_at" != "null" ]]; then
                created_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created_at" +%s 2>/dev/null || date -d "$created_at" +%s 2>/dev/null)
                now_epoch=$(date +%s)
                if [[ -n "$created_epoch" ]]; then
                    diff_days=$(( (now_epoch - created_epoch) / 86400 ))
                    if [[ "$diff_days" -gt 3 && "$state" != "cooled" ]]; then
                        echo "    WARNING: ${diff_days} days old — may be stale"
                    fi
                fi
            fi
        done <<< "$ids"
        echo ""
    done
}

# ── Config-Driven Helpers ─────────────────────────────────────────────────────

# Format a single field value according to its display.format.
# Usage: _status_format_value <entity_json> <field_name> <format> <empty_text>
# Outputs the formatted value string.
_status_format_value() {
    local entity="$1" field_name="$2" format="$3" empty_text="$4"
    local raw_value

    case "$format" in
        yes-no)
            raw_value=$(echo "$entity" | jq -r --arg f "$field_name" '.[$f]')
            if [[ "$raw_value" == "true" ]]; then
                echo "yes"
            else
                echo "no"
            fi
            ;;
        csv)
            raw_value=$(echo "$entity" | jq -r --arg f "$field_name" '.[$f] | if type == "array" then (if length == 0 then "" else join(", ") end) else . end')
            if [[ -z "$raw_value" || "$raw_value" == "null" ]]; then
                echo "${empty_text:-none}"
            else
                echo "$raw_value"
            fi
            ;;
        iso-date)
            raw_value=$(echo "$entity" | jq -r --arg f "$field_name" '.[$f] // ""')
            if [[ -z "$raw_value" || "$raw_value" == "null" ]]; then
                echo "${empty_text:-—}"
            else
                echo "$raw_value"
            fi
            ;;
        issue)
            raw_value=$(echo "$entity" | jq -r --arg f "$field_name" '.[$f] // ""')
            if [[ -z "$raw_value" || "$raw_value" == "null" ]]; then
                echo "${empty_text:-none}"
            else
                echo "#${raw_value}"
            fi
            ;;
        raw|""|*)
            raw_value=$(echo "$entity" | jq -r --arg f "$field_name" '.[$f] // ""')
            if [[ -z "$raw_value" || "$raw_value" == "null" ]]; then
                echo "${empty_text:-none}"
            else
                echo "$raw_value"
            fi
            ;;
    esac
}

# Render a section of label: value rows for header/config/timeline sections.
# Usage: _status_render_section <section_name> <entity_json>
# Reads field metadata from pipeline-fields.json sorted by display.order.
_status_render_section() {
    local section="$1" entity="$2"
    local config
    config="$(_pipeline_fields_config)"

    # Extract fields for this section as TSV: field_name\tlabel\tformat\tempty_text
    # Sorted by display.order
    local fields_tsv
    fields_tsv=$(jq -r --arg sec "$section" '
        to_entries
        | map(select(.value.display.section == $sec))
        | sort_by(.value.display.order)
        | .[]
        | [.key, .value.display.label, (.value.display.format // "raw"), (.value.display.emptyText // "")] | @tsv
    ' "$config")

    [[ -z "$fields_tsv" ]] && return

    # Declare loop vars before the loop (zsh local re-declaration bug)
    local field_name field_label field_format field_empty formatted_value

    while IFS=$'\t' read -r field_name field_label field_format field_empty; do
        [[ -z "$field_name" ]] && continue
        formatted_value=$(_status_format_value "$entity" "$field_name" "$field_format" "$field_empty")
        printf '  %-14s%s\n' "${field_label}:" "$formatted_value"
    done <<< "$fields_tsv"
}

# Render asset sub-sections (count-list and kv-list).
# Usage: _status_render_assets <entity_json>
# Reads asset fields from pipeline-fields.json sorted by display.order.
# Skips empty assets silently.
_status_render_assets() {
    local entity="$1"
    local config
    config="$(_pipeline_fields_config)"

    # Extract asset fields as TSV: field_name\tlabel\tformat
    local asset_tsv
    asset_tsv=$(jq -r '
        to_entries
        | map(select(.value.display.section == "assets"))
        | sort_by(.value.display.order)
        | .[]
        | [.key, .value.display.label, (.value.display.format // "raw")] | @tsv
    ' "$config")

    [[ -z "$asset_tsv" ]] && return

    # Declare loop vars before the loop (zsh local re-declaration bug)
    local field_name field_label field_format item_count

    while IFS=$'\t' read -r field_name field_label field_format; do
        [[ -z "$field_name" ]] && continue

        case "$field_format" in
            count-list)
                item_count=$(echo "$entity" | jq --arg f "$field_name" '.[$f] | length')
                [[ "$item_count" -eq 0 ]] && continue
                echo "--- ${field_label} ($item_count) ---"
                echo "$entity" | jq -r --arg f "$field_name" '.[$f][] | "  \(.)"'
                echo ""
                ;;
            kv-list)
                item_count=$(echo "$entity" | jq --arg f "$field_name" '.[$f] | length')
                [[ "$item_count" -eq 0 ]] && continue
                echo "--- ${field_label} ---"
                echo "$entity" | jq -r --arg f "$field_name" '.[$f] | to_entries[] | "  \(.key): \(.value)"'
                echo ""
                ;;
            kv-list-issue)
                item_count=$(echo "$entity" | jq --arg f "$field_name" '.[$f] | length')
                [[ "$item_count" -eq 0 ]] && continue
                echo "--- ${field_label} ---"
                echo "$entity" | jq -r --arg f "$field_name" '.[$f] | to_entries[] | "  \(.key): #\(.value)"'
                echo ""
                ;;
        esac
    done <<< "$asset_tsv"
}

# Render the stage progress stepper.
# This stays hardcoded because it reads pipeline-types.json to compute which
# stages are done vs pending — this is derived logic, not just field rendering.
# Usage: _status_render_progress <entity_json> <pipeline_type>
_status_render_progress() {
    local entity="$1" p_type="$2"
    local p_stage
    p_stage=$(echo "$entity" | jq -r '.stage // "none"')

    echo "--- Stage Progress ---"
    local stages s marker artifact_path artifact_status
    stages=$(_pipeline_stages_for_type "$p_type")
    while IFS= read -r s; do
        [[ -z "$s" ]] && continue
        marker="  "
        if [[ "$s" == "$p_stage" ]]; then
            marker=">>"
        fi

        # Check if artifacts exist for this stage
        artifact_path=$(echo "$entity" | jq -r --arg s "$s" '.artifacts[$s] // empty')
        artifact_status="pending"
        if [[ -n "$artifact_path" ]]; then
            artifact_status="done"
        fi

        printf '  %s %s (%s)\n' "$marker" "$s" "$artifact_status"
    done <<< "$stages"
    echo ""
}

# ── Status Deep Dive (with pipeline ID) ──────────────────────────────────────

_work_pipeline_status_detail() {
    local id="$1"

    # Resolve ID or name
    id=$(_pipeline_resolve_id "$id") || {
        echo "  Run 'work status' to see all pipelines." >&2
        return 1
    }

    local entity
    entity=$(_pipeline_read "$id") || return 1

    # Title section
    echo "=== Pipeline: $id ==="
    echo ""

    # Header section (Name, Type, State, Stage)
    _status_render_section "header" "$entity"
    echo ""

    # Config section (Auto, Issue, Products, Tools, Base Branch)
    _status_render_section "config" "$entity"
    echo ""

    # Timeline section (Created, Started, Completed)
    _status_render_section "timeline" "$entity"
    echo ""

    # Stage progress stepper (derived logic — stays hardcoded)
    local p_type
    p_type=$(echo "$entity" | jq -r '.type')
    _status_render_progress "$entity" "$p_type"

    # Asset sub-sections (Artifacts, Worktrees, PRs, KB Docs)
    _status_render_assets "$entity"
}

# ── Dispatcher ────────────────────────────────────────────────────────────────

_work_pipeline_status() {
    local id="${1:-}"

    if [[ -z "$id" ]]; then
        _work_pipeline_status_dashboard
    else
        _work_pipeline_status_detail "$id"
    fi
}
