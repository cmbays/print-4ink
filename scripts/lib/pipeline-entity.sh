#!/usr/bin/env bash
# pipeline-entity.sh — Pipeline Entity CRUD for Screen Print Pro
#
# Creates, reads, updates, and transitions pipeline entities.
# Entities are stored in the pipeline registry (pipeline-registry.sh).
#
# Pipeline lifecycle states: ready → active → building → reviewing → wrapped → cooled
# Pipeline types: vertical, polish, horizontal, bug-fix (from config/pipeline-types.json)
#
# Source this file from work.sh (after pipeline-registry.sh).

# Config paths (resolved lazily via functions — allows PRINT4INK_ROOT override after sourcing)
_pipeline_types_config() { echo "${PRINT4INK_ROOT}/config/pipeline-types.json"; }
# Used by Wave 2 (pipeline-gates.sh) — stage gate validation
_pipeline_gates_config() { echo "${PRINT4INK_ROOT}/config/pipeline-gates.json"; }
# Field schema — drives both define and update commands
_pipeline_fields_config() { echo "${PRINT4INK_ROOT}/config/pipeline-fields.json"; }

# ── Valid States & Transitions ────────────────────────────────────────────────

# Ordered lifecycle states
_PIPELINE_STATES=(ready active building reviewing wrapped cooled)

# Valid transitions: state → allowed next states
# Forward-only with one exception: reviewing can loop back to building
_pipeline_valid_transitions() {
    local from="$1"
    case "$from" in
        ready)     printf '%s\n' "active" ;;
        active)    printf '%s\n' "building" ;;
        building)  printf '%s\n' "reviewing" ;;
        reviewing) printf '%s\n' "wrapped" "building" ;;
        wrapped)   printf '%s\n' "cooled" ;;
        cooled)    ;;
        *)         ;;
    esac
}

# ── ID Resolution ───────────────────────────────────────────────────────────

# Resolve a pipeline ID or name to its canonical ID.
# Accepts either a pipeline ID (e.g., 20260216-my-pipeline) or a name (e.g., my-pipeline).
# Returns the canonical ID on stdout, or prints error to stderr and returns 1.
# Usage: pipeline_id=$(_pipeline_resolve_id "$input")
_pipeline_resolve_id() {
    local input="$1"
    if [[ -z "$input" ]]; then
        echo "Error: pipeline ID or name required." >&2
        return 1
    fi

    # Try direct ID lookup first
    if _registry_pipeline_exists "$input"; then
        echo "$input"
        return 0
    fi

    # Try matching by name
    local matched_id
    matched_id=$(jq -r --arg n "$input" '.pipelines[] | select(.name == $n) | .id' "$PIPELINE_REGISTRY_FILE" | head -1)
    if [[ -n "$matched_id" ]]; then
        echo "$matched_id"
        return 0
    fi

    echo "Error: Pipeline '$input' not found." >&2
    return 1
}

# ── Type Validation ───────────────────────────────────────────────────────────

# Validate a pipeline type against config/pipeline-types.json
# Usage: _pipeline_validate_type <type>
# Returns 0 if valid, 1 if invalid
_pipeline_validate_type() {
    local type="$1"
    if [[ ! -f "$(_pipeline_types_config)" ]]; then
        echo "Error: Pipeline types config not found: $(_pipeline_types_config)" >&2
        return 1
    fi
    local count
    count=$(jq --arg t "$type" '[.[] | select(.slug == $t)] | length' "$(_pipeline_types_config)")
    if [[ "$count" -eq 0 ]]; then
        local valid
        valid=$(jq -r '.[].slug' "$(_pipeline_types_config)" | tr '\n' ', ' | sed 's/,$//')
        echo "Error: Invalid pipeline type '$type'. Valid types: $valid" >&2
        return 1
    fi
    return 0
}

# Get the stages array for a pipeline type
# Usage: _pipeline_stages_for_type <type>
_pipeline_stages_for_type() {
    local type="$1"
    jq -r --arg t "$type" '.[] | select(.slug == $t) | .stages[]' "$(_pipeline_types_config)"
}

# Get the first stage for a pipeline type
# Usage: _pipeline_first_stage <type>
_pipeline_first_stage() {
    local type="$1"
    jq -r --arg t "$type" '.[] | select(.slug == $t) | .stages[0]' "$(_pipeline_types_config)"
}

# ── Create ────────────────────────────────────────────────────────────────────

# Create a new pipeline entity and register it
# Usage: _pipeline_create <name> <type> [--products p1,p2] [--tools t1,t2] [--domains d1,d2] [--id YYYYMMDD-topic]
# Returns: pipeline ID on stdout
_pipeline_create() {
    local name="" type="" products="[]" tools="[]" domains="[]" custom_id=""

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --products)
                products=$(echo "$2" | tr ',' '\n' | jq -R . | jq -s .)
                shift 2 ;;
            --tools)
                tools=$(echo "$2" | tr ',' '\n' | jq -R . | jq -s .)
                shift 2 ;;
            --domains)
                domains=$(echo "$2" | tr ',' '\n' | jq -R . | jq -s .)
                shift 2 ;;
            --id)
                custom_id="$2"; shift 2 ;;
            *)
                if [[ -z "$name" ]]; then
                    name="$1"
                elif [[ -z "$type" ]]; then
                    type="$1"
                fi
                shift ;;
        esac
    done

    if [[ -z "$name" || -z "$type" ]]; then
        echo "Usage: _pipeline_create <name> <type> [--products p1,p2] [--tools t1,t2] [--domains d1,d2] [--id ID]" >&2
        return 1
    fi

    # Validate type
    _pipeline_validate_type "$type" || return 1

    # Generate ID: YYYYMMDD-name
    local id="${custom_id:-$(date +%Y%m%d)-$name}"

    # Check for duplicates
    if _registry_pipeline_exists "$id"; then
        echo "Error: Pipeline '$id' already exists." >&2
        return 1
    fi

    # Get first stage for this pipeline type
    local first_stage
    first_stage=$(_pipeline_first_stage "$type")
    if [[ -z "$first_stage" || "$first_stage" == "null" ]]; then
        echo "Error: No stages defined for pipeline type '$type'." >&2
        return 1
    fi

    # Build entity JSON
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local entity
    entity=$(jq -n \
        --arg id "$id" \
        --arg name "$name" \
        --arg type "$type" \
        --argjson products "$products" \
        --argjson tools "$tools" \
        --argjson domains "$domains" \
        --arg stage "$first_stage" \
        --arg created "$now" \
        '{
            id: $id,
            name: $name,
            type: $type,
            products: $products,
            tools: $tools,
            domains: $domains,
            stage: $stage,
            state: "ready",
            issue: null,
            auto: false,
            artifacts: {},
            baseBranch: null,
            worktrees: [],
            prs: {},
            kbDocs: [],
            createdAt: $created,
            startedAt: null,
            completedAt: null
        }')

    # Register
    _registry_pipeline_add "$entity" || { echo "Error: Failed to register pipeline '$id'." >&2; return 1; }

    echo "$id"
}

# ── Read ──────────────────────────────────────────────────────────────────────

# Read a pipeline entity by ID (delegates to registry)
# Usage: _pipeline_read <pipeline_id>
_pipeline_read() {
    local id="$1"
    if [[ -z "$id" ]]; then
        echo "Usage: _pipeline_read <pipeline_id>" >&2
        return 1
    fi
    local result
    result=$(_registry_pipeline_get "$id")
    if [[ -z "$result" ]]; then
        echo "Error: Pipeline '$id' not found." >&2
        return 1
    fi
    echo "$result"
}

# ── Update ────────────────────────────────────────────────────────────────────

# Update a string field on a pipeline entity
# Usage: _pipeline_update <pipeline_id> <field> <value>
_pipeline_update() {
    local id="$1" field="$2" value="$3"
    if [[ -z "$id" || -z "$field" ]]; then
        echo "Usage: _pipeline_update <pipeline_id> <field> <value>" >&2
        return 1
    fi

    # Protect state field — use _pipeline_transition instead
    if [[ "$field" == "state" ]]; then
        echo "Error: Use _pipeline_transition to change state." >&2
        return 1
    fi

    if ! _registry_pipeline_exists "$id"; then
        echo "Error: Pipeline '$id' not found." >&2
        return 1
    fi

    _registry_pipeline_update "$id" "$field" "$value"
}

# Update a JSON field on a pipeline entity (arrays, numbers, booleans, null)
# Usage: _pipeline_update_json <pipeline_id> <field> <json_value>
_pipeline_update_json() {
    local id="$1" field="$2" value="$3"
    if [[ -z "$id" || -z "$field" ]]; then
        echo "Usage: _pipeline_update_json <pipeline_id> <field> <json_value>" >&2
        return 1
    fi

    if [[ "$field" == "state" ]]; then
        echo "Error: Use _pipeline_transition to change state." >&2
        return 1
    fi

    if ! _registry_pipeline_exists "$id"; then
        echo "Error: Pipeline '$id' not found." >&2
        return 1
    fi

    _registry_pipeline_update_json "$id" "$field" "$value"
}

# ── State Transitions ─────────────────────────────────────────────────────────

# Transition a pipeline to a new state with validation
# Usage: _pipeline_transition <pipeline_id> <new_state>
_pipeline_transition() {
    local id="$1" new_state="$2"
    if [[ -z "$id" || -z "$new_state" ]]; then
        echo "Usage: _pipeline_transition <pipeline_id> <new_state>" >&2
        return 1
    fi

    # Get current entity
    local entity
    entity=$(_pipeline_read "$id") || return 1
    local current_state
    current_state=$(echo "$entity" | jq -r '.state')

    # Check if transition is valid
    local valid_targets target
    valid_targets=$(_pipeline_valid_transitions "$current_state")
    local found=false
    while IFS= read -r target; do
        [[ -z "$target" ]] && continue
        if [[ "$target" == "$new_state" ]]; then
            found=true
            break
        fi
    done <<< "$valid_targets"

    if [[ "$found" != true ]]; then
        echo "Error: Invalid transition '$current_state' -> '$new_state'." >&2
        if [[ -n "$valid_targets" ]]; then
            echo "  Valid targets from '$current_state': $valid_targets" >&2
        else
            echo "  '$current_state' is a terminal state." >&2
        fi
        return 1
    fi

    # Build jq expression for atomic update
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local jq_expr
    case "$new_state" in
        active)
            jq_expr='(.pipelines[] | select(.id == $id)) |= (.state = $new_state | .startedAt = $now)'
            ;;
        cooled)
            jq_expr='(.pipelines[] | select(.id == $id)) |= (.state = $new_state | .completedAt = $now)'
            ;;
        *)
            jq_expr='(.pipelines[] | select(.id == $id)).state = $new_state'
            ;;
    esac

    _pipeline_registry_lock || return 1
    local result
    result=$(jq --arg id "$id" --arg new_state "$new_state" --arg now "$now" \
        "$jq_expr" "$PIPELINE_REGISTRY_FILE") \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_write "$result" \
        || { _pipeline_registry_unlock; return 1; }
    _pipeline_registry_unlock

    echo "Pipeline '$id': $current_state -> $new_state"
}

# ── Artifact Directory ────────────────────────────────────────────────────────

# Create artifact directories for a pipeline's linked products/tools
# Usage: _pipeline_init_dirs <pipeline_id>
# Creates: docs/{products|tools}/{slug}/{pipeline-id}/
_pipeline_init_dirs() {
    local id="$1"
    if [[ -z "$id" ]]; then
        echo "Usage: _pipeline_init_dirs <pipeline_id>" >&2
        return 1
    fi

    local entity
    entity=$(_pipeline_read "$id") || return 1

    local base_dir="${PRINT4INK_ROOT}/docs"
    local created=0

    # Create product directories
    local product_slugs dir slug
    product_slugs=$(echo "$entity" | jq -r '.products[]' 2>/dev/null)
    while IFS= read -r slug; do
        [[ -z "$slug" ]] && continue
        dir="$base_dir/products/$slug/$id"
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            created=$((created + 1))
        fi
    done <<< "$product_slugs"

    # Create tool directories
    local tool_slugs
    tool_slugs=$(echo "$entity" | jq -r '.tools[]' 2>/dev/null)
    while IFS= read -r slug; do
        [[ -z "$slug" ]] && continue
        dir="$base_dir/tools/$slug/$id"
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            created=$((created + 1))
        fi
    done <<< "$tool_slugs"

    if [[ "$created" -gt 0 ]]; then
        local noun="directory"; [[ "$created" -gt 1 ]] && noun="directories"
        echo "Created $created artifact $noun for pipeline '$id'."
    fi
}

# ── Config-Driven Helpers ────────────────────────────────────────────────────

# Convert CSV string to JSON array, trimming whitespace
# Usage: _pipeline_csv_to_json_array "a, b, c" → '["a","b","c"]'
# Empty input returns '[]' (not '[""]')
_pipeline_csv_to_json_array() {
    local csv="$1"
    if [[ -z "$csv" ]]; then
        echo '[]'
        return 0
    fi
    echo "$csv" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed '/^$/d' | jq -R . | jq -s .
}

# Validate a GitHub issue number (numeric + best-effort gh check)
# Usage: _pipeline_validate_issue <number>
_pipeline_validate_issue() {
    local num="$1"
    if [[ -z "$num" ]]; then
        echo "Error: --issue requires a value." >&2
        return 1
    fi
    # Must be numeric
    if [[ ! "$num" =~ ^[0-9]+$ ]]; then
        echo "Error: Issue number must be numeric, got '$num'." >&2
        return 1
    fi
    # Best-effort GitHub validation (numeric regex above prevents option injection)
    if ! gh issue view "$num" --repo "$PRINT4INK_GH_REPO" --json number >/dev/null 2>&1; then
        echo "Warning: Could not verify GitHub issue #${num}. Linking anyway." >&2
    fi
    return 0
}

# Validate CSV slugs against a config file's slug field
# Usage: _pipeline_validate_csv_slugs <csv> <config_path> <field_label>
_pipeline_validate_csv_slugs() {
    local csv="$1" config_path="$2" field_label="$3"
    if [[ ! -f "$config_path" ]]; then
        echo "Error: Config file not found: $config_path" >&2
        return 1
    fi
    local valid_slugs slug
    valid_slugs=$(jq -r '.[].slug' "$config_path")
    local items
    items=$(echo "$csv" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    while IFS= read -r slug; do
        [[ -z "$slug" ]] && continue
        if ! echo "$valid_slugs" | grep -Fqx "$slug"; then
            local valid_list
            valid_list=$(echo "$valid_slugs" | tr '\n' ', ' | sed 's/,$//')
            echo "Error: Invalid $field_label '$slug'. Valid: $valid_list" >&2
            return 1
        fi
    done <<< "$items"
    return 0
}

# Generic field applier — reads field def from schema, validates, applies update
# Usage: _pipeline_apply_field <pipeline_id> <field_name> <value>
# The value should be the raw CLI value (CSV string for arrays, "true"/"false" for booleans, etc.)
_pipeline_apply_field() {
    local pipeline_id="$1" field_name="$2" value="$3"
    local config
    config="$(_pipeline_fields_config)"

    # Read field definition
    local field_def
    field_def=$(jq -r --arg f "$field_name" '.[$f] // empty' "$config")
    if [[ -z "$field_def" ]]; then
        echo "Error: Unknown field '$field_name' in pipeline-fields.json." >&2
        return 1
    fi

    local json_type updatable
    json_type=$(echo "$field_def" | jq -r '.jsonType')
    updatable=$(echo "$field_def" | jq -r '.updatable')

    if [[ "$updatable" != "true" ]]; then
        echo "Error: Field '$field_name' is not updatable." >&2
        return 1
    fi

    # Validate if validation rules exist
    local validate_source validate_match validate_type
    validate_source=$(echo "$field_def" | jq -r '.validate.source // empty')
    validate_match=$(echo "$field_def" | jq -r '.validate.match // empty')
    validate_type=$(echo "$field_def" | jq -r '.validate.type // empty')

    if [[ -n "$validate_type" && "$validate_type" == "github-issue" ]]; then
        _pipeline_validate_issue "$value" || return 1
    fi

    if [[ -n "$validate_source" && -n "$validate_match" && "$validate_match" == "slug" ]]; then
        local source_path="${PRINT4INK_ROOT}/$validate_source"
        # For string fields, validate single slug; for arrays, validate CSV
        if [[ "$json_type" == "array" ]]; then
            _pipeline_validate_csv_slugs "$value" "$source_path" "$field_name" || return 1
        else
            # Single value — check against slug list
            local count
            count=$(jq --arg v "$value" '[.[] | select(.slug == $v)] | length' "$source_path")
            if [[ "$count" -eq 0 ]]; then
                local valid
                valid=$(jq -r '.[].slug' "$source_path" | tr '\n' ', ' | sed 's/,$//')
                echo "Error: Invalid $field_name '$value'. Valid: $valid" >&2
                return 1
            fi
        fi
    fi

    # Apply the update based on jsonType
    case "$json_type" in
        string)
            _pipeline_update "$pipeline_id" "$field_name" "$value" || return 1
            ;;
        number|boolean)
            _pipeline_update_json "$pipeline_id" "$field_name" "$value" || return 1
            ;;
        array)
            local json_array
            json_array=$(_pipeline_csv_to_json_array "$value")
            _pipeline_update_json "$pipeline_id" "$field_name" "$json_array" || return 1
            ;;
        object)
            _pipeline_update_json "$pipeline_id" "$field_name" "$value" || return 1
            ;;
        *)
            echo "Error: Unsupported jsonType '$json_type' for field '$field_name'." >&2
            return 1
            ;;
    esac
    return 0
}
