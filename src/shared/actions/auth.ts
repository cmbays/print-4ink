'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@shared/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()

  // Attempt to sign out from Supabase
  // We intentionally ignore errors because the important part is redirecting to login
  // This ensures the local session is always invalidated, even if Supabase fails
  // TODO: Add monitoring/logging for failed signOut attempts (issue #538)
  await supabase.auth.signOut()

  redirect('/login')
}
