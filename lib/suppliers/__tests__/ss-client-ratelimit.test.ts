/**
 * Tests for the distributed Upstash rate limiter inside ssGet().
 *
 * Separated from ss-client.test.ts because @upstash/ratelimit and @upstash/redis
 * must be mocked at module scope — isolating here prevents those mocks from
 * interfering with the per-response circuit breaker tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mock Upstash before importing ss-client ──────────────────────────────────

// vi.hoisted() ensures these refs are initialized before vi.mock hoisting runs.
const { mockLimit } = vi.hoisted(() => ({ mockLimit: vi.fn() }))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn(function () {
      return { limit: mockLimit }
    }),
    {
      slidingWindow: vi.fn().mockReturnValue({ kind: 'sliding-window', tokens: 50, interval: 60 }),
    }
  ),
}))

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function () {
    return {}
  }),
}))

// Import AFTER mocks are registered
const { ssGet, SSRateLimitError, _resetRateLimiter, SS_CACHE_TTL } = await import('../ss-client')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockSuccessFetch(): void {
  vi.spyOn(global, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify([]), {
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ssGet — distributed rate limiter', () => {
  beforeEach(() => {
    process.env.SS_ACCOUNT_NUMBER = 'acct123'
    process.env.SS_API_KEY = 'key456'
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    _resetRateLimiter()
    mockLimit.mockReset()
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    _resetRateLimiter()
    vi.restoreAllMocks()
  })

  it('throws SSRateLimitError when the distributed limiter denies the request', async () => {
    // reset = 60 seconds from now in ms
    mockLimit.mockResolvedValue({ success: false, reset: Date.now() + 60_000 })

    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).rejects.toThrow(SSRateLimitError)
  })

  it('does not make a fetch call when the distributed limiter denies', async () => {
    mockLimit.mockResolvedValue({ success: false, reset: Date.now() + 60_000 })
    const fetchSpy = vi.spyOn(global, 'fetch')

    await ssGet('styles', {}, SS_CACHE_TTL.styles).catch(() => {})

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('calculates retryAfter from the reset timestamp', async () => {
    const resetMs = Date.now() + 30_000 // 30 seconds from now
    mockLimit.mockResolvedValue({ success: false, reset: resetMs })

    const err = await ssGet('styles', {}, SS_CACHE_TTL.styles).catch((e) => e)

    expect(err).toBeInstanceOf(SSRateLimitError)
    // retryAfter should be approximately 30s (ceiling, within 1s tolerance)
    expect((err as SSRateLimitError).retryAfter).toBeGreaterThanOrEqual(29)
    expect((err as SSRateLimitError).retryAfter).toBeLessThanOrEqual(31)
  })

  it('proceeds with the fetch when the distributed limiter allows the request', async () => {
    mockLimit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 })
    mockSuccessFetch()

    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
    expect(mockLimit).toHaveBeenCalledWith('ss-api')
  })

  it('skips the distributed limiter when Upstash env vars are absent', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    _resetRateLimiter()
    mockSuccessFetch()

    // Should proceed without calling limit() at all
    await expect(ssGet('styles', {}, SS_CACHE_TTL.styles)).resolves.toEqual([])
    expect(mockLimit).not.toHaveBeenCalled()
  })
})
