import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env')
}

// Las passkeys de Supabase son experimentales (beta): hay que activarlas explícitamente.
export const supabase = createClient(url, key, {
  auth: { experimental: { passkey: true } },
})
