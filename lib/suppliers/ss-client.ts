/**
 * S&S Activewear HTTP client — server-side only.
 *
 * Handles: Basic Auth construction, rate-limit circuit breaking,
 * sensitive pricing field stripping, and error sanitization.
 *
 * Security contract:
 *   - `segment` is typed to AllowedSegment — no SSRF via free-form URL construction.
 *   - `customerPrice` and `mapPrice` are stripped recursively from all responses.
 *   - Raw S&S error messages are never forwarded to the client.
 *   - Throws SSRateLimitError when X-Rate-Limit-Remaining < RATE_LIMIT_BUFFER.
 *
 * @module lib/suppliers/ss-client
 */
import { logger } from '@shared/lib/logger'

const ssLogger = logger.child({ domain: 'ss-client' })

// ─── Constants ────────────────────────────────────────────────────────────────

const SS_BASE_URL = 'https://api.ssactivewear.com/v2'

/**
 * Stop proxying when this many requests remain in the rate-limit window.
 * S&S allows 60 req/min. Reserving 5 provides a safety buffer for retries.
 */
const RATE_LIMIT_BUFFER = 5

/**
 * Pricing fields that are commercially sensitive and must never
 * leave the server. customerPrice is account-specific negotiated pricing;
 * mapPrice is minimum advertised price data S&S expects to stay internal.
 */
const STRIP_FIELDS = new Set(['customerPrice', 'mapPrice'])

// ─── Allowed segments ─────────────────────────────────────────────────────────

/**
 * Whitelisted S&S API path segments. Using a typed union here means any Route
 * Handler that mistakenly constructs a segment at runtime gets a compile error —
 * TypeScript enforces the whitelist at the call site.
 */
const ALLOWED_SEGMENTS = ['styles', 'products', 'categories', 'inventory', 'brands'] as const
export type SSSegment = (typeof ALLOWED_SEGMENTS)[number]

/** Cache TTLs (seconds) for Next.js fetch() revalidation. */
export const SS_CACHE_TTL = {
  styles: 86400, // 24h — catalog data changes rarely
  products: 3600, // 1h  — price/color updates possible
  categories: 604800, // 7d  — reference data
  inventory: 300, // 5m  — stock levels are volatile
  brands: 604800, // 7d  — reference data
} as const satisfies Record<SSSegment, number>

// ─── Error types ──────────────────────────────────────────────────────────────

export class SSClientError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'SSClientError'
  }
}

export class SSRateLimitError extends SSClientError {
  /** Seconds the caller should wait before retrying. */
  constructor(public readonly retryAfter = 60) {
    super(429, 'S&S API rate limit nearly exhausted')
    this.name = 'SSRateLimitError'
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getAuthHeader(): string {
  const account = process.env.SS_ACCOUNT_NUMBER
  const key = process.env.SS_API_KEY
  if (!account || !key) {
    throw new SSClientError(500, 'S&S API credentials not configured')
  }
  return `Basic ${Buffer.from(`${account}:${key}`).toString('base64')}`
}

/**
 * Recursively strip sensitive pricing fields from any depth of nested
 * objects and arrays. S&S product data nests pricing inside color/size
 * objects, so a shallow strip on the top-level response is insufficient.
 */
export function stripSensitiveFields(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(stripSensitiveFields)
  }
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>)
        .filter(([key]) => !STRIP_FIELDS.has(key))
        .map(([key, value]) => [key, stripSensitiveFields(value)])
    )
  }
  return data
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Perform a GET request against a whitelisted S&S API segment.
 *
 * @param segment  - One of the five allowed S&S path segments.
 * @param params   - Query parameters to forward (pre-validated by caller).
 * @param ttl      - next.revalidate TTL in seconds; use SS_CACHE_TTL constants.
 *
 * @throws {SSClientError}     On auth misconfiguration (500), unreachable API (502),
 *                             or S&S error responses.
 * @throws {SSRateLimitError}  When X-Rate-Limit-Remaining drops below the safety buffer.
 */
export async function ssGet(
  segment: SSSegment,
  params: Record<string, string>,
  ttl: number
): Promise<unknown> {
  // Build auth header BEFORE the try block. getAuthHeader() throws SSClientError(500)
  // on missing credentials. If it were inside the try, that error would be caught and
  // re-thrown as SSClientError(502), masking the real config problem.
  const authHeader = getAuthHeader()

  const url = new URL(`${SS_BASE_URL}/${segment}/`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      next: { revalidate: ttl },
    })
  } catch {
    ssLogger.error('S&S API unreachable', { segment })
    throw new SSClientError(502, 'Supplier API unreachable')
  }

  // Circuit breaker — check remaining quota on every response.
  // With serverless (no shared state), this is per-request: if the
  // current response signals < RATE_LIMIT_BUFFER remaining, we return
  // 429 immediately so the client backs off before the window exhausts.
  const remaining = parseInt(response.headers.get('X-Rate-Limit-Remaining') ?? '999', 10)
  if (!isNaN(remaining) && remaining < RATE_LIMIT_BUFFER) {
    ssLogger.warn('Rate limit buffer reached', { segment, remaining })
    throw new SSRateLimitError()
  }

  if (!response.ok) {
    // Map 5xx → 502 Bad Gateway (our problem, not client's fault).
    // Never forward the raw S&S body — may contain account info.
    const status = response.status >= 500 ? 502 : response.status
    ssLogger.error('S&S API error response', { segment, status: response.status })
    throw new SSClientError(status, 'Supplier API error')
  }

  const data: unknown = await response.json()
  return stripSensitiveFields(data)
}
