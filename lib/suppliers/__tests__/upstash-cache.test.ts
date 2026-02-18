/**
 * Tests for UpstashCacheStore.
 *
 * The Upstash Redis client is mocked so tests run without real credentials.
 * We verify that UpstashCacheStore:
 *   - delegates get/set/del to the Redis client with correct arguments
 *   - handles Redis errors gracefully (cache-miss on GET, silent on SET/DEL)
 *   - passes TTL via the `ex` option on SET
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpstashCacheStore } from '../cache/upstash'

// vi.hoisted() ensures these refs exist before vi.mock hoisting runs.
// Regular function (not arrow) is required — arrow fns can't be used with `new`
// via Reflect.construct, which is how vi.fn() calls implementations as constructors.
const { mockGet, mockSet, mockDel } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
}))

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function () {
    return { get: mockGet, set: mockSet, del: mockDel }
  }),
}))

describe('UpstashCacheStore', () => {
  let store: UpstashCacheStore

  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    store = new UpstashCacheStore()
    mockGet.mockReset()
    mockSet.mockReset()
    mockDel.mockReset()
  })

  // ─── get ────────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('returns the cached value when Redis has the key', async () => {
      const data = { brand: 'Gildan', count: 42 }
      mockGet.mockResolvedValue(data)

      const result = await store.get<typeof data>('ss:brands')

      expect(result).toEqual(data)
      expect(mockGet).toHaveBeenCalledWith('ss:brands')
    })

    it('returns null when Redis returns null', async () => {
      mockGet.mockResolvedValue(null)
      expect(await store.get('ss:brands')).toBeNull()
    })

    it('returns null when Redis returns undefined', async () => {
      mockGet.mockResolvedValue(undefined)
      expect(await store.get('ss:brands')).toBeNull()
    })

    it('returns null and does not throw when Redis throws', async () => {
      mockGet.mockRejectedValue(new Error('Redis connection refused'))
      await expect(store.get('ss:brands')).resolves.toBeNull()
    })
  })

  // ─── set ────────────────────────────────────────────────────────────────────

  describe('set()', () => {
    it('calls Redis SET with key, value, and ex option', async () => {
      mockSet.mockResolvedValue('OK')
      const value = ['Gildan', 'Hanes', 'BELLA + CANVAS']

      await store.set('ss:brands', value, 604800)

      expect(mockSet).toHaveBeenCalledWith('ss:brands', value, { ex: 604800 })
    })

    it('does not throw when Redis SET fails', async () => {
      mockSet.mockRejectedValue(new Error('Redis timeout'))
      await expect(store.set('ss:brands', ['Gildan'], 3600)).resolves.toBeUndefined()
    })

    it('passes the correct TTL for each cache tier', async () => {
      mockSet.mockResolvedValue('OK')

      await store.set('ss:style:1234', {}, 3600) // products: 1h
      expect(mockSet).toHaveBeenCalledWith('ss:style:1234', {}, { ex: 3600 })

      await store.set('ss:catalog:Gildan:', [], 86400) // styles: 24h
      expect(mockSet).toHaveBeenCalledWith('ss:catalog:Gildan:', [], { ex: 86400 })

      await store.set('ss:inventory', {}, 300) // inventory: 5m
      expect(mockSet).toHaveBeenCalledWith('ss:inventory', {}, { ex: 300 })
    })
  })

  // ─── del ────────────────────────────────────────────────────────────────────

  describe('del()', () => {
    it('calls Redis DEL with the key', async () => {
      mockDel.mockResolvedValue(1)
      await store.del('ss:brands')
      expect(mockDel).toHaveBeenCalledWith('ss:brands')
    })

    it('does not throw when Redis DEL fails', async () => {
      mockDel.mockRejectedValue(new Error('Redis timeout'))
      await expect(store.del('ss:brands')).resolves.toBeUndefined()
    })
  })
})
