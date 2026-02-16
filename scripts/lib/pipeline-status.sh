#!/usr/bin/env bash
# pipeline-status.sh — Pipeline Status Command for Screen Print Pro
#
# Implements `work status [<pipeline-id>]`:
#   - No args: dashboard — all pipelines grouped by state, progress indicators, staleness
#   - With ID: deep dive — full entity detail, artifacts, worktrees, PRs, KB docs
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

    # Extract fields
    local p_name p_type p_state p_stage p_auto p_issue
    local p_created p_started p_completed p_base_branch
    p_name=$(echo "$entity" | jq -r '.name')
    p_type=$(echo "$entity" | jq -r '.type')
    p_state=$(echo "$entity" | jq -r '.state')
    p_stage=$(echo "$entity" | jq -r '.stage // "none"')
    p_auto=$(echo "$entity" | jq -r '.auto')
    p_issue=$(echo "$entity" | jq -r '.issue // "none"')
    p_created=$(echo "$entity" | jq -r '.createdAt // "unknown"')
    p_started=$(echo "$entity" | jq -r '.startedAt // "not started"')
    p_completed=$(echo "$entity" | jq -r '.completedAt // "not completed"')
    p_base_branch=$(echo "$entity" | jq -r '.baseBranch // "none"')

    echo "=== Pipeline: $id ==="
    echo ""
    echo "  Name:         $p_name"
    echo "  Type:         $p_type"
    echo "  State:        $p_state"
    echo "  Stage:        $p_stage"
    echo "  Auto:         $p_auto"
    echo "  Issue:        $p_issue"
    echo "  Base Branch:  $p_base_branch"
    echo "  Created:      $p_created"
    echo "  Started:      $p_started"
    echo "  Completed:    $p_completed"
    echo ""

    # Products & Tools
    local products tools
    products=$(echo "$entity" | jq -r '.products | if length == 0 then "none" else join(", ") end')
    tools=$(echo "$entity" | jq -r '.tools | if length == 0 then "none" else join(", ") end')
    echo "  Products:     $products"
    echo "  Tools:        $tools"
    echo ""

    # Stage progress — declare loop vars before loop (zsh local re-declaration bug)
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

    # Artifacts
    local artifact_count
    artifact_count=$(echo "$entity" | jq '.artifacts | length')
    if [[ "$artifact_count" -gt 0 ]]; then
        echo "--- Artifacts ---"
        echo "$entity" | jq -r '.artifacts | to_entries[] | "  \(.key): \(.value)"'
        echo ""
    fi

    # Worktrees
    local worktree_count
    worktree_count=$(echo "$entity" | jq '.worktrees | length')
    if [[ "$worktree_count" -gt 0 ]]; then
        echo "--- Worktrees ($worktree_count) ---"
        echo "$entity" | jq -r '.worktrees[] | "  \(.)"'
        echo ""
    fi

    # PRs
    local pr_keys
    pr_keys=$(echo "$entity" | jq -r '.prs | keys[]' 2>/dev/null)
    if [[ -n "$pr_keys" ]]; then
        echo "--- Pull Requests ---"
        echo "$entity" | jq -r '.prs | to_entries[] | "  \(.key): #\(.value)"'
        echo ""
    fi

    # KB Docs
    local kb_count
    kb_count=$(echo "$entity" | jq '.kbDocs | length')
    if [[ "$kb_count" -gt 0 ]]; then
        echo "--- KB Docs ($kb_count) ---"
        echo "$entity" | jq -r '.kbDocs[] | "  \(.)"'
        echo ""
    fi
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
