#!/usr/bin/env bash
# pipeline-gates.sh — Stage Gate Validation for Screen Print Pro
#
# Validates stage completion before allowing transition to the next stage.
# Gate definitions are loaded from config/pipeline-gates.json.
#
# Gate types:
#   artifact-exists          — All required artifacts exist in pipeline artifact directory
#   human-confirms           — Prompt user for confirmation (keyboard confirm)
#   human-approves-manifest  — Display manifest summary, prompt for approval
#
# In --auto mode, human-* gates fall through to artifact-exists.
#
# Source this file from work.sh (after pipeline-entity.sh).

# ── Gate Config ───────────────────────────────────────────────────────────────

# Load gate definition for a stage
# Usage: _pipeline_gate_def <stage>
# Returns: JSON object with artifacts, gate, next
_pipeline_gate_def() {
    local stage="$1"
    local config
    config="$(_pipeline_gates_config)"

    if [[ ! -f "$config" ]]; then
        echo "Error: Gate config not found: $config" >&2
        return 2
    fi

    local def
    def=$(jq --arg s "$stage" '.stages[$s] // empty' "$config")
    if [[ -z "$def" ]]; then
        echo "Error: No gate definition for stage '$stage'" >&2
        return 1
    fi
    echo "$def"
}

# Get the gate type for a stage (respecting auto-overrides)
# Usage: _pipeline_gate_type <stage> <auto_flag>
# auto_flag: "true" or "false"
_pipeline_gate_type() {
    local stage="$1"
    local auto="${2:-false}"
    local config
    config="$(_pipeline_gates_config)"

    local gate_type
    gate_type=$(jq -r --arg s "$stage" '.stages[$s].gate // empty' "$config")
    if [[ -z "$gate_type" ]]; then
        echo "artifact-exists"
        return
    fi

    if [[ "$auto" == "true" ]]; then
        gate_type=$(_pipeline_auto_override "$gate_type")
    fi

    echo "$gate_type"
}

# Get required artifacts for a stage
# Usage: _pipeline_gate_artifacts <stage>
# Returns: newline-separated list of artifact filenames
_pipeline_gate_artifacts() {
    local stage="$1"
    local config
    config="$(_pipeline_gates_config)"

    jq -r --arg s "$stage" '.stages[$s].artifacts[]' "$config" 2>/dev/null
}

# Get the next stage after a given stage
# Usage: _pipeline_gate_next <stage>
_pipeline_gate_next() {
    local stage="$1"
    local config
    config="$(_pipeline_gates_config)"

    jq -r --arg s "$stage" '.stages[$s].next // empty' "$config"
}

# ── Auto Override ─────────────────────────────────────────────────────────────

# In --auto mode, human gates fall through to artifact-exists
# Usage: _pipeline_auto_override <gate_type>
_pipeline_auto_override() {
    local gate_type="$1"
    local config
    config="$(_pipeline_gates_config)"

    local override
    override=$(jq -r --arg g "$gate_type" '.["auto-overrides"][$g] // empty' "$config")

    if [[ -n "$override" ]]; then
        echo "$override"
    else
        echo "$gate_type"
    fi
}

# ── Gate Checks ───────────────────────────────────────────────────────────────

# Check if a stage gate passes for a pipeline
# Usage: _pipeline_check_gate <pipeline_id> <stage>
# Returns 0 if gate passes, 1 if gate fails
_pipeline_check_gate() {
    local pipeline_id="$1"
    local stage="$2"

    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 2
    local auto
    auto=$(echo "$entity" | jq -r '.auto')

    local gate_type
    gate_type=$(_pipeline_gate_type "$stage" "$auto")

    case "$gate_type" in
        artifact-exists)
            _pipeline_check_artifacts "$pipeline_id" "$stage"
            ;;
        human-confirms)
            _pipeline_check_human_confirm "$pipeline_id" "$stage"
            ;;
        human-approves-manifest)
            _pipeline_check_manifest_approval "$pipeline_id" "$stage"
            ;;
        *)
            echo "Error: Unknown gate type '$gate_type' for stage '$stage'" >&2
            return 2
            ;;
    esac
}

# Check if all required artifacts exist for a stage
# Usage: _pipeline_check_artifacts <pipeline_id> <stage>
_pipeline_check_artifacts() {
    local pipeline_id="$1"
    local stage="$2"

    local required_artifacts
    required_artifacts=$(_pipeline_gate_artifacts "$stage")

    # If no artifacts required, gate passes
    if [[ -z "$required_artifacts" ]]; then
        return 0
    fi

    # Find artifact directory for this pipeline
    local artifact_dir
    artifact_dir=$(_pipeline_artifact_dir "$pipeline_id")
    if [[ -z "$artifact_dir" ]]; then
        echo "Error: No artifact directory found for pipeline '$pipeline_id'" >&2
        return 1
    fi

    local missing=()
    while IFS= read -r artifact; do
        [[ -z "$artifact" ]] && continue
        if [[ ! -f "${artifact_dir}/${artifact}" ]]; then
            missing+=("$artifact")
        fi
    done <<< "$required_artifacts"

    if [[ ${#missing[@]} -gt 0 ]]; then
        _pipeline_report_missing "$pipeline_id" "$stage" "${missing[@]}"
        return 1
    fi

    return 0
}

# Prompt user for confirmation
# Usage: _pipeline_check_human_confirm <pipeline_id> <stage>
_pipeline_check_human_confirm() {
    local pipeline_id="$1"
    local stage="$2"

    echo ""
    echo "=== Stage Gate: $stage ==="
    echo "Pipeline: $pipeline_id"
    echo ""
    echo "Stage '$stage' requires human confirmation to proceed."
    echo -n "Confirm stage completion? [y/N] "
    local response
    read -r response
    if [[ "$response" == [yY] ]]; then
        return 0
    else
        echo "Gate not passed. Stage '$stage' still active." >&2
        return 1
    fi
}

# Display manifest summary and prompt for approval
# Usage: _pipeline_check_manifest_approval <pipeline_id> <stage>
_pipeline_check_manifest_approval() {
    local pipeline_id="$1"
    local stage="$2"

    local artifact_dir
    artifact_dir=$(_pipeline_artifact_dir "$pipeline_id")
    local manifest="${artifact_dir}/manifest.yaml"

    if [[ ! -f "$manifest" ]]; then
        echo "Error: Manifest not found: $manifest" >&2
        return 1
    fi

    echo ""
    echo "=== Stage Gate: Plan Approval ==="
    echo "Pipeline: $pipeline_id"
    echo ""
    echo "--- Manifest Summary ---"

    # Display manifest overview using yq
    if command -v yq &>/dev/null; then
        echo "  Waves: $(yq -r '.waves | length' "$manifest" 2>/dev/null || echo "unknown")"
        local wave_idx=0
        local wave_count wave_name session_count
        wave_count=$(yq -r '.waves | length' "$manifest" 2>/dev/null || echo 0)
        while (( wave_idx < wave_count )); do
            wave_name=$(yq -r ".waves[$wave_idx].name // \"Wave $wave_idx\"" "$manifest" 2>/dev/null)
            session_count=$(yq -r ".waves[$wave_idx].sessions | length" "$manifest" 2>/dev/null || echo 0)
            echo "  Wave $wave_idx ($wave_name): $session_count sessions"
            wave_idx=$((wave_idx + 1))
        done
    else
        echo "  (yq not installed — cannot parse manifest)"
        echo "  File: $manifest"
    fi

    echo ""
    echo -n "Approve this execution plan? [y/N] "
    local response
    read -r response
    if [[ "$response" == [yY] ]]; then
        return 0
    else
        echo "Plan not approved. Revise the manifest and try again." >&2
        return 1
    fi
}

# ── Artifact Directory Resolution ─────────────────────────────────────────────

# Find the primary artifact directory for a pipeline
# Usage: _pipeline_artifact_dir <pipeline_id>
# Looks in docs/products/ and docs/tools/ for the pipeline ID directory
_pipeline_artifact_dir() {
    local pipeline_id="$1"
    local base_dir="${PRINT4INK_ROOT}/docs"

    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 1

    # Check product directories first
    local product_slugs
    product_slugs=$(echo "$entity" | jq -r '.products[0] // empty')
    if [[ -n "$product_slugs" ]]; then
        local dir="$base_dir/products/$product_slugs/$pipeline_id"
        if [[ -d "$dir" ]]; then
            echo "$dir"
            return 0
        fi
    fi

    # Check tool directories
    local tool_slugs
    tool_slugs=$(echo "$entity" | jq -r '.tools[0] // empty')
    if [[ -n "$tool_slugs" ]]; then
        local dir="$base_dir/tools/$tool_slugs/$pipeline_id"
        if [[ -d "$dir" ]]; then
            echo "$dir"
            return 0
        fi
    fi

    # Fallback: create a generic directory under tools/work-orchestrator
    # This handles pipelines that haven't linked products/tools yet
    local fallback_dir="$base_dir/tools/work-orchestrator/$pipeline_id"
    mkdir -p "$fallback_dir"
    echo "$fallback_dir"
}

# ── Reporting ─────────────────────────────────────────────────────────────────

# Report missing artifacts blocking gate passage
# Usage: _pipeline_report_missing <pipeline_id> <stage> <artifact1> [<artifact2> ...]
_pipeline_report_missing() {
    local pipeline_id="$1"
    local stage="$2"
    shift 2

    local artifact_dir
    artifact_dir=$(_pipeline_artifact_dir "$pipeline_id")

    echo "" >&2
    echo "=== Gate Blocked: $stage ===" >&2
    echo "Pipeline: $pipeline_id" >&2
    echo "Directory: $artifact_dir" >&2
    echo "" >&2
    echo "Missing artifacts:" >&2
    for artifact in "$@"; do
        echo "  - $artifact" >&2
    done
    echo "" >&2
    echo "Create the missing artifacts in the directory above to proceed." >&2
}
