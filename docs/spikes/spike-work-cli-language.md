# Spike: Work CLI Implementation Language

**Issue**: [#346](https://github.com/cmbays/print-4ink/issues/346) — Evaluate CLI implementation language
**Parent**: [#333](https://github.com/cmbays/print-4ink/issues/333) — Work CLI Robustness
**Date**: 2026-02-17
**Status**: Complete

---

## Context

The `work` CLI (`scripts/work.sh` + `scripts/lib/*.sh`) manages the full pipeline lifecycle for Screen Print Pro development. It was prototyped in bash for zero-dependency shell integration — sourcing directly into zsh, managing git worktrees, launching Zellij sessions, and orchestrating Claude Code instances.

**Codebase size**: 4,215 lines across 13 files (1 dispatcher + 12 library modules).

| File | Lines | Purpose |
|------|-------|---------|
| `work.sh` | 1,296 | Main dispatcher, session management, build orchestration, progress report |
| `pipeline-end.sh` | 382 | Post-build: final PR, merge polling, wrap-up doc generation |
| `pipeline-start.sh` | 378 | Pre-build: Claude prompt construction, Zellij launch |
| `pipeline-entity.sh` | 375 | Entity CRUD, state machine, type validation |
| `pipeline-gates.sh` | 311 | Stage gate validation, artifact checks, human approval prompts |
| `pipeline-build.sh` | 300 | Build wave orchestration, base branch management |
| `registry.sh` | 246 | Session registry CRUD, Claude session ID capture |
| `pipeline-status.sh` | 222 | Dashboard display, deep-dive detail view |
| `pipeline-registry.sh` | 191 | Pipeline registry CRUD with file locking |
| `kdl-generator.sh` | 173 | Zellij KDL layout generation from YAML manifests |
| `pipeline-cooldown.sh` | 143 | Batch cooldown processing |
| `pipeline-define.sh` | 118 | Pipeline creation command |
| `pipeline-update.sh` | 80 | Pipeline field modification |

**External dependencies**: 139 `jq` invocations, 29 `yq` calls, 28 `git` calls, 21 `gh` calls, 12 `zellij` calls, 15 `tmux` calls, 30 `claude` references, 11 `npm` calls.

---

## 1. Current Pain Points

### 1.1 No Type System — Everything Is a String

Every value passes through bash as a string. Type dispatch requires manual case branches or jq conversions. This creates subtle bugs that only surface at runtime.

**Example** — `pipeline-entity.sh:35-36` (state machine validation):
```bash
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
```

This state machine has no compiler-checked exhaustiveness. A typo like `"reviwing"` silently falls through to `*)`. In TypeScript, this would be a discriminated union with `satisfies` checking. In Go, an enum-style `iota` constant set.

**Example** — `pipeline-update.sh:32-75` (flag dispatch):
```bash
while [[ $# -gt 0 ]]; do
    case "$1" in
        --auto)     _pipeline_update_json "$pipeline_id" "auto" "true" || return 1 ;;
        --no-auto)  _pipeline_update_json "$pipeline_id" "auto" "false" || return 1 ;;
        --issue)    local issue_num="${2:?'--issue requires a value'}" ...
```

Every new flag requires manually adding a case branch. The value type (string vs JSON vs number) is known only by convention. A config-driven approach (#325) could generate this, but bash has no mechanism to generate typed code from a schema.

### 1.2 Error Propagation Is Fragile

Bash relies on return codes (`$?`) and convention. The `local` keyword silently clobbers `$?`, requiring separate declaration and assignment lines.

**Example** — `work.sh:933-936` (the workaround comment is telling):
```bash
# NB: local and assignment MUST be separate lines. In bash,
# 'local var=$(cmd)' clobbers $? with local's exit status (always 0).
local wt_err
wt_err=$(git -C "$PRINT4INK_REPO" worktree remove "$WORKTREE_DIR" --force 2>&1)
```

This pattern appears throughout the codebase. A typed language would have try/catch or Result types.

### 1.3 JSON Manipulation Is Awkward

With 139 jq invocations, the CLI is essentially a jq orchestrator. Every registry read, pipeline update, and config lookup shells out to `jq` as a subprocess.

**Example** — `pipeline-status.sh:55-58` (a single status row requires multiple jq calls):
```bash
p_type=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .type' "$PIPELINE_REGISTRY_FILE")
p_stage=$(jq -r --arg id "$id" '.pipelines[] | select(.id == $id) | .stage' "$PIPELINE_REGISTRY_FILE")
```

Each line spawns a subprocess, re-reads the file, and re-parses it. A typed language would deserialize once and access fields directly.

**Example** — `pipeline-entity.sh:162-188` (building a JSON entity):
```bash
entity=$(jq -n \
    --arg id "$id" --arg name "$name" --arg type "$type" \
    --argjson products "$products" --argjson tools "$tools" \
    --arg stage "$first_stage" --arg created "$now" \
    '{ id: $id, name: $name, type: $type, ... }')
```

Object construction requires passing every field as a named argument. Missing a `--arg` causes a silent empty string.

### 1.4 Zsh/Bash Array Incompatibility

The code is sourced into zsh but has a bash shebang. Arrays are 0-indexed in bash, 1-indexed in zsh. The codebase works around this with manual index adjustment.

**Example** — `work.sh:614-616`:
```bash
local _arr_start=0
[[ -n "${ZSH_VERSION:-}" ]] && _arr_start=1
```

This pattern appears in both `work.sh` and `pipeline-build.sh`. It's a maintenance hazard — forget it in one place and you get off-by-one bugs that only manifest in one shell.

### 1.5 No Test Framework

There are zero tests for the work CLI. The 529 tests in the project are all Vitest schema tests for the Next.js app. Shell script testing frameworks (bats-core) exist but:
- No IDE integration (no red squiggles, no test explorer)
- Test fixtures require temp directories and cleanup
- Mocking external commands (git, gh, zellij) is manual and fragile
- No coverage reporting

### 1.6 Registry File Locking Is Manual

Both `registry.sh` and `pipeline-registry.sh` implement their own mkdir-based advisory locking. This works but is fragile — stale locks require manual cleanup.

**Example** — `pipeline-registry.sh:23-35`:
```bash
_pipeline_registry_lock() {
    local lockdir="${PIPELINE_REGISTRY_FILE}.lock"
    local attempts=0
    while ! mkdir "$lockdir" 2>/dev/null; do
        attempts=$((attempts + 1))
        if (( attempts > 50 )); then
            echo "Error: Could not acquire pipeline registry lock after 5s." >&2
            return 1
        fi
        sleep 0.1
    done
}
```

A typed language would use proper file locking primitives (flock, or a proper mutex library).

---

## 2. Startup Latency Benchmarks

All measurements on Apple Silicon (M-series), macOS Darwin 25.2.0, warm cache.

| Operation | Time | Notes |
|-----------|------|-------|
| `source work.sh` (into running shell) | **8ms** | Near-instant. No subprocesses. |
| `work status` (pipeline dashboard) | **70ms** | 1 jq read + config lookups |
| `work list` (show infra) | **537ms** | `git worktree list` + `zellij list-sessions` + port scan |
| `node -e 'process.exit(0)'` | **49ms** | Node.js cold start baseline |
| `node` + JSON parse (2 config files) | **54ms** | +5ms for fs.readFileSync + JSON.parse |
| `bash -c 'node -e ...'` (hybrid call) | **143ms** | bash → node subprocess overhead |
| `bash -c 'node + 2 JSON reads'` | **201ms** | bash → node with schema loading |
| `jq` (single query) | **3-4ms** | Per-invocation subprocess cost |
| `npx tsx -e ...` | **1,639ms** | TypeScript JIT compilation — unusable |
| `node --version` | **16ms** | Minimal node startup |

**Key observations**:
- Sourcing bash is essentially free (8ms). This is unbeatable.
- `jq` is fast per-call (3-4ms) but the 134 invocations in status/display paths add up.
- Node.js cold start is ~50ms — acceptable for subcommands but noticeable for `work list`.
- `npx tsx` is 1.6 seconds — a TypeScript JIT approach without pre-compilation is not viable.
- The **hybrid penalty** (bash → node subprocess) is ~90-150ms overhead per delegation. This means hybrid commands would need to batch operations in a single node call, not make multiple small calls.

---

## 3. Shell Integration Analysis — What MUST Stay in Bash

Regardless of language choice, these capabilities require bash/zsh:

### 3.1 Must Stay in Bash

| Capability | Why |
|-----------|-----|
| `work()` shell function | Must be sourceable into zsh. Tab completion, shell aliases. |
| `$ZELLIJ` / `$TMUX` environment detection | Parent process context — only visible from the sourced shell. |
| `source scripts/work.sh` | Users add this to `.zshrc`. Non-negotiable. |
| `cd "$WORKTREE_DIR"` | Changes the calling shell's working directory. A subprocess can't do this. |
| `zellij action new-tab` | Must run in the Zellij context of the calling shell. |
| `tmux` session/window management | Must detect and modify the calling tmux session. |
| Port scanning (`lsof`) | Interactive feedback during worktree creation. |
| `read -r` for confirmations | Gate prompts (human-confirms) must block the calling shell. |

### 3.2 Can Be Delegated to an External Binary

| Capability | Why |
|-----------|-----|
| Pipeline entity CRUD | JSON read/write/validate — pure data transformation. |
| State machine transitions | Validation logic with no shell side effects. |
| Config schema loading & validation | Parse `config/*.json`, validate values. |
| Registry read/update/lock | File I/O with atomic write semantics. |
| Status dashboard formatting | Read JSON, format output. |
| PR body generation | Template interpolation from entity data. |
| Progress report generation | GitHub API queries + markdown assembly. |
| Prompt construction | String interpolation from pipeline context. |
| Manifest parsing (YAML) | `yq` equivalent in native code. |

### 3.3 The 60/40 Split

Approximately **60% of the code** (entity CRUD, state machine, registry, status formatting, config validation, prompt building) is pure logic that could live in any language.

Approximately **40% of the code** (worktree creation, Zellij/tmux integration, `work()` dispatcher, phase commands, build wave orchestration, cleanup) requires shell integration and would either stay in bash or need a very thin bash shim.

---

## 4. Evaluation Matrix

### Criteria Definitions

| # | Criterion | Weight | What "5" looks like |
|---|-----------|--------|---------------------|
| 1 | Startup latency | HIGH | `work list` < 100ms |
| 2 | Shell integration | HIGH | Seamless zsh sourcing, env vars, Zellij/tmux |
| 3 | Schema consumption | MEDIUM | Native JSON/YAML parsing with typed validation |
| 4 | Testing story | HIGH | Unit tests with mocking, coverage, IDE integration |
| 5 | Maintenance burden | HIGH | Easy to add commands/flags, compiler catches renames |
| 6 | Dependency footprint | LOW | Minimal user-installed prerequisites |
| 7 | Migration path | HIGH | Incremental adoption without big-bang rewrite |

### Scoring (1-5, higher is better)

| Criterion | A: Enhanced Bash | B: TypeScript (Node) | C: Go | D: Hybrid (TS core + bash shell) |
|-----------|:---:|:---:|:---:|:---:|
| **1. Startup latency** | 5 | 3 | 5 | 4 |
| **2. Shell integration** | 5 | 1 | 2 | 5 |
| **3. Schema consumption** | 2 | 5 | 4 | 5 |
| **4. Testing story** | 2 | 5 | 5 | 4 |
| **5. Maintenance burden** | 2 | 4 | 4 | 4 |
| **6. Dependency footprint** | 4 | 3 | 4 | 3 |
| **7. Migration path** | 5 | 1 | 1 | 5 |
| **Weighted total** | 25/35 | 22/35 | 25/35 | **30/35** |

### Detailed Scoring Rationale

**A: Enhanced Bash (25/35)**
- Startup: 5 — Sourcing is 8ms. Unbeatable.
- Shell: 5 — It IS the shell. No delegation friction.
- Schema: 2 — jq works but every access is a subprocess. No compile-time validation. Adding a field requires updating case statements in multiple files.
- Testing: 2 — bats-core exists but has no IDE integration, no coverage, and mocking external commands is painful. This is the killer weakness.
- Maintenance: 2 — No types, no compiler, no autocomplete. The zsh/bash array incompatibility is an ongoing hazard. Every new command is a copy-paste of the case/esac pattern.
- Dependencies: 4 — jq and yq are the only non-standard deps. Both install via brew.
- Migration: 5 — No migration needed. Keep building where we are.

**B: TypeScript / Node.js (22/35)**
- Startup: 3 — Node.js is ~50ms baseline, ~200ms with schema loading. Acceptable for most commands but `work list` and `work status` would feel sluggish compared to today's 70ms. `npx tsx` is 1.6s — unusable without pre-compilation.
- Shell: 1 — Cannot source into zsh. Would need a complete rewrite with a new UX (CLI binary instead of shell function). Users lose tab completion, environment variable access, and the ability to `cd` into worktrees.
- Schema: 5 — Zod validation, TypeScript inference, shared types with the Next.js app. This is the primary draw.
- Testing: 5 — Vitest with full mocking, coverage, IDE integration. Same toolchain as the app.
- Maintenance: 4 — TypeScript compiler catches type errors, renames propagate, IDE autocomplete. But the Node.js ecosystem adds churn (package updates, ESM/CJS issues).
- Dependencies: 3 — Requires Node.js (already installed), but adds a package.json with dependencies (commander, zod, etc.). The CLI would need its own build step.
- Migration: 1 — All-or-nothing. Can't source a Node.js binary into zsh. The shell integration story completely changes.

**C: Go (25/35)**
- Startup: 5 — Go binaries start in ~5ms. Single static binary with no runtime.
- Shell: 2 — Same problem as TypeScript — can't source into zsh. Would need a bash wrapper for shell integration, but the wrapper → binary call adds ~10ms overhead (much less than Node.js). Cross-compilation is easy.
- Schema: 4 — Strong typing with struct tags. JSON/YAML parsing is native. No Zod equivalent, but Go's type system is sufficient for config validation.
- Testing: 5 — `go test` with excellent mocking, benchmarking, coverage. Table-driven tests are a natural fit for state machine validation.
- Maintenance: 4 — Go compiler is strict. Renames propagate. But Go is a different language from the app — context switching overhead for a solo developer.
- Dependencies: 4 — Single binary. User needs nothing extra installed (not even Go — distribute pre-compiled binary).
- Migration: 1 — All-or-nothing rewrite. Different language, different toolchain, different mental model.

**D: Hybrid — TypeScript Core + Bash Shell (30/35)**
- Startup: 4 — Bash sourcing is still 8ms. TypeScript core is called as a subprocess (~50-200ms per delegation). Fast for shell-only commands, acceptable for data-heavy commands. The key insight: batch operations in a single Node call instead of many small calls.
- Shell: 5 — The bash shell layer is unchanged. Users still `source work.sh`, still get tab completion, still have `$ZELLIJ` detection. Shell integration stays in bash.
- Schema: 5 — TypeScript core uses Zod for config validation, shares types with the Next.js app. Pipeline entity types are defined once and used everywhere.
- Testing: 4 — TypeScript core is fully testable with Vitest. Bash shell layer has limited testing (integration tests via bats-core or manual). Not 5 because the bash glue code remains untestable by conventional means.
- Maintenance: 4 — TypeScript core benefits from compiler, autocomplete, and type safety. Bash shell layer is thin and stable (routing + shell integration). New flags can be schema-driven in the TS core.
- Dependencies: 3 — Node.js (already installed) + a project-local package. The TS core compiles to a single JS bundle or uses `node` directly.
- Migration: 5 — **Incremental by design.** Each command's logic can migrate independently: bash dispatcher stays, calls `node scripts/work-core.js <subcommand> <args>` for the data-heavy parts. Shell integration stays in bash. No big-bang rewrite.

---

## 5. Migration Path Analysis

### Option A: Enhanced Bash — No Migration

Stay where we are. Add bats-core for testing, shellcheck for linting, and accept the ceiling.

**Effort**: Low (days)
**Risk**: Low
**Ceiling**: Medium — the 134 jq calls and lack of types will continue to be a friction tax on every new feature.

### Option B: Full TypeScript — Big-Bang Rewrite

Replace the entire `work` CLI with a Node.js/TypeScript CLI binary (e.g., using commander.js or oclif).

**Effort**: High (weeks). Rewrite 4,215 lines + design new shell integration story.
**Risk**: High. Shell integration changes drastically. Users lose `source work.sh`.
**Migration**: All-or-nothing. Can't run half-bash, half-typescript.
**Blocker**: Node.js startup penalty for simple commands. Would need a daemon or socket server to amortize startup — significant complexity.

### Option C: Full Go — Big-Bang Rewrite

Replace with a Go binary. Same UX change as TypeScript but faster startup.

**Effort**: High (weeks). Different language from the rest of the project.
**Risk**: High. Chris would need to learn/maintain Go alongside TypeScript.
**Migration**: All-or-nothing. Same problem as TypeScript.
**Advantage over B**: ~5ms startup, single binary distribution.

### Option D: Hybrid — Incremental TypeScript Core

Keep `work.sh` as the bash dispatcher and shell integration layer. Extract pure logic into a TypeScript module that bash calls as a subprocess.

**Architecture**:
```
                                  ┌──────────────────────────┐
  User's zsh                      │  scripts/work-core/      │
  ─────────                       │  (TypeScript, compiled)   │
  source scripts/work.sh          │                          │
        │                         │  src/                    │
        ▼                         │    pipeline-entity.ts    │
  work() bash function            │    pipeline-registry.ts  │
  ├─ Shell integration            │    state-machine.ts      │
  │  (git, zellij, tmux,         │    config-loader.ts      │
  │   worktree, cd, env)         │    status-formatter.ts   │
  │                               │    gates.ts             │
  └─ Delegates data ops ──────►  │    prompt-builder.ts     │
     node dist/work-core.js       │                          │
     <subcommand> <json-args>     │  Compiled to:            │
                                  │    dist/work-core.js     │
                                  └──────────────────────────┘
```

**Migration sequence** (incremental, one module at a time):

1. **Phase 0: Setup** — Create `scripts/work-core/` with package.json, tsconfig, Vitest config. Add `npm run build:cli` to compile.

2. **Phase 1: Pipeline entity & state machine** — Migrate `pipeline-entity.sh` logic to TypeScript. Bash calls `node dist/work-core.js entity read <id>` instead of raw jq. Tests validate state transitions exhaustively.

3. **Phase 2: Registry operations** — Migrate `pipeline-registry.sh` and `registry.sh`. Proper file locking, atomic writes, typed CRUD.

4. **Phase 3: Config loading & validation** — Migrate config schema loading. Zod schemas shared with Next.js app. `work define` validates against typed schemas instead of jq queries.

5. **Phase 4: Status & formatting** — Migrate `pipeline-status.sh` display logic. Single `node` call replaces 30+ jq invocations.

6. **Phase 5: Prompt building** — Migrate `pipeline-start.sh` prompt construction. Template interpolation in TypeScript.

7. **Phase 6: Progress report** — Migrate `_work_progress`. GitHub API calls via `@octokit/rest` instead of `gh` CLI.

Each phase is independently shippable. The bash dispatcher stays unchanged. Users notice nothing except (potentially) slightly different output formatting.

**Effort**: Medium (spread over weeks). Each phase is a focused PR.
**Risk**: Low. Bash shell layer is untouched. Rollback = revert to jq calls.
**Key constraint**: The compiled `dist/work-core.js` must be checked into git (or built on install) so that `source work.sh` works without a build step.

---

## 6. Recommendation

### Recommended: Option D — Hybrid (TypeScript Core + Bash Shell)

**Rationale**:

1. **Preserves what works**: Shell integration (sourcing, env vars, Zellij/tmux, worktree creation) stays in bash. Users see zero UX change. The `work()` function stays exactly as it is.

2. **Fixes the core problem**: The 134 jq invocations, untyped state machine, manual flag dispatch, and untestable logic all move to TypeScript where they get Zod validation, Vitest tests, and compiler checking.

3. **Incrementally adoptable**: Unlike Options B and C, the hybrid approach doesn't require a big-bang rewrite. Each module migrates independently. If we hit a problem with one module, the bash fallback still works.

4. **Shared type system**: Pipeline entity schemas defined in Zod can be shared between the work CLI and the Next.js app. When Phase 2 adds a Drizzle database, the same types flow from CLI → app → database.

5. **Acceptable startup penalty**: The hybrid adds ~50-200ms for commands that delegate to Node.js. But the most latency-sensitive commands (`work list`, `work status`) can batch all their data operations in a single `node` call, keeping total time under 150ms.

6. **Testing story is strong**: The TypeScript core is fully testable with Vitest. The bash shell layer is thin and stable — it's just routing and shell integration, which changes infrequently.

### What NOT to do

- **Don't compile to a native binary** (pkg, bun compile, Deno compile). The build complexity isn't worth it for a developer tool used by one person.
- **Don't use `npx tsx`** for runtime execution. It's 1.6 seconds. Pre-compile with `tsc` or `esbuild` instead.
- **Don't try to eliminate bash entirely**. Shell integration is bash's superpower. Trying to replicate `source`, `$ZELLIJ`, and `cd` from TypeScript adds more complexity than it removes.
- **Don't start with bats-core tests for bash** as a "first step." If we're going hybrid anyway, writing bash tests for code that will be rewritten in TypeScript is wasted effort.

### Implementation Sequencing

Given the dependencies mapped in the previous session:

1. **This spike** → decision made (Option D: Hybrid)
2. **#327 (config-driven `work define`)** — implement in TypeScript core as the pilot migration. This is the cleanest module to extract because `pipeline-define.sh` is only 118 lines and mostly delegates to `_pipeline_create` in entity.sh.
3. **#330 (pipeline state machine as config)** — extract to TypeScript. Define the state machine as a typed graph with exhaustive transition checking.
4. **#332 (config-driven help text)** — generate help from TypeScript-defined schemas.
5. **#335 (Zellij auto-launch)** — this stays in bash (shell integration). Independent of the hybrid migration.
6. **#298 (E2E validation)** — now testable: write Vitest tests for the TypeScript core, integration tests for the bash shell layer.

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Node.js startup adds latency | Batch operations in single `node` calls. Use `esbuild` for fast compilation to a single file. |
| Two languages to maintain | The bash layer is thin (~600 lines of routing + shell integration). It changes rarely. |
| Built JS must be checked in or built on install | Add `npm run build:cli` to `npm install` postinstall hook. |
| TypeScript core grows its own dependency tree | Keep deps minimal: Zod + YAML parser. No framework (commander, oclif). |
| Debugging across bash → node boundary | Structured JSON output from node. `--debug` flag for verbose logging. |

---

## Appendix: Raw Benchmark Data

```
Environment: macOS Darwin 25.2.0, Apple Silicon, Node.js v25.5.0

source work.sh:           0.008s (8ms)
work status (dashboard):  0.070s (70ms)
work list (infra):        0.537s (537ms) — dominated by git/zellij/lsof subprocess calls

node -e 'exit':           0.049s (49ms)
node + 2 JSON reads:      0.054s (54ms)
node --version:           0.016s (16ms)
npx tsx -e 'exit':        1.639s (1,639ms)

bash -> node subprocess:  0.143s (143ms)
bash -> node + schemas:   0.201s (201ms)

jq single query:          0.003s (3ms)
jq config file read:      0.004s (4ms)

Go: not installed (benchmark unavailable — estimated 5-10ms from published data)
Bun: not installed
Deno: not installed
```

---

*Generated by Claude Code session `session/0217-language-spike` for issue #346.*
