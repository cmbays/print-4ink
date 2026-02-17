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

    # Also write to persistent store for post-cleanup resume
    if type _sessions_persistent_add &>/dev/null; then
        _sessions_persistent_add "$topic" "$branch" 2>/dev/null || true
    fi
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

    # Declare all locals before the loop (function-scoped, not loop-scoped)
    local elapsed=0 newest session_id
    local fast_limit=15 fast_interval=1 slow_interval=5 interval

    # Phase 1: fast polling (1s) for first 15s — Claude starts within ~1-2s.
    # Phase 2: slow polling (5s) for remainder of max_wait.
    while (( elapsed < max_wait )); do
        interval=$slow_interval
        (( elapsed < fast_limit )) && interval=$fast_interval

        sleep $interval
        elapsed=$((elapsed + interval))

        # Exit early if worktree was removed (session aborted)
        [[ ! -d "$worktree_dir" ]] && break

        if [[ -d "$projects_dir" ]]; then
            # Find JSONL files newer than our marker (created after polling started)
            newest=$(find "$projects_dir" -maxdepth 1 -name '*.jsonl' -newer "$marker" -print 2>/dev/null | head -1)
            if [[ -n "$newest" ]]; then
                session_id=$(basename "$newest" .jsonl)
                _registry_update "$topic" "claudeSessionId" "$session_id" 2>/dev/null

                # Write to persistent store (survives worktree cleanup)
                _sessions_persistent_set_id "$topic" "$session_id" 2>/dev/null || true

                # Update CLAUDE_SESSION_ID in the worktree's .envrc.
                # Uses a sed pattern that matches any existing value (empty or prior capture)
                # so re-capture after session restart also works correctly.
                # direnv allow is NOT repeated — it is keyed to the path, not content.
                local envrc_file="${worktree_dir}/.envrc"
                if [[ -f "$envrc_file" ]]; then
                    local tmp_envrc
                    tmp_envrc=$(mktemp "${envrc_file}.XXXXXX")
                    sed "s|^export CLAUDE_SESSION_ID=.*$|export CLAUDE_SESSION_ID=\"${session_id}\"|" \
                        "$envrc_file" > "$tmp_envrc" && mv "$tmp_envrc" "$envrc_file"
                fi

                rm -f "$marker" 2>/dev/null
                return 0
            fi
        fi
    done

    rm -f "$marker" 2>/dev/null
    echo "Warning: Could not capture Claude session ID for '$topic' (timed out after ${max_wait}s)" >&2
    return 1
}

# ── Persistent Session Store ────────────────────────────────────────────────
# Survives worktree cleanup. Lives in main repo root (gitignored).
# Format: { "topic": { sessionId, branch, baseRef, capturedAt, clearedAt } }
#
# Locking: uses mktemp+mv for atomic replacement of individual writes.
# There is a read-modify-write race if the poller and `work clean` fire
# simultaneously, but a lost write here is recoverable metadata — accepted tradeoff.

# Guard: fail loudly if sourced without PRINT4INK_ROOT (e.g., in standalone test)
SESSIONS_PERSISTENT_FILE="${PRINT4INK_ROOT:?PRINT4INK_ROOT must be set — source work.sh first}/.claude-sessions.json"

_sessions_persistent_init() {
    if [[ ! -f "$SESSIONS_PERSISTENT_FILE" ]]; then
        echo '{}' > "$SESSIONS_PERSISTENT_FILE"
    fi
}

# Register a new session in the persistent store.
# If an entry already exists for the topic, preserve the existing sessionId and
# clearedAt (do not overwrite a prior session record on topic reuse).
# Usage: _sessions_persistent_add <topic> <branch> [base_ref]
_sessions_persistent_add() {
    _sessions_persistent_init
    local topic="$1" branch="$2" base_ref="${3:-main}"
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    local tmp
    tmp=$(mktemp "${SESSIONS_PERSISTENT_FILE}.XXXXXX")
    # Use |= to merge: preserve existing sessionId/clearedAt if the topic already
    # exists (e.g., topic reused after a prior cleanup). Only update mutable fields.
    jq --arg t "$topic" --arg b "$branch" --arg r "$base_ref" --arg now "$now" \
        '.[$t] |= (if . then
            .branch = $b | .baseRef = $r | .createdAt = $now
        else
            {sessionId: "", branch: $b, baseRef: $r, capturedAt: null, clearedAt: null, createdAt: $now}
        end)' \
        "$SESSIONS_PERSISTENT_FILE" > "$tmp" && mv "$tmp" "$SESSIONS_PERSISTENT_FILE"
}

# Update the session ID in the persistent store.
# Usage: _sessions_persistent_set_id <topic> <session_id>
_sessions_persistent_set_id() {
    _sessions_persistent_init
    local topic="$1" session_id="$2"
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Guard: only update if the topic was registered first.
    # If _sessions_persistent_add was suppressed (e.g., _registry_add || true failure),
    # skip the write rather than creating a sparse object with missing branch/baseRef.
    local existing
    existing=$(jq -r --arg t "$topic" '.[$t] // empty' "$SESSIONS_PERSISTENT_FILE" 2>/dev/null)
    if [[ -z "$existing" ]]; then
        echo "Warning: _sessions_persistent_set_id: no entry for '$topic' — skipping (add was not called)" >&2
        return 0
    fi

    local tmp
    tmp=$(mktemp "${SESSIONS_PERSISTENT_FILE}.XXXXXX")
    jq --arg t "$topic" --arg id "$session_id" --arg now "$now" \
        '.[$t].sessionId = $id | .[$t].capturedAt = $now' \
        "$SESSIONS_PERSISTENT_FILE" > "$tmp" && mv "$tmp" "$SESSIONS_PERSISTENT_FILE"
}

# Mark a session as cleared (worktree removed). Does NOT delete the record.
# Usage: _sessions_persistent_clear <topic>
_sessions_persistent_clear() {
    _sessions_persistent_init
    local topic="$1"
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Guard: only mark cleared if the topic was registered.
    local existing
    existing=$(jq -r --arg t "$topic" '.[$t] // empty' "$SESSIONS_PERSISTENT_FILE" 2>/dev/null)
    if [[ -z "$existing" ]]; then
        return 0
    fi

    local tmp
    tmp=$(mktemp "${SESSIONS_PERSISTENT_FILE}.XXXXXX")
    jq --arg t "$topic" --arg now "$now" \
        '.[$t].clearedAt = $now' \
        "$SESSIONS_PERSISTENT_FILE" > "$tmp" && mv "$tmp" "$SESSIONS_PERSISTENT_FILE"
}

# Get session ID for a topic. Checks persistent store first, falls back to registry.
# Usage: session_id=$(_sessions_persistent_get_id <topic>)
_sessions_persistent_get_id() {
    local topic="$1"
    local id=""

    # 1. Check persistent store
    if [[ -f "$SESSIONS_PERSISTENT_FILE" ]]; then
        id=$(jq -r --arg t "$topic" '.[$t].sessionId // ""' "$SESSIONS_PERSISTENT_FILE" 2>/dev/null)
    fi

    # 2. Fall back to session registry
    if [[ -z "$id" ]] && type _registry_get &>/dev/null; then
        id=$(_registry_get "$topic" | jq -r '.claudeSessionId // ""' 2>/dev/null)
    fi

    echo "$id"
}

# Get branch info for a topic from persistent store.
# Usage: branch=$(_sessions_persistent_get_branch <topic>)
_sessions_persistent_get_branch() {
    local topic="$1"
    [[ ! -f "$SESSIONS_PERSISTENT_FILE" ]] && echo "" && return
    jq -r --arg t "$topic" '.[$t].branch // ""' "$SESSIONS_PERSISTENT_FILE" 2>/dev/null
}

# Get baseRef for a topic from persistent store.
_sessions_persistent_get_base_ref() {
    local topic="$1"
    [[ ! -f "$SESSIONS_PERSISTENT_FILE" ]] && echo "main" && return
    jq -r --arg t "$topic" '.[$t].baseRef // "main"' "$SESSIONS_PERSISTENT_FILE" 2>/dev/null
}
