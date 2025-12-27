import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // <- CLAVE: fuerza Node, no Edge

export async function GET() {
  const env = process.env

  return NextResponse.json({
    nodeEnv: env.NODE_ENV || null,

    // Huellas Vercel (para saber QUÉ deployment es)
    vercelEnv: env.VERCEL_ENV || null,            // production / preview / development
    vercelUrl: env.VERCEL_URL || null,            // dominio interno del deployment
    vercelGitSha: env.VERCEL_GIT_COMMIT_SHA || null,
    vercelDeploymentId: env.VERCEL_DEPLOYMENT_ID || null,

    // Lo que nos importa
    hasNextPublicUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
    hasNextPublicAnon: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasSupabaseUrl: Boolean(env.SUPABASE_URL),
    hasServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),

    // Para detectar MISMATCHES de nombres
    seenKeysHint: {
      hasSupabaseServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseServiceRoleKeyAlt: Boolean((env as any).SUPABASE_SERVICE_ROLE), // por si alguien lo puso mal
      hasSupabaseServiceRoleKeyAlt2: Boolean((env as any).SUPABASE_SERVICE_ROLE_KEY_),
    },
  })
}
