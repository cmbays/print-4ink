import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signIn } from '../actions'
import * as supabaseModule from '@shared/lib/supabase/server'
import * as navigationModule from 'next/navigation'

// Mock Supabase and Next.js navigation
vi.mock('@shared/lib/supabase/server')
vi.mock('next/navigation')

describe('signIn server action', () => {
  const mockRedirect = vi.fn()
  const mockSupabaseClient = {
    auth: {
      signInWithPassword: vi.fn(),
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

  describe('valid credentials', () => {
    it('should sign in user and redirect to home', async () => {
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
  })

  describe('invalid credentials', () => {
    it('should return error message for invalid credentials', async () => {
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

    it('should return error for non-existent user', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      })

      const formData = new FormData()
      formData.append('email', 'nonexistent@example.com')
      formData.append('password', 'password123')

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'User not found' })
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('missing fields', () => {
    it('should return error when email is missing', async () => {
      const formData = new FormData()
      formData.append('password', 'password123')

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Email and password are required' })
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return error when password is missing', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Email and password are required' })
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return error when both fields are missing', async () => {
      const formData = new FormData()

      const result = await signIn(formData)

      expect(result).toEqual({ error: 'Email and password are required' })
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })
})
