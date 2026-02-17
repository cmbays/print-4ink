export type Result<T, E extends string = string> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E extends string>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function isOk<T, E extends string>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true
}

export function isErr<T, E extends string>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return result.ok === false
}
