import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signOut } from '../auth'
import * as supabaseModule from '@shared/lib/supabase/server'
import * as navigationModule from 'next/navigation'

// Mock Supabase and Next.js navigation
vi.mock('@shared/lib/supabase/server')
vi.mock('next/navigation')

describe('signOut server action', () => {
  const mockRedirect = vi.fn()
  const mockSupabaseClient = {
    auth: {
      signOut: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(navigationModule.redirect).mockImplementation(mockRedirect)
    vi.mocked(supabaseModule.createClient).mockImplementation(() => mockSupabaseClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should sign out user and redirect to login page', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

    await signOut()

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('should redirect to login even if sign out errors', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: { message: 'Sign out failed' },
    })

    await signOut()

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('should create supabase client from server', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

    await signOut()

    expect(supabaseModule.createClient).toHaveBeenCalled()
  })
})
