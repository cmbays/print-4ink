import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr } from '@infra/repositories/_shared/result'
import type { Result } from '@infra/repositories/_shared/result'

describe('ok()', () => {
  it('creates a success result', () => {
    const result = ok(42)
    expect(result).toEqual({ ok: true, value: 42 })
  })

  it('works with string values', () => {
    const result = ok('hello')
    expect(result).toEqual({ ok: true, value: 'hello' })
  })

  it('works with object values', () => {
    const obj = { id: '1', name: 'test' }
    const result = ok(obj)
    expect(result).toEqual({ ok: true, value: obj })
  })

  it('works with null', () => {
    const result = ok(null)
    expect(result).toEqual({ ok: true, value: null })
  })
})

describe('err()', () => {
  it('creates a failure result', () => {
    const result = err('NOT_FOUND')
    expect(result).toEqual({ ok: false, error: 'NOT_FOUND' })
  })

  it('works with any error string', () => {
    const result = err('VALIDATION')
    expect(result).toEqual({ ok: false, error: 'VALIDATION' })
  })
})

describe('isOk()', () => {
  it('returns true for ok results', () => {
    const result: Result<number> = ok(42)
    expect(isOk(result)).toBe(true)
  })

  it('returns false for err results', () => {
    const result: Result<number> = err('fail')
    expect(isOk(result)).toBe(false)
  })

  it('narrows the type to access value', () => {
    const result: Result<number> = ok(42)
    if (isOk(result)) {
      expect(result.value).toBe(42)
    }
  })
})

describe('isErr()', () => {
  it('returns true for err results', () => {
    const result: Result<number> = err('fail')
    expect(isErr(result)).toBe(true)
  })

  it('returns false for ok results', () => {
    const result: Result<number> = ok(42)
    expect(isErr(result)).toBe(false)
  })

  it('narrows the type to access error', () => {
    const result: Result<number> = err('NOT_FOUND')
    if (isErr(result)) {
      expect(result.error).toBe('NOT_FOUND')
    }
  })
})
