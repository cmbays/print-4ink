#!/usr/bin/env bash
# pipeline-end.sh — Post-build Orchestration for Screen Print Pro
#
# Implements `work end <pipeline-id>`:
#   1. Creates final PR: base branch → main
#   2. Runs review stage (checklist from breadboard, design audit)
#   3. Transitions: building → reviewing
#   4. Merge detection polling (gh pr view, 90s intervals)
#   5. After merge: runs wrap-up stage, generates wrap-up doc
#   6. Transitions: reviewing → wrapped
#
# Source this file from work.sh (after pipeline-entity.sh, pipeline-registry.sh).

# ── End Command ───────────────────────────────────────────────────────────────

_work_end() {
    local pipeline_id="${1:-}"
    shift 2>/dev/null || true

    # Parse flags
    local skip_poll=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --skip-poll) skip_poll=true; shift ;;
            *)           shift ;;
        esac
    done

    if [[ -z "$pipeline_id" ]]; then
        echo "Error: pipeline ID required." >&2
        echo "Usage: work end <pipeline-id> [--skip-poll]" >&2
        echo "" >&2
        echo "  Finalize a pipeline: create final PR, poll for merge, wrap up." >&2
        echo "  The pipeline must be in 'building' or 'reviewing' state." >&2
        return 1
    fi

    # Resolve ID or name
    pipeline_id=$(_pipeline_resolve_id "$pipeline_id") || return 1

    # Get entity
    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 1
    local p_name p_state p_auto p_base_branch
    p_name=$(echo "$entity" | jq -r '.name')
    p_state=$(echo "$entity" | jq -r '.state')
    p_auto=$(echo "$entity" | jq -r '.auto')
    p_base_branch=$(echo "$entity" | jq -r '.baseBranch // empty')

    # Validate state
    if [[ "$p_state" != "building" && "$p_state" != "reviewing" ]]; then
        echo "Error: Pipeline '$pipeline_id' is in state '$p_state'." >&2
        echo "  Expected 'building' or 'reviewing'." >&2
        return 1
    fi

    if [[ -z "$p_base_branch" ]]; then
        echo "Error: Pipeline '$pipeline_id' has no base branch set." >&2
        echo "  Run 'work build $pipeline_id' first." >&2
        return 1
    fi

    echo "=== work end ==="
    echo "  Pipeline:    $pipeline_id"
    echo "  Name:        $p_name"
    echo "  State:       $p_state"
    echo "  Base Branch: $p_base_branch"
    echo "  Auto:        $p_auto"
    echo ""

    # Step 1: Create final PR (base branch → main) if not already created
    local final_pr
    final_pr=$(echo "$entity" | jq -r '.prs.final // empty')

    if [[ -z "$final_pr" ]]; then
        echo "Creating final PR: $p_base_branch → main..."

        # Build PR body
        local pr_body
        pr_body=$(_pipeline_build_pr_body "$pipeline_id")

        local pr_url
        if ! pr_url=$(gh pr create --repo "$PRINT4INK_GH_REPO" \
            --base main \
            --head "$p_base_branch" \
            --title "feat(${p_name}): Pipeline ${pipeline_id}" \
            --body "$pr_body" 2>&1); then
            # PR might already exist
            local existing_pr
            existing_pr=$(gh pr list --repo "$PRINT4INK_GH_REPO" \
                --head "$p_base_branch" --base main \
                --json number -q '.[0].number' 2>/dev/null)
            if [[ -n "$existing_pr" ]]; then
                final_pr="$existing_pr"
                echo "  PR already exists: #$final_pr"
            else
                echo "Error: Failed to create PR." >&2
                echo "  $pr_url" >&2
                return 1
            fi
        else
            # Extract PR number from URL (e.g., .../pull/123) or plain number
            final_pr=$(echo "$pr_url" | grep -oE '/pull/[0-9]+' | grep -oE '[0-9]+')
            if [[ -z "$final_pr" ]]; then
                # Fallback: trailing digits
                final_pr=$(echo "$pr_url" | grep -oE '[0-9]+$' | tail -1)
            fi
            if [[ -z "$final_pr" ]]; then
                echo "Error: Could not extract PR number from: $pr_url" >&2
                return 1
            fi
            echo "  Created PR #$final_pr"
        fi

        # Store PR number in entity
        local prs_json
        prs_json=$(_pipeline_read "$pipeline_id" | jq --argjson pr "$final_pr" '.prs + {"final": $pr}')
        _pipeline_update_json "$pipeline_id" "prs" "$prs_json" || true
    else
        echo "  Final PR already exists: #$final_pr"
    fi

    # Step 2: Transition to reviewing
    if [[ "$p_state" == "building" ]]; then
        _pipeline_transition "$pipeline_id" "reviewing" || return 1
        _pipeline_update "$pipeline_id" "stage" "review" || true
    fi

    echo ""
    echo "  PR #$final_pr: $p_base_branch → main"
    echo ""

    # Step 3: Display review checklist
    _pipeline_print_review_checklist "$pipeline_id"

    # Step 4: Merge detection polling (or skip)
    if [[ "$skip_poll" == true ]]; then
        echo ""
        echo "Skipping merge detection (--skip-poll)."
        echo "Re-run without --skip-poll after PR merges, or manually run:"
        echo "  work end $pipeline_id"
        return 0
    fi

    if [[ "$p_auto" == "true" ]]; then
        echo ""
        echo "Auto mode: enabling auto-merge on PR #$final_pr..."
        gh pr merge "$final_pr" --repo "$PRINT4INK_GH_REPO" --auto --squash 2>/dev/null || true
    fi

    echo ""
    echo "Waiting for PR #$final_pr to be merged..."
    echo "  (Checking every 90 seconds. Ctrl+C to stop polling.)"
    echo ""

    local pr_state
    while true; do
        pr_state=$(gh pr view "$final_pr" --repo "$PRINT4INK_GH_REPO" --json state -q '.state' 2>/dev/null)

        if [[ "$pr_state" == "MERGED" ]]; then
            echo "  PR #$final_pr merged!"
            break
        elif [[ "$pr_state" == "CLOSED" ]]; then
            echo "  PR #$final_pr was closed without merging." >&2
            echo "  Pipeline remains in 'reviewing' state." >&2
            return 1
        fi

        echo "  $(date +%H:%M:%S) — PR #$final_pr state: ${pr_state:-unknown}. Waiting..."
        sleep 90
    done

    # Step 5: Run wrap-up
    echo ""
    echo "Running wrap-up stage..."
    _pipeline_run_wrapup "$pipeline_id"

    # Step 6: Transition to wrapped
    _pipeline_transition "$pipeline_id" "wrapped" || return 1
    _pipeline_update "$pipeline_id" "stage" "wrap-up" || true

    echo ""
    echo "=== Pipeline Wrapped ==="
    echo "  Pipeline: $pipeline_id"
    echo "  State:    wrapped"
    echo ""
    echo "Next: work cooldown (batch process all wrapped pipelines)"
}

# ── PR Body Builder ───────────────────────────────────────────────────────────

_pipeline_build_pr_body() {
    local pipeline_id="$1"
    local entity
    entity=$(_pipeline_read "$pipeline_id")

    local p_name p_type p_issue
    p_name=$(echo "$entity" | jq -r '.name')
    p_type=$(echo "$entity" | jq -r '.type')
    p_issue=$(echo "$entity" | jq -r '.issue // empty')

    local worktrees
    worktrees=$(echo "$entity" | jq -r '.worktrees[]' 2>/dev/null | sed 's/^/- /')
    local kb_docs
    kb_docs=$(echo "$entity" | jq -r '.kbDocs[]' 2>/dev/null | sed 's/^/- /')

    local body="## Summary
Pipeline **${pipeline_id}** (${p_type}) — final integration PR.

All build wave PRs have been merged to this base branch."

    if [[ -n "$p_issue" ]]; then
        body+="

Closes #$p_issue"
    fi

    body+="

## Pipeline Details
- **Type**: $p_type
- **Pipeline ID**: $pipeline_id"

    if [[ -n "$worktrees" ]]; then
        body+="

## Sessions
$worktrees"
    fi

    if [[ -n "$kb_docs" ]]; then
        body+="

## KB Docs
$kb_docs"
    fi

    body+="

## Merge Checklist
- [ ] All build wave PRs merged to base branch
- [ ] Build passes (\`npm run build\`)
- [ ] Tests pass (\`npm test\`)
- [ ] Types check (\`npx tsc --noEmit\`)
- [ ] No regressions from integration

---
Generated with [Claude Code](https://claude.com/claude-code)"

    echo "$body"
}

# ── Review Checklist ──────────────────────────────────────────────────────────

_pipeline_print_review_checklist() {
    local pipeline_id="$1"
    local entity
    entity=$(_pipeline_read "$pipeline_id")
    local p_type
    p_type=$(echo "$entity" | jq -r '.type')

    echo "--- Review Checklist ---"
    echo "  [ ] All build wave PRs merged to base branch"
    echo "  [ ] npm run build passes"
    echo "  [ ] npm test passes"
    echo "  [ ] npx tsc --noEmit passes"

    # Type-specific checks
    case "$p_type" in
        vertical|polish)
            echo "  [ ] All breadboard affordances implemented"
            echo "  [ ] Design system compliance (run design audit)"
            echo "  [ ] KB docs created for each build session"
            ;;
        horizontal)
            echo "  [ ] Cross-product integration verified"
            echo "  [ ] No regressions in affected products"
            ;;
        bug-fix)
            echo "  [ ] Bug is fixed and reproducible test exists"
            ;;
    esac

    echo ""
    echo "  Merge the PR when review is complete."
}

# ── Wrap-Up ───────────────────────────────────────────────────────────────────

_pipeline_run_wrapup() {
    local pipeline_id="$1"

    local entity
    entity=$(_pipeline_read "$pipeline_id") || return 1
    local p_name p_type p_issue p_auto
    p_name=$(echo "$entity" | jq -r '.name')
    p_type=$(echo "$entity" | jq -r '.type')
    p_issue=$(echo "$entity" | jq -r '.issue // "none"')
    p_auto=$(echo "$entity" | jq -r '.auto')

    local artifact_dir
    artifact_dir=$(_pipeline_artifact_dir "$pipeline_id")

    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Gather data for wrap-up doc
    local worktrees_list
    worktrees_list=$(echo "$entity" | jq -r '.worktrees[]' 2>/dev/null)
    local prs_json
    prs_json=$(echo "$entity" | jq -r '.prs | to_entries[] | "- \(.key): #\(.value)"' 2>/dev/null)
    local kb_docs_list
    kb_docs_list=$(echo "$entity" | jq -r '.kbDocs[]' 2>/dev/null)

    # Write wrap-up document
    local wrapup_file="${artifact_dir}/wrap-up.md"
    cat > "$wrapup_file" <<WRAPUP
# Wrap-Up: ${pipeline_id}

**Pipeline**: ${pipeline_id}
**Name**: ${p_name}
**Type**: ${p_type}
**Issue**: ${p_issue}
**Completed**: ${now}

## What Was Built

$(if [[ -n "$worktrees_list" ]]; then
    echo "### Sessions"
    echo "$worktrees_list" | sed 's/^/- /'
else
    echo "No sessions tracked."
fi)

## Pull Requests

$(if [[ -n "$prs_json" ]]; then echo "$prs_json"; else echo "None tracked."; fi)

## KB Docs

$(if [[ -n "$kb_docs_list" ]]; then echo "$kb_docs_list" | sed 's/^/- /'; else echo "None yet."; fi)

## Plan Deviations

<!-- List any deviations from the original manifest -->
- TBD: compare manifest vs actual sessions

## Patterns Discovered

<!-- Patterns worth extracting for future pipelines -->
- TBD

## Review Issues & Resolutions

<!-- Summary of CodeRabbit / self-review findings -->
- TBD

## Learnings

<!-- What worked, what didn't, what to change -->
- TBD

## Recommended Agent Memory Updates

<!-- Scoped per agent type -->
### frontend-builder
- TBD

### build-reviewer
- TBD

---
*Generated by \`work end\` at ${now}*
WRAPUP

    echo "  Wrap-up doc: $wrapup_file"

    # Record artifact in entity
    local artifacts_json
    artifacts_json=$(_pipeline_read "$pipeline_id" | jq --arg path "$wrapup_file" '.artifacts + {"wrap-up": $path}')
    _pipeline_update_json "$pipeline_id" "artifacts" "$artifacts_json" || true
}
