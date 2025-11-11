import { createClient } from '@supabase/supabase-js'

// Debug: Log las variables
console.log('🔍 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('🔍 SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de Supabase!')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})
