import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'

/**
 * styleId is required — prevents pulling the entire S&S product catalog
 * in a single request, which would exhaust the 60 req/min rate limit.
 */
const querySchema = z.object({
  styleId: z.string().min(1).max(500),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  try {
    const data = await ssGet('products', { styleId: parsed.data.styleId }, SS_CACHE_TTL.products)
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
