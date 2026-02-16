#!/usr/bin/env bash
# pipeline-cooldown.sh — Batch Cooldown Processing for Screen Print Pro
#
# Implements `work cooldown`:
#   1. Finds all pipelines in 'wrapped' state
#   2. Reads all wrap-up docs since last cooldown
#   3. Synthesizes cross-cutting themes
#   4. Updates PROGRESS.md
#   5. Transitions: wrapped → cooled
#
# Cooldown is batched — it processes ALL wrapped pipelines at once,
# not one at a time. This enables cross-cutting theme synthesis.
#
# Source this file from work.sh (after pipeline-entity.sh, pipeline-registry.sh).

# ── Cooldown Command ──────────────────────────────────────────────────────────

_work_cooldown() {
    _registry_pipeline_init

    # Parse flags
    local dry_run=false
    local skip_progress=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)        dry_run=true; shift ;;
            --skip-progress)  skip_progress=true; shift ;;
            *)                shift ;;
        esac
    done

    # Find all wrapped pipelines
    local wrapped_ids
    wrapped_ids=$(jq -r '.pipelines[] | select(.state == "wrapped") | .id' "$PIPELINE_REGISTRY_FILE")

    if [[ -z "$wrapped_ids" ]]; then
        echo "=== work cooldown ==="
        echo "  No pipelines in 'wrapped' state."
        echo "  Nothing to process."
        return 0
    fi

    # Count
    local count=0
    local id_list=()
    while IFS= read -r id; do
        [[ -z "$id" ]] && continue
        id_list+=("$id")
        count=$((count + 1))
    done <<< "$wrapped_ids"

    echo "=== work cooldown ==="
    echo "  Found $count wrapped pipeline(s):"
    local p_name
    for id in "${id_list[@]}"; do
        p_name=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .name' "$PIPELINE_REGISTRY_FILE")
        echo "    - $id ($p_name)"
    done
    echo ""

    if [[ "$dry_run" == true ]]; then
        echo "(Dry run — no changes made)"
        return 0
    fi

    # Collect wrap-up docs
    local wrapup_docs=()
    local artifact_dir wrapup
    for id in "${id_list[@]}"; do
        artifact_dir=$(_pipeline_artifact_dir "$id")
        wrapup="${artifact_dir}/wrap-up.md"
        if [[ -f "$wrapup" ]]; then
            wrapup_docs+=("$wrapup")
            echo "  Found wrap-up: $wrapup"
        else
            echo "  Warning: No wrap-up doc for pipeline '$id'" >&2
        fi
    done
    echo ""

    # Synthesize cross-cutting themes
    if [[ ${#wrapup_docs[@]} -gt 0 ]]; then
        echo "--- Cross-Cutting Synthesis ---"
        _pipeline_synthesize_wrapups "${wrapup_docs[@]}"
        echo ""
    fi

    # Update PROGRESS.md
    if [[ "$skip_progress" != true ]]; then
        echo "Updating PROGRESS.md..."
        if type _work_progress &>/dev/null; then
            _work_progress
        else
            echo "  Warning: _work_progress not available. Skip PROGRESS.md update." >&2
        fi
        echo ""
    fi

    # Transition all wrapped pipelines to cooled
    for id in "${id_list[@]}"; do
        _pipeline_transition "$id" "cooled" || {
            echo "  Warning: Failed to transition '$id' to cooled" >&2
            continue
        }
    done

    echo ""
    echo "=== Cooldown Complete ==="
    echo "  Processed: $count pipeline(s)"
    echo "  State:     all transitioned to 'cooled'"
}

# ── Theme Synthesis ───────────────────────────────────────────────────────────

# Print a summary of cross-cutting themes from wrap-up docs.
# This is a lightweight text extraction — full synthesis is done by
# the learnings-synthesis skill in a Claude session.
# Usage: _pipeline_synthesize_wrapups <doc1> [<doc2> ...]
_pipeline_synthesize_wrapups() {
    local docs=("$@")

    echo "Pipelines completed this batch:"
    local doc pipeline_name pipeline_type
    for doc in "${docs[@]}"; do
        # Extract pipeline name from the file
        pipeline_name=$(grep -m1 "^\\*\\*Name\\*\\*:" "$doc" 2>/dev/null | sed 's/.*: //')
        pipeline_type=$(grep -m1 "^\\*\\*Type\\*\\*:" "$doc" 2>/dev/null | sed 's/.*: //')
        echo "  - ${pipeline_name:-unknown} (${pipeline_type:-unknown})"
    done
    echo ""

    echo "For full cross-cutting synthesis, run a Claude session with:"
    echo "  Use the learnings-synthesis skill to synthesize these wrap-ups:"
    for doc in "${docs[@]}"; do
        echo "    - $doc"
    done
    echo ""
    echo "The learnings-synthesis skill will:"
    echo "  - Extract patterns from each wrap-up doc"
    echo "  - Identify cross-cutting themes"
    echo "  - Recommend agent memory updates"
    echo "  - Suggest ROADMAP.md updates if strategic direction shifts"
}
