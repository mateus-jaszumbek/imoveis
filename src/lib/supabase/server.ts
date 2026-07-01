import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types'

// Quando rodando dentro do Docker, usa URL interna (http://api:8000) para que o
// servidor Next.js alcance o Supabase pela rede interna Docker em vez de localhost.
const supabaseUrl =
  process.env.SUPABASE_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://placeholder.supabase.co'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
