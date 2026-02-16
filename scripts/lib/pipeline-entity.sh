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
_pipeline_gates_config() { echo "${PRINT4INK_ROOT}/config/pipeline-gates.json"; }

# ── Valid States & Transitions ────────────────────────────────────────────────

# Ordered lifecycle states
_PIPELINE_STATES=(ready active building reviewing wrapped cooled)

# Valid transitions: state → allowed next states
# Forward-only with one exception: reviewing can loop back to building
_pipeline_valid_transitions() {
    local from="$1"
    case "$from" in
        ready)     echo "active" ;;
        active)    echo "building" ;;
        building)  echo "reviewing" ;;
        reviewing) echo "wrapped building" ;;
        wrapped)   echo "cooled" ;;
        cooled)    echo "" ;;
        *)         echo "" ;;
    esac
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
# Usage: _pipeline_create <name> <type> [--products p1,p2] [--tools t1,t2] [--id YYYYMMDD-topic]
# Returns: pipeline ID on stdout
_pipeline_create() {
    local name="" type="" products="[]" tools="[]" custom_id=""

    # Parse args
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --products)
                products=$(echo "$2" | tr ',' '\n' | jq -R . | jq -s .)
                shift 2 ;;
            --tools)
                tools=$(echo "$2" | tr ',' '\n' | jq -R . | jq -s .)
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
        echo "Usage: _pipeline_create <name> <type> [--products p1,p2] [--tools t1,t2] [--id ID]" >&2
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
        --arg stage "$first_stage" \
        --arg created "$now" \
        '{
            id: $id,
            name: $name,
            type: $type,
            products: $products,
            tools: $tools,
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
    _registry_pipeline_add "$entity"

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
    local valid_targets
    valid_targets=$(_pipeline_valid_transitions "$current_state")
    local found=false
    for target in $valid_targets; do
        if [[ "$target" == "$new_state" ]]; then
            found=true
            break
        fi
    done

    if [[ "$found" != true ]]; then
        echo "Error: Invalid transition '$current_state' -> '$new_state'." >&2
        if [[ -n "$valid_targets" ]]; then
            echo "  Valid targets from '$current_state': $valid_targets" >&2
        else
            echo "  '$current_state' is a terminal state." >&2
        fi
        return 1
    fi

    # Update state
    _registry_pipeline_update "$id" "state" "$new_state"

    # Set timestamps for lifecycle milestones
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    case "$new_state" in
        active)
            _registry_pipeline_update "$id" "startedAt" "$now"
            ;;
        cooled)
            _registry_pipeline_update "$id" "completedAt" "$now"
            ;;
    esac

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
    local product_slugs
    product_slugs=$(echo "$entity" | jq -r '.products[]' 2>/dev/null)
    for slug in $product_slugs; do
        local dir="$base_dir/products/$slug/$id"
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            created=$((created + 1))
        fi
    done

    # Create tool directories
    local tool_slugs
    tool_slugs=$(echo "$entity" | jq -r '.tools[]' 2>/dev/null)
    for slug in $tool_slugs; do
        local dir="$base_dir/tools/$slug/$id"
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            created=$((created + 1))
        fi
    done

    if [[ "$created" -gt 0 ]]; then
        local noun="directory"; [[ "$created" -gt 1 ]] && noun="directories"
        echo "Created $created artifact $noun for pipeline '$id'."
    fi
}
