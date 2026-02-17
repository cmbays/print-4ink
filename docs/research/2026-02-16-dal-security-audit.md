# DAL Architecture Security Audit Report

**Auditor**: Security Specialist Review (AI Agent)
**Date**: 2026-02-16
**Scope**: `docs/research/2026-02-16-dal-architecture-research.md` and surrounding codebase
**Related Issues**: #360 (DAL epic), #158 (DAL with mock passthrough), #356 (Phase 2 Backend Foundation)

---

## 1. Security Posture Summary

The DAL research document demonstrates strong architectural instincts. The flat-function pattern, `server-only` guard, DTO return types, and adapter abstraction are all sound foundations. The design correctly identifies the DAL as a security boundary (not merely an organizational layer) and references the Next.js official security guidance.

However, the document is primarily an _architectural_ research artifact, not a security design. Security considerations appear as incidental mentions rather than first-class concerns. Several critical areas are entirely absent: there is no threat model, no discussion of authorization granularity beyond "auth at every access point," no treatment of the S&S API proxy as an attack surface, and no consideration of how AI agents interact with secrets during development.

**Overall Assessment**: The architecture is _security-compatible_ but not yet _security-designed_. The foundation is good enough that security can be layered in during implementation rather than requiring a redesign, but specific gaps must be addressed before Phase 2 backend work begins.

**Risk Level**: **MEDIUM** for Phase 1 (mock data, no real backend). **HIGH** if Phase 2 proceeds without addressing the Critical Findings below.

---

## 2. Critical Findings

### CRITICAL-01: No Auth Verification Design for DAL Functions

**Severity**: CRITICAL (Phase 2 blocker)
**OWASP Category**: A01:2021 Broken Access Control

The research document mentions "auth at every access point" and "auth verification to DAL functions" (Wave 5) but provides zero design detail. There is no specification for:

- How session verification works (cookie-based? JWT? Supabase Auth tokens?)
- Where `verifySession()` is implemented and what it returns
- Whether auth is per-function (every DAL call) or per-request (middleware + DAL trust)
- How the current demo-access cookie transitions to real auth
- Whether different DAL functions require different permission levels

The existing `middleware.ts` performs only a binary cookie check (`demo-access` exists or not). There is no session object, no user identity, and no role-based access. The middleware is currently the _sole_ auth layer -- the exact pattern the Next.js security docs warn against.

**Recommendation**: Before Phase 2, design a concrete `verifySession()` function that:

1. Returns a typed `Session` object (userId, role, permissions) or `null`
2. Lives in `lib/auth/session.ts` with `import 'server-only'`
3. Uses React `cache()` for per-request deduplication
4. Is called at the top of every DAL function that accesses user-scoped data
5. Documents which DAL functions are public (catalog lookups) vs. authenticated (customer data, pricing, invoices)

### CRITICAL-02: Demo-Access Cookie Lacks Integrity Verification

**Severity**: CRITICAL (present in production now)
**OWASP Category**: A07:2021 Identification and Authentication Failures
**File**: `middleware.ts` (lines 19-20), `app/api/demo-login/route.ts` (lines 35-36)

The current demo auth system sets a cookie with value `'true'`. The middleware only checks for the cookie's _existence_, not its value. Any client that manually sets `Cookie: demo-access=anything` bypasses authentication entirely. While this is a demo-access system and not production auth, this pattern sets a dangerous precedent that could be copy-pasted into real auth code.

**Recommendation**: Sign the cookie value with an HMAC using a server-side secret (or use Supabase Auth sessions from the start). At minimum, verify the cookie value matches the expected string in middleware, not just existence.

### CRITICAL-03: Provider Selection via Environment Variable Without Validation

**Severity**: HIGH
**OWASP Category**: A05:2021 Security Misconfiguration

The research document proposes a fail-open default: any misconfiguration (missing env var, typo like `'supabse'`) silently falls through to the mock provider, serving fake data in production. In a screen-printing shop app handling real pricing and invoices, serving mock data for a `$725.00` invoice when the real total is `$1,200.00` is a business-critical failure.

**Recommendation**: Fail-closed provider selection:

```typescript
const providerName = process.env.DATA_PROVIDER
if (providerName === 'supabase') {
  /* load supabase */
} else if (providerName === 'mock') {
  /* load mock */
} else {
  throw new Error(`DATA_PROVIDER must be 'supabase' or 'mock', got: '${providerName}'`)
}
```

**Resolution**: Incorporated into shaping as requirement R4.5 and shape part B9.

### CRITICAL-04: No `server-only` Package Currently Installed

**Severity**: HIGH (Phase 1 gap)
**OWASP Category**: A04:2021 Insecure Design

The `server-only` package is not in `package.json` dependencies and no file in the codebase currently uses `import 'server-only'`.

**Recommendation**: Install `server-only` immediately and establish the pattern.

**Resolution**: Incorporated into shaping as shape part B12 (install now, enforce in Phase 2).

---

## 3. Recommendations by Category

### 3.1 DAL-Specific Security Patterns

| ID   | Recommendation                                                                         | Priority | When           |
| ---- | -------------------------------------------------------------------------------------- | -------- | -------------- |
| R-01 | Defense-in-depth auth: middleware → verifySession() → DAL → RLS (4 independent layers) | HIGH     | Phase 2 design |
| R-02 | DTO projection with explicit field allowlists per entity                               | MEDIUM   | Wave 0         |
| R-03 | Zod input validation at DAL boundary (re-validate even after Server Action validation) | MEDIUM   | Wave 0         |
| R-04 | Supabase RLS enabled on every table from day one (Drizzle migration convention)        | HIGH     | Phase 2        |

### 3.2 OWASP Top 10 Relevance

| OWASP Category                     | Applies?      | Current Risk                | DAL Mitigation                                                                                                                                    |
| ---------------------------------- | ------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A01: Broken Access Control**     | YES           | HIGH                        | Auth in every DAL function, RLS as safety net, DTO projection strips unauthorized data                                                            |
| **A02: Cryptographic Failures**    | YES (Phase 2) | LOW                         | S&S API credentials stored in env vars (not code), Supabase connection strings in Vercel env                                                      |
| **A03: Injection**                 | YES           | LOW (Drizzle parameterizes) | Drizzle ORM parameterizes all queries by default. NEVER use `sql.raw()` with user input. Zod validation at DAL boundary prevents malformed input. |
| **A04: Insecure Design**           | YES           | MEDIUM                      | `server-only` guard, typed DTOs, fail-closed provider selection. Missing: threat model.                                                           |
| **A05: Security Misconfiguration** | YES           | MEDIUM                      | Fail-open provider selection (CRITICAL-03). Missing: security headers in `next.config.ts`, CSP policy.                                            |
| **A06: Vulnerable Components**     | MONITOR       | LOW                         | Dependencies are current. Monitor for Supabase client CVEs when added.                                                                            |
| **A07: Auth Failures**             | YES           | HIGH                        | Demo cookie lacks integrity (CRITICAL-02). No session management design.                                                                          |
| **A08: Data Integrity Failures**   | YES (Phase 2) | LOW                         | Big.js financial arithmetic is solid. Server Actions need CSRF protection (built into Next.js).                                                   |
| **A09: Logging & Monitoring**      | MISSING       | HIGH                        | No logging strategy in DAL design. No audit trail for data mutations.                                                                             |
| **A10: SSRF**                      | YES           | HIGH (Phase 2)              | S&S API proxy is an SSRF vector.                                                                                                                  |

### 3.3 Next.js-Specific Security Concerns

| ID   | Concern                                                                            | Status                |
| ---- | ---------------------------------------------------------------------------------- | --------------------- |
| R-05 | Server Action CSRF protection (built into Next.js, ensure not disabled)            | Phase 2               |
| R-06 | CVE-2025-29927 lesson: middleware is not a security boundary                       | Architecture decision |
| R-07 | Server/client data leakage via props                                               | Wave 1-4              |
| R-08 | Environment variable exposure (`NEXT_PUBLIC_` prefix, `SUPABASE_SERVICE_ROLE_KEY`) | Wave 0 + Phase 2      |

### 3.4 AI-Agent Security Considerations

| ID   | Concern                                                             | Status  |
| ---- | ------------------------------------------------------------------- | ------- |
| R-09 | Pre-commit hook scanning for API keys/credentials in committed code | Ongoing |
| R-10 | Drizzle parameterized query enforcement — lint rule for `sql.raw()` | Phase 2 |

### 3.5 S&S Activewear API Proxy Security

| ID   | Concern                                                    | Status                 |
| ---- | ---------------------------------------------------------- | ---------------------- |
| R-11 | Endpoint whitelisting (SSRF prevention) — 5-path allowlist | Before S&S integration |
| R-12 | Pricing field stripping — response allowlist, not denylist | Before S&S integration |
| R-13 | Rate limiting with circuit breaker (Upstash Redis)         | Before S&S integration |
| R-14 | S&S credential storage and rotation                        | Before S&S integration |

### 3.6 Gaps in Current Research

| Gap                             | Risk                                                    | When to Address             |
| ------------------------------- | ------------------------------------------------------- | --------------------------- |
| **Threat model**                | No structured analysis of attack surfaces               | Before Phase 2 begins       |
| **Logging and audit trail**     | No infrastructure-level security event logging          | Wave 0 (foundation)         |
| **Rate limiting for mutations** | Server Actions have no rate limiting                    | Wave 5 (backend connection) |
| **Data classification**         | No sensitivity categorization (PII vs. public catalog)  | Before Phase 2              |
| **Multi-tenancy**               | Research assumes single-tenant — document explicitly    | Now (architecture decision) |
| **Content Security Policy**     | `next.config.ts` has no security headers                | Wave 0                      |
| **Error message disclosure**    | Thrown errors must not include SQL/schema in production | Wave 0                      |
| **Dependency supply chain**     | No `npm audit` in CI                                    | Now                         |

---

## 4. Security Acceptance Criteria for #158

### Phase 1 (Must-have for DAL implementation)

- [ ] `server-only` package installed in `package.json`
- [ ] Provider selection is fail-closed (throws on invalid `DATA_PROVIDER`)
- [ ] All DAL function ID parameters validated as UUIDs via Zod
- [ ] DAL functions return typed DTOs with explicit return types
- [ ] No raw entity array exports from DAL — functions only
- [ ] `mock-data.ts` not imported outside `lib/dal/_providers/mock/` and test files
- [ ] `_providers/` convention documented as internal
- [ ] No secrets in committed files (grep check)
- [ ] Security headers in `next.config.ts`

### Phase 2 Readiness (Documented, not implemented)

- [ ] `verifySession()` design documented
- [ ] Data classification matrix (public vs. auth-required vs. owner-check)
- [ ] RLS policy templates for top entities
- [ ] S&S proxy allowlists defined
- [ ] Error response review (no schema leaks)
- [ ] Logging hook stubs in DAL functions

### CI/Automation

- [ ] `npm audit` in CI (fail on critical/high)
- [ ] Grep check enforcing mock-data import boundary
- [ ] Security headers present

---

## 5. Integration with Shaping

The following findings were incorporated into the DAL shaping document (`docs/shaping/dal/shaping.md`):

| Finding                                   | Shaping Integration                       |
| ----------------------------------------- | ----------------------------------------- |
| CRITICAL-03 (fail-open provider)          | Added as requirement R4.5, shape part B9  |
| CRITICAL-04 (`server-only` not installed) | Added as shape part B12                   |
| R-03 (input validation at boundary)       | Added as requirement R4.6, shape part B10 |
| DTO projection                            | Added as requirement R4.7, shape part B11 |
| Error disclosure                          | Added as requirement R4.8                 |
| Security headers                          | Added as shape part B13                   |
| CLAUDE.md rules                           | Added as shape part B14                   |
