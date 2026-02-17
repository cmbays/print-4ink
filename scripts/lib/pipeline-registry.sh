#!/usr/bin/env bash
# pipeline-registry.sh — Pipeline Registry CRUD for Screen Print Pro
#
# Manages ~/Github/print-4ink-worktrees/.pipeline-registry.json which tracks
# pipeline entities across their lifecycle: ready → active → building →
# reviewing → wrapped → cooled.
#
# All operations use jq. Source this file from work.sh.

PIPELINE_REGISTRY_FILE="${PRINT4INK_WORKTREES}/.pipeline-registry.json"

# ── Init ─────────────────────────────────────────────────────────────────────

_registry_pipeline_init() {
    if [[ ! -f "$PIPELINE_REGISTRY_FILE" ]]; then
        echo '{"version":1,"pipelines":[]}' > "$PIPELINE_REGISTRY_FILE"
        echo "Pipeline registry created: $PIPELINE_REGISTRY_FILE" >&2
    fi
}

# ── Lock (shared with session registry pattern) ─────────────────────────────

_pipeline_registry_lock() {
    local lockdir="${PIPELINE_REGISTRY_FILE}.lock"
    local attempts=0
    while ! mkdir "$lockdir" 2>/dev/null; do
        attempts=$((attempts + 1))
        if (( attempts > 50 )); then
            echo "Error: Could not acquire pipeline registry lock after 5s." >&2
            echo "  Remove manually: rmdir '$lockdir'" >&2
            return 1
        fi
        sleep 0.1
    done
}

_pipeline_registry_unlock() {
    rmdir "${PIPELINE_REGISTRY_FILE}.lock" 2>/dev/null
}

_pipeline_registry_write() {
    local content="$1"

    # Guard: reject empty or invalid content
    if [[ -z "$content" ]]; then
        echo "Error: Refusing to write empty content to pipeline registry." >&2
        return 1
    fi
    if ! echo "$content" | jq -e '.pipelines' >/dev/null 2>&1; then
        echo "Error: Invalid registry content (missing .pipelines key)." >&2
        return 1
    fi

    local tmp
    tmp=$(mktemp "${PIPELINE_REGISTRY_FILE}.XXXXXX")
    echo "$content" > "$tmp" && mv "$tmp" "$PIPELINE_REGISTRY_FILE"
}

# ── CRUD ─────────────────────────────────────────────────────────────────────

# Add a pipeline entity to the registry
# Usage: _registry_pipeline_add <json_entity>
#   The JSON entity should be a full pipeline object from _pipeline_create()
_registry_pipeline_add() {
    _registry_pipeline_init
    local entity="$1"

    _pipeline_registry_lock || return 1
    local result
    result=$(jq --argjson entity "$entity" '.pipelines += [$entity]' "$PIPELINE_REGISTRY_FILE") \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_write "$result" \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_unlock
}

# Get a pipeline by ID (returns JSON object)
# Usage: _registry_pipeline_get <pipeline_id>
_registry_pipeline_get() {
    _registry_pipeline_init
    local id="$1"
    jq --arg id "$id" '.pipelines[] | select(.id == $id)' "$PIPELINE_REGISTRY_FILE"
}

# List pipelines (formatted table or filtered JSON)
# Usage: _registry_pipeline_list [--state <state>] [--json]
_registry_pipeline_list() {
    _registry_pipeline_init
    local state_filter="" json_mode=false

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --state) state_filter="$2"; shift 2 ;;
            --json)  json_mode=true; shift ;;
            *)       shift ;;
        esac
    done

    if [[ "$json_mode" == true ]]; then
        if [[ -n "$state_filter" ]]; then
            jq --arg s "$state_filter" '[.pipelines[] | select(.state == $s)]' "$PIPELINE_REGISTRY_FILE"
        else
            jq '.pipelines' "$PIPELINE_REGISTRY_FILE"
        fi
        return
    fi

    local header=$'ID\tNAME\tTYPE\tSTAGE\tSTATE\tCREATED'
    local rows
    if [[ -n "$state_filter" ]]; then
        rows=$(jq -r --arg s "$state_filter" \
            '.pipelines[] | select(.state == $s) | "\(.id)\t\(.name)\t\(.type)\t\(.stage // "-")\t\(.state)\t\(.createdAt[:10])"' \
            "$PIPELINE_REGISTRY_FILE" 2>/dev/null)
    else
        rows=$(jq -r \
            '.pipelines[] | "\(.id)\t\(.name)\t\(.type)\t\(.stage // "-")\t\(.state)\t\(.createdAt[:10])"' \
            "$PIPELINE_REGISTRY_FILE" 2>/dev/null)
    fi

    if [[ -z "$rows" ]]; then
        echo "  (no pipelines${state_filter:+ in state '$state_filter'})"
        return 0
    fi

    printf '%s\n%s\n' "$header" "$rows" | column -t -s $'\t'
}

# Update a pipeline field in the registry
# Usage: _registry_pipeline_update <pipeline_id> <field> <value>
#   For string values. Use _registry_pipeline_update_json for non-string types.
_registry_pipeline_update() {
    _registry_pipeline_init
    local id="$1" field="$2" value="$3"

    _pipeline_registry_lock || return 1
    local result
    result=$(jq --arg id "$id" --arg f "$field" --arg v "$value" \
        '(.pipelines[] | select(.id == $id))[$f] = $v' \
        "$PIPELINE_REGISTRY_FILE") \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_write "$result" \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_unlock
}

# Update a pipeline field with a JSON value (numbers, booleans, arrays, null)
# Usage: _registry_pipeline_update_json <pipeline_id> <field> <json_value>
_registry_pipeline_update_json() {
    _registry_pipeline_init
    local id="$1" field="$2" value="$3"

    _pipeline_registry_lock || return 1
    local result
    result=$(jq --arg id "$id" --arg f "$field" --argjson v "$value" \
        '(.pipelines[] | select(.id == $id))[$f] = $v' \
        "$PIPELINE_REGISTRY_FILE") \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_write "$result" \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_unlock
}

# Check if a pipeline exists in the registry
# Usage: _registry_pipeline_exists <pipeline_id>
_registry_pipeline_exists() {
    _registry_pipeline_init
    local id="$1"
    local count
    count=$(jq --arg id "$id" '[.pipelines[] | select(.id == $id)] | length' "$PIPELINE_REGISTRY_FILE")
    [[ "$count" -gt 0 ]]
}

# Archive a pipeline (set state to "archived" + completedAt timestamp)
# Preserves the record for audit trail. Preferred over delete for work clean.
# Usage: _registry_pipeline_archive <pipeline_id>
_registry_pipeline_archive() {
    _registry_pipeline_init
    local id="$1"

    if ! _registry_pipeline_exists "$id"; then
        echo "Error: Pipeline '$id' not found." >&2
        return 1
    fi

    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    _pipeline_registry_lock || return 1
    local result
    result=$(jq --arg id "$id" --arg now "$now" \
        '(.pipelines[] | select(.id == $id)) |= (.state = "archived" | .completedAt = $now)' \
        "$PIPELINE_REGISTRY_FILE") \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_write "$result" \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_unlock
}

# Delete a pipeline from the registry
# Usage: _registry_pipeline_delete <pipeline_id>
_registry_pipeline_delete() {
    _registry_pipeline_init
    local id="$1"

    if ! _registry_pipeline_exists "$id"; then
        echo "Error: Pipeline '$id' not found." >&2
        return 1
    fi

    _pipeline_registry_lock || return 1
    local result
    result=$(jq --arg id "$id" 'del(.pipelines[] | select(.id == $id))' "$PIPELINE_REGISTRY_FILE") \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_write "$result" \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_unlock
}
