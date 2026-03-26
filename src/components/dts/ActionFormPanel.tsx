"use client"

import { useState } from "react"

const B = "#1a90ff"

interface ActionFormPanelProps {
  assessmentId: string
  actionCode: string
  demoToken: string | null
  hoursTypical?: number | null
  onSaved: () => void
  onClose: () => void
}

const PRIORITY_OPTIONS = [
  { value: "alta",  label: "🔴 Alta" },
  { value: "media", label: "🟡 Media" },
  { value: "baja",  label: "🟢 Baja" },
]

export default function ActionFormPanel({
  assessmentId,
  actionCode,
  demoToken,
  hoursTypical,
  onSaved,
  onClose,
}: ActionFormPanelProps) {
  const [owner,    setOwner]    = useState("")
  const [dueDate,  setDueDate]  = useState("")
  const [priority, setPriority] = useState<"alta" | "media" | "baja" | "">("")
  const [notes,    setNotes]    = useState("")
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/dts/roadmap/action-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          actionId: actionCode,
          status:   "done",
          owner:    owner.trim()  || null,
          due_date: dueDate       || null,
          priority: priority      || null,
          notes:    notes.trim()  || null,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      onSaved()
    } catch (err) {
      console.error("[ActionFormPanel]", err)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 md:px-9 py-5 bg-blue-50/60" style={{ borderTop: "1px solid #dde3eb" }}>
      {hoursTypical != null && (
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4 font-[family-name:var(--font-space-mono)]">
          ⏱ Tiempo estimado: {hoursTypical}h
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-[family-name:var(--font-space-mono)]">Responsable</label>
          <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Ej: María García"
            className="w-full text-[15px] text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none"
            style={{ border: `1.5px solid ${B}30`, backgroundColor: "white" }} />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-[family-name:var(--font-space-mono)]">Fecha límite</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full text-[15px] text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none"
            style={{ border: `1.5px solid ${B}30`, backgroundColor: "white" }} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-[family-name:var(--font-space-mono)]">Prioridad</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button key={opt.value}
                onClick={() => setPriority(priority === opt.value ? "" : opt.value as "alta" | "media" | "baja")}
                className="flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all"
                style={{ border: `1.5px solid ${priority === opt.value ? B : "#dde3eb"}`, backgroundColor: priority === opt.value ? `${B}15` : "white", color: priority === opt.value ? B : "#64748b" }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: B }}>
          {saving ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
          Marcar como hecha
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-500 hover:text-slate-700 transition-colors">Cancelar</button>
      </div>
    </div>
  )
}