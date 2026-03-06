"use client"

import { useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

const B = "#1a90ff"

interface ActionFormPanelProps {
  supabase: SupabaseClient
  assessmentId: string
  actionCode: string
  demoToken: string | null
  onSaved: () => void
  onClose: () => void
}

export default function ActionFormPanel({
  supabase,
  assessmentId,
  actionCode,
  demoToken,
  onSaved,
  onClose,
}: ActionFormPanelProps) {
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!notes.trim()) {
      onSaved()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from("dts_action_notes")
        .upsert({
          assessment_id: assessmentId,
          action_code: actionCode,
          notes: notes.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "assessment_id,action_code" })

      if (dbError) throw dbError
      onSaved()
    } catch (err) {
      console.error("[ActionFormPanel] Error guardando:", err)
      // Si la tabla no existe, marcamos como hecho igualmente
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 md:px-9 py-5 bg-blue-50/60" style={{ borderTop: "1px solid #dde3eb" }}>
      <div className="mb-3">
        <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-[family-name:var(--font-space-mono)]">
          ¿Cómo te ha ido? (opcional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe lo que has hecho, lo que te ha costado, o lo que has aprendido..."
          className="w-full text-[15px] text-slate-700 leading-relaxed rounded-xl px-4 py-3 resize-none focus:outline-none"
          style={{
            border: `1.5px solid ${B}30`,
            backgroundColor: "white",
            minHeight: "80px",
          }}
          rows={3}
        />
        {error && (
          <p className="text-[13px] text-red-500 mt-1">{error}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: B }}
        >
          {saving ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          Marcar como hecha
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}