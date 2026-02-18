import { NextResponse } from 'next/server'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'

export async function GET() {
  try {
    const data = await ssGet('brands', {}, SS_CACHE_TTL.brands)
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
