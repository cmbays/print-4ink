import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryCacheStore } from '../cache/in-memory';

describe('InMemoryCacheStore', () => {
  let cache: InMemoryCacheStore;

  beforeEach(() => {
    cache = new InMemoryCacheStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for missing key', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('stores and retrieves a value', async () => {
    await cache.set('key', { data: 42 }, 60);
    expect(await cache.get('key')).toEqual({ data: 42 });
  });

  it('returns null after TTL expires', async () => {
    vi.useFakeTimers();
    await cache.set('key', 'value', 1); // 1 second TTL
    vi.advanceTimersByTime(1001);
    expect(await cache.get<string>('key')).toBeNull();
  });

  it('returns value before TTL expires', async () => {
    vi.useFakeTimers();
    await cache.set('key', 'value', 10);
    vi.advanceTimersByTime(9000);
    expect(await cache.get<string>('key')).toBe('value');
  });

  it('returns null at exact TTL boundary', async () => {
    vi.useFakeTimers();
    await cache.set('key', 'value', 1); // 1 second TTL
    vi.advanceTimersByTime(1000);       // exactly at expiry
    expect(await cache.get<string>('key')).toBeNull();
  });

  it('returns null immediately for ttlSeconds=0', async () => {
    await cache.set('key', 'value', 0);
    expect(await cache.get<string>('key')).toBeNull();
  });

  it('del removes a stored key', async () => {
    await cache.set('key', 'value', 60);
    await cache.del('key');
    expect(await cache.get('key')).toBeNull();
  });

  it('del on missing key does not throw', async () => {
    await expect(cache.del('nonexistent')).resolves.toBeUndefined();
  });

  it('overwrites existing key', async () => {
    await cache.set('key', 'first', 60);
    await cache.set('key', 'second', 60);
    expect(await cache.get<string>('key')).toBe('second');
  });

  it('stores different types', async () => {
    await cache.set('num', 99, 60);
    await cache.set('arr', [1, 2, 3], 60);
    await cache.set('obj', { x: true }, 60);
    expect(await cache.get<number>('num')).toBe(99);
    expect(await cache.get<number[]>('arr')).toEqual([1, 2, 3]);
    expect(await cache.get<object>('obj')).toEqual({ x: true });
  });
});
