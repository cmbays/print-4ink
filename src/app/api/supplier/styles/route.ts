import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ssGet, SSClientError, SSRateLimitError, SS_CACHE_TTL } from '@lib/suppliers/ss-client'

const querySchema = z.object({
  brand: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  searchTerm: z.string().max(200).optional(),
})

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const params: Record<string, string> = {}
  if (parsed.data.brand) params.brand = parsed.data.brand
  if (parsed.data.category) params.category = parsed.data.category
  if (parsed.data.searchTerm) params.searchTerm = parsed.data.searchTerm

  try {
    const data = await ssGet('styles', params, SS_CACHE_TTL.styles)
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
