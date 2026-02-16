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

# ── Claude Session ID Capture ────────────────────────────────────────────────

# Compute Claude Code's project directory for a given worktree path.
# Claude encodes absolute paths by replacing / with - (e.g., /Users/foo → -Users-foo).
# Tested against Claude Code CLI (claude-code 1.x, Feb 2026).
# Usage: dir=$(_claude_projects_dir "/path/to/worktree")
_claude_projects_dir() {
    local worktree_dir="$1"
    local abs_path
    abs_path=$(cd "$worktree_dir" 2>/dev/null && pwd) || abs_path="$worktree_dir"
    echo "${HOME}/.claude/projects/${abs_path//\//-}"
}

# Poll for a Claude session ID and write it to the session registry.
# Claude writes session JSONL files to ~/.claude/projects/<encoded-path>/.
# This function is designed to run in the background after a Claude launch.
# It uses a timestamp marker to distinguish new session files from pre-existing ones.
#
# Usage: _poll_claude_session_id <registry_topic> <worktree_dir> [max_wait_secs] &
#        disown
_poll_claude_session_id() {
    local topic="$1"
    local worktree_dir="$2"
    local max_wait="${3:-120}"

    local projects_dir
    projects_dir=$(_claude_projects_dir "$worktree_dir")

    # Create a timestamp marker so we only pick up NEW session files,
    # not stale ones from prior sessions in the same worktree.
    local marker
    marker=$(mktemp "${TMPDIR:-/tmp}/poll-marker-XXXXXX")

    local elapsed=0 newest session_id
    while (( elapsed < max_wait )); do
        sleep 5
        elapsed=$((elapsed + 5))

        # Exit early if worktree was removed (session aborted)
        [[ ! -d "$worktree_dir" ]] && break

        if [[ -d "$projects_dir" ]]; then
            # Find JSONL files newer than our marker (created after polling started)
            newest=$(find "$projects_dir" -maxdepth 1 -name '*.jsonl' -newer "$marker" -print 2>/dev/null | head -1)
            if [[ -n "$newest" ]]; then
                session_id=$(basename "$newest" .jsonl)
                _registry_update "$topic" "claudeSessionId" "$session_id" 2>/dev/null
                rm -f "$marker" 2>/dev/null
                return 0
            fi
        fi
    done

    rm -f "$marker" 2>/dev/null
    echo "Warning: Could not capture Claude session ID for '$topic' (timed out after ${max_wait}s)" >&2
    return 1
}
