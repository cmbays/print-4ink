import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as supabaseModule from '@shared/lib/supabase/server'
import * as navigationModule from 'next/navigation'

// Mock dependencies
vi.mock('@shared/lib/supabase/server')
vi.mock('next/navigation')

describe('Auth Server Actions', () => {
  const mockRedirect = vi.fn()
  const mockSupabaseAuth = {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  }

  const mockSupabaseClient = {
    auth: mockSupabaseAuth,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(navigationModule.redirect).mockImplementation(mockRedirect)
    vi.mocked(supabaseModule.createClient).mockResolvedValue(mockSupabaseClient)
  })

  describe('signIn action', () => {
    it('signs in user with valid email and password', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const { signIn } = await import('../../../app/(auth)/login/actions')
      const formData = new FormData()
      formData.append('email', 'user@example.com')
      formData.append('password', 'secure-password')

      await signIn(formData)

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secure-password',
      })
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('returns error message on auth failure', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      const { signIn } = await import('../../../app/(auth)/login/actions')
      const formData = new FormData()
      formData.append('email', 'user@example.com')
      formData.append('password', 'wrong-password')

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Invalid login credentials' })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('returns error when email or password missing', async () => {
      const { signIn } = await import('../../../app/(auth)/login/actions')
      const formData = new FormData()

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Email and password are required' })
      expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('signOut action', () => {
    it('signs out user and redirects to login', async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null })

      const { signOut } = await import('../../../shared/actions/auth')

      await signOut()

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })
  })
})
