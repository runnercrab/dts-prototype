import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
  })
}
