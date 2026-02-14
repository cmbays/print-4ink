---
name: build-session-protocol
description: Completion protocol for build sessions — guides from implementation through self-review, PR, CodeRabbit, and merge-ready state
trigger: Loaded automatically by build sessions via phase prompt. Also invoke manually with "Use the build-session-protocol skill"
prerequisites:
  - Working git worktree with feature branch
  - CLAUDE.md loaded for project context
---

# Build Session Protocol

## Overview

This skill defines the end-to-end completion flow for every build session in Screen Print Pro. It ensures consistent quality by enforcing self-review, structured PR creation, and automated review integration before declaring work merge-ready.

## Process

### Phase 1: Build

1. Read the task prompt carefully — understand what to build
2. Read `CLAUDE.md` for coding standards and design system
3. Read relevant breadboard/plan docs referenced in the prompt
4. Build the feature following TDD principles where applicable
5. Run `npm run build` and `npm test` to verify no regressions
6. Run `npx tsc --noEmit` to verify type safety

### Phase 2: Self-Review

After implementation is complete, launch sub-agent reviews:

7. **Code quality review**: Use the **build-reviewer** agent to check for:
   - DRY violations and unused code
   - `any` types (should use Zod inference)
   - Proper `cn()` usage (no string concatenation for classNames)
   - Tailwind tokens (no hardcoded px values)
   - Component composition patterns
   - Zod-first types (no standalone interfaces for schema data)
   - Correct shadcn/ui usage

8. **Financial safety review**: If the diff touches files in `lib/schemas/`, `lib/helpers/`, pricing engines, or any component displaying monetary values, use the **finance-sme** agent to verify:
   - All monetary arithmetic uses `big.js` via `lib/helpers/money.ts`
   - No raw `+`, `-`, `*`, `/` on money values
   - Equality checks use `Big.eq()`, not `===`
   - `round2()` applied before output
   - `formatCurrency()` used for display

9. **Security scan**: Check for:
   - No hardcoded secrets or credentials
   - Proper input validation at system boundaries
   - No raw HTML injection without sanitization (use safe React patterns)

10. Address all critical and high-severity findings before proceeding.

### Phase 3: Create PR

11. Stage and commit changes with a descriptive message
12. Push the branch to origin
13. Create a PR using the merge checklist template:

```bash
gh pr create --title "<type>(<vertical>): <description>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing what was built>

## Merge Checklist

### What was built
- [ ] <Feature/component 1>
- [ ] <Feature/component 2>

### Approach
<Why this approach was chosen, key trade-offs>

### Key decisions
- <Decision 1 and rationale>

### Review summary
- **Self-review**: <N findings addressed, M deferred>
- **Deferred items**: Filed as GitHub Issues (linked below)

### Testing
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Manual verification: <what was checked>

### Links
- KB doc: <path or URL>
- Breadboard: <path or URL>
- Plan: <path or URL>

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Phase 4: CodeRabbit Review

14. Wait for CodeRabbit automated review (triggers on PR creation)
15. Address all critical and major CodeRabbit comments
16. For remaining items (minor, style, suggestions):
    - Create GitHub Issues with labels:
      - `vertical/<name>` — which vertical
      - `type/tech-debt` — deferred review item
      - `source/review` — originated from code review
      - `priority/low` or `priority/medium` — based on impact

### Phase 5: Final Check

17. Run a quick spot-check re-review via sub-agent on the final diff
18. Verify all tests still pass after addressing review comments
19. Update the PR description with final status

### Phase 6: Ready for Merge

20. Post a comment on the PR: "Ready for merge. All critical/major review items addressed. Deferred items filed as GitHub Issues."
21. Notify the user that the PR is ready

## Rules

- **Never modify tests to make them pass** — fix the implementation
- **Never use floating-point arithmetic for financial data** — use `big.js` via `lib/helpers/money.ts`
- **Never push directly to main** — always branch + PR
- **Never skip self-review** — even for small changes
- **Always apply labels** from the PM label schema when creating GitHub Issues
- **Always run build + test + typecheck** before creating PR
- **Commit message format**: `<type>(<scope>): <description>` where type is feat/fix/docs/refactor/test

## Tips

- Read existing code before writing new code — understand patterns in use
- Check `components/ui/` for shadcn primitives before creating custom components
- Use `cn()` from `@/lib/utils` for all className composition
- Keep PRs focused — one logical change per PR
- If you discover work outside your task's scope, file a GitHub Issue instead of doing it
