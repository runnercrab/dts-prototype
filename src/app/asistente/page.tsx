'use client'
import Link from 'next/link'
import AssistantChat from '../../components/AssistantChat'

export default function AsistentePage() {
  return (
    <main className="container-page">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dts-chat" className="pill">Diagnóstico</Link>
        <span className="pill pill-active">Asistente</span>
        <span className="ml-auto kpi">Conversación</span>
      </div>
      <h1 className="mb-2">Asistente</h1>
      <p className="mb-6">Haz preguntas sobre tu madurez digital, priorización, roadmap, etc.</p>
      <AssistantChat />
    </main>
  )
}
