import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as supabaseModule from '@shared/lib/supabase/server'
import * as navigationModule from 'next/navigation'

// Mock Supabase and Next.js navigation
vi.mock('@shared/lib/supabase/server')
vi.mock('next/navigation')

describe('Auth Server Actions', () => {
  const mockRedirect = vi.fn()
  const mockSupabaseClient = {
    auth: {
      signInWithPassword: vi.fn(),
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

  describe('signIn action', () => {
    it('should sign in user with valid credentials', async () => {
      const { signIn } = await import('src/app/(auth)/login/actions')

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      await signIn(formData)

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should return error for invalid credentials', async () => {
      const { signIn } = await import('src/app/(auth)/login/actions')

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrongpassword')

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Invalid login credentials' })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return error when fields are missing', async () => {
      const { signIn } = await import('src/app/(auth)/login/actions')

      const formData = new FormData()

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Email and password are required' })
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('signOut action', () => {
    it('should sign out user and redirect to login', async () => {
      const { signOut } = await import('src/shared/actions/auth')

      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })

    it('should redirect even if sign out fails', async () => {
      const { signOut } = await import('src/shared/actions/auth')

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      await signOut()

      expect(mockRedirect).toHaveBeenCalledWith('/login')
    })
  })
})
