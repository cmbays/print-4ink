#!/usr/bin/env bash
# registry.sh — Session Registry CRUD for Screen Print Pro
#
# Manages ~/.session-registry.json which cross-references:
#   topic ↔ branch ↔ Claude session ↔ KB doc ↔ terminal session
#
# All operations use jq. Source this file from work.sh.

REGISTRY_FILE="${PRINT4INK_WORKTREES}/.session-registry.json"

# Ensure registry file exists
_registry_init() {
    if [[ ! -f "$REGISTRY_FILE" ]]; then
        echo '{"version":1,"sessions":[]}' > "$REGISTRY_FILE"
    fi
}

# Acquire advisory lock for registry writes (mkdir-based, portable)
# Usage: _registry_lock || return 1; ...; _registry_unlock
_registry_lock() {
    local lockdir="${REGISTRY_FILE}.lock"
    local attempts=0
    while ! mkdir "$lockdir" 2>/dev/null; do
        attempts=$((attempts + 1))
        if (( attempts > 50 )); then
            echo "Error: Could not acquire registry lock after 5s. Stale lock?" >&2
            echo "  Remove manually: rmdir '$lockdir'" >&2
            return 1
        fi
        sleep 0.1
    done
}

_registry_unlock() {
    rmdir "${REGISTRY_FILE}.lock" 2>/dev/null
}

# Write registry atomically (unique temp file + rename)
_registry_write() {
    local content="$1"
    local tmp
    tmp=$(mktemp "${REGISTRY_FILE}.XXXXXX")
    echo "$content" > "$tmp" && mv "$tmp" "$REGISTRY_FILE"
}

# Add a session to the registry
# Usage: _registry_add <topic> <branch> [vertical] [stage] [wave] [claude_id] [claude_name] [kb_doc] [terminal]
_registry_add() {
    _registry_init
    local topic="$1" branch="${2:-}"
    local vertical="${3:-}" stage="${4:-}"
    local wave="${5:-null}" claude_id="${6:-}" claude_name="${7:-}"
    local kb_doc="${8:-}" terminal="${9:-}"

    # Ensure wave is valid JSON (number or null)
    [[ -z "$wave" ]] && wave="null"

    local entry
    entry=$(jq -n \
        --arg topic "$topic" \
        --arg branch "$branch" \
        --arg cid "$claude_id" \
        --arg cname "$claude_name" \
        --arg kb "$kb_doc" \
        --arg term "$terminal" \
        --arg vert "$vertical" \
        --arg stage "$stage" \
        --argjson wave "$wave" \
        --arg created "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{
            topic: $topic,
            branch: $branch,
            claudeSessionId: $cid,
            claudeSessionName: $cname,
            kbDoc: $kb,
            terminalSession: $term,
            vertical: $vert,
            stage: $stage,
            wave: $wave,
            status: "active",
            prNumber: null,
            forkedFrom: null,
            createdAt: $created,
            completedAt: null
        }')

    _registry_lock || return 1
    local result
    result=$(jq --argjson entry "$entry" '.sessions += [$entry]' "$REGISTRY_FILE")
    _registry_write "$result"
    _registry_unlock
}

# Get a session by topic (returns JSON object)
_registry_get() {
    _registry_init
    local topic="$1"
    jq --arg t "$topic" '.sessions[] | select(.topic == $t)' "$REGISTRY_FILE"
}

# Update a string field on a session
# Usage: _registry_update <topic> <field> <value>
_registry_update() {
    _registry_init
    local topic="$1" field="$2" value="$3"

    _registry_lock || return 1
    local result
    result=$(jq --arg t "$topic" --arg f "$field" --arg v "$value" \
        '(.sessions[] | select(.topic == $t))[$f] = $v' \
        "$REGISTRY_FILE")
    _registry_write "$result"
    _registry_unlock
}

# Update a JSON field on a session (for numbers, booleans, null)
# Usage: _registry_update_json <topic> <field> <json_value>
#   Example: _registry_update_json "my-topic" "wave" "2"
#   Example: _registry_update_json "my-topic" "prNumber" "null"
_registry_update_json() {
    _registry_init
    local topic="$1" field="$2" value="$3"

    _registry_lock || return 1
    local result
    result=$(jq --arg t "$topic" --arg f "$field" --argjson v "$value" \
        '(.sessions[] | select(.topic == $t))[$f] = $v' \
        "$REGISTRY_FILE")
    _registry_write "$result"
    _registry_unlock
}

# List sessions (formatted table)
# Usage: _registry_list [jq_filter]
#   Default filter: .sessions[]
#   Example: _registry_list '.sessions[] | select(.status == "active")'
_registry_list() {
    _registry_init
    local filter="${1:-.sessions[]}"
    local header=$'TOPIC\tSTATUS\tVERTICAL\tSTAGE\tBRANCH\tKB DOC'
    local rows
    rows=$(jq -r "$filter | \"\(.topic)\t\(.status)\t\(.vertical)\t\(.stage)\t\(.branch)\t\(.kbDoc // \"-\")\"" \
        "$REGISTRY_FILE" 2>/dev/null)

    if [[ -z "$rows" ]]; then
        echo "  (no sessions)"
        return 0
    fi

    printf '%s\n%s\n' "$header" "$rows" | column -t -s $'\t'
}

# Archive a session (set status=archived, set completedAt)
_registry_archive() {
    _registry_init
    local topic="$1"
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    _registry_lock || return 1
    local result
    result=$(jq --arg t "$topic" --arg now "$now" \
        '(.sessions[] | select(.topic == $t)) |= (.status = "archived" | .completedAt = $now)' \
        "$REGISTRY_FILE")
    _registry_write "$result"
    _registry_unlock
}

# Delete a session entry from the registry
_registry_delete() {
    _registry_init
    local topic="$1"

    _registry_lock || return 1
    local result
    result=$(jq --arg t "$topic" 'del(.sessions[] | select(.topic == $t))' "$REGISTRY_FILE")
    _registry_write "$result"
    _registry_unlock
}

# Check if a topic exists in the registry
_registry_exists() {
    _registry_init
    local topic="$1"
    local count
    count=$(jq --arg t "$topic" '[.sessions[] | select(.topic == $t)] | length' "$REGISTRY_FILE")
    [[ "$count" -gt 0 ]]
}
