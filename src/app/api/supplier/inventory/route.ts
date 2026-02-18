import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'

/**
 * skuIds: comma-separated list of S&S SKU IDs.
 * Max length guards against request-size abuse; individual IDs typically
 * look like "3001C-S-Black" (style-size-color), roughly 20 chars each.
 */
const querySchema = z.object({
  skuIds: z.string().min(1).max(2000),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  try {
    const data = await ssGet('inventory', { skuids: parsed.data.skuIds }, SS_CACHE_TTL.inventory)
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof SSRateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please retry later.' },
        { status: 429, headers: { 'Retry-After': String(err.retryAfter) } }
      )
    }
    if (err instanceof SSClientError) {
      return NextResponse.json({ error: 'Supplier API unavailable' }, { status: err.status })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
