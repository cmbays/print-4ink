import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Transaction mode (prepare: false) — required for Supabase connection pooler
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle(client)
