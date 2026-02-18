/**
 * Domain-scoped minimal logger.
 *
 * Lives in domain/lib/ because domain/ cannot import from shared/.
 * Uses console.warn/error directly — this file IS the logging abstraction,
 * not a consumer of it. Phase 2: replace with a proper port/adapter.
 *
 * No framework deps — safe for the innermost ring.
 */

const isDev = process.env.NODE_ENV !== 'production'

export const domainLogger = {
  warn(message: string, context: Record<string, unknown> = {}): void {
    if (isDev) {
      console.warn('[domain:warn]', message, context)
    } else {
      console.warn(JSON.stringify({ level: 'warn', domain: 'pricing', message, ...context }))
    }
  },
}
