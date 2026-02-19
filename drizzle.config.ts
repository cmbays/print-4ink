import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/*',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
