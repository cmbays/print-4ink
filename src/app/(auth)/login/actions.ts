'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@shared/lib/supabase/server'

function normalizeAuthError(errorMessage: string): string {
  // Map known Supabase auth errors to user-friendly messages
  if (
    errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('Invalid email or password')
  ) {
    return 'Invalid email or password'
  }

  if (errorMessage.includes('Email not confirmed')) {
    return 'Please confirm your email address before logging in'
  }

  if (errorMessage.includes('User not found')) {
    return 'Invalid email or password'
  }

  // Generic message for all other errors to prevent information leakage
  return 'An unexpected error occurred. Please try again.'
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: normalizeAuthError(error.message) }
  }

  redirect('/')
}
