import { createClient } from '@supabase/supabase-js'

// ⚠️ CONFIGURACIÓN DEFINITIVA PARA VERCEL
// Las variables de entorno de Vercel no funcionan correctamente con NEXT_PUBLIC_*
// Por eso usamos valores hardcoded directamente

// URL y ANON KEY de Supabase (estos valores SON SEGUROS de exponer en el cliente)
// La seguridad real está en Row Level Security (RLS) de Supabase
const SUPABASE_URL = 'https://fgczfshqldxkyowbyuzq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY3pmc2hxbGR4a3lvd2J5dXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTU1MzMsImV4cCI6MjA3NzU5MTUzM30.nCxVjHv5A8vQawfpUK-SWFbUCTHiHghcYfZfgH7GTFs'

// ❌ NO USAR process.env en producción - Vercel no lo lee bien
// Solo para desarrollo local si tienes .env.local
let supabaseUrl = SUPABASE_URL
let supabaseKey = SUPABASE_ANON_KEY

// En desarrollo local, intentar usar variables de entorno si existen
if (process.env.NODE_ENV === 'development') {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
}

// Log para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase config:', {
    url: supabaseUrl,
    keyLength: supabaseKey.length,
    usingEnvVars: supabaseUrl !== SUPABASE_URL
  })
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'dts-prototype'
    }
  }
})

// Función helper para verificar la conexión
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('dts_dmm_versions')
      .select('version_code')
      .limit(1)
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error)
      return { success: false, error }
    }
    
    console.log('✅ Conexión a Supabase exitosa')
    return { success: true, data }
  } catch (err) {
    console.error('❌ Error de red:', err)
    return { success: false, error: err }
  }
}

export default supabase
