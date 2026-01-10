// src/lib/routes.ts
export function resultsUrl(assessmentId: string) {
  return `/resultados/${assessmentId}`
}

export function diagnosticoUrl(assessmentId: string) {
  return `/diagnostico-full?assessmentId=${encodeURIComponent(assessmentId)}`
}

export function diagnosticoStartUrl(opts?: { pack?: string; demo?: boolean }) {
  const pack = opts?.pack
  const demo = opts?.demo

  const sp = new URLSearchParams()
  if (pack) sp.set('pack', pack)
  if (demo) sp.set('demo', 'true')

  const qs = sp.toString()
  return qs ? `/diagnostico-full?${qs}` : '/diagnostico-full'
}
