// src/components/diagnostico/OnboardingWorkshop.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'

interface Props {
  onComplete: (assessmentId: string) => void
  existingAssessmentId?: string
  existingData?: any
  pack?: string
}

async function safeReadJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function isNonEmpty(v: any) {
  return typeof v === 'string' && v.trim().length > 0
}

export default function OnboardingWorkshop({
  onComplete,
  existingAssessmentId,
  existingData,
  pack,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // ✅ Campos mínimos “motor-ready”
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('')
  const [country, setCountry] = useState('')

  // (opcionales)
  const [role, setRole] = useState('')

  useEffect(() => {
    if (!existingData) return

    // Soporta tanto nombres antiguos como nuevos:
    // - antiguos: companyName, sector, numEmployees
    // - nuevos: name, industry, size, country
    setIsEditing(true)

    setOrgName(existingData.name || existingData.companyName || '')
    setIndustry(existingData.industry || existingData.sector || '')
    setSize(existingData.size || '')
    setCountry(existingData.country || '')

    setRole(existingData.role || '')
  }, [existingData])

  const INDUSTRIES = useMemo(
    () => [
      'Tecnología y Software',
      'Retail y E-commerce',
      'Servicios Profesionales',
      'Manufactura',
      'Salud',
      'Educación',
      'Finanzas y Seguros',
      'Logística y Transporte',
      'Hostelería y Turismo',
      'Energía y Utilities',
      'Construcción e Inmobiliario',
      'Otro',
    ],
    []
  )

  const SIZES = useMemo(
    () => [
      { value: '1-10', label: '1–10 empleados' },
      { value: '11-50', label: '11–50 empleados' },
      { value: '51-200', label: '51–200 empleados' },
      { value: '201-500', label: '201–500 empleados' },
      { value: '500+', label: '500+ empleados' },
    ],
    []
  )

  const ROLES = useMemo(
    () => [
      'CEO / Fundador',
      'Director General',
      'CTO / CIO / Director Tecnología',
      'CDO / Chief Digital Officer',
      'Director Operaciones',
      'Director Marketing',
      'Director Comercial',
      'Gerente / Manager',
      'Consultor Externo',
      'Otro',
    ],
    []
  )

  const canSubmit =
    isNonEmpty(orgName) && isNonEmpty(industry) && isNonEmpty(size) && isNonEmpty(country)

  const saveOnboarding = async () => {
    if (!existingAssessmentId) {
      alert('Error: falta assessmentId (no debería pasar).')
      return
    }

    if (!canSubmit) {
      alert('Completa los campos obligatorios: nombre, sector, tamaño y país/región.')
      return
    }

    setSaving(true)
    try {
      // ✅ Esto es lo que el motor usará después
      const onboardingData = {
        name: orgName.trim(),
        industry: industry.trim(),
        size: size.trim(),
        country: country.trim(),

        // opcional
        role: role.trim() || null,

        // trazabilidad ligera
        _meta: {
          pack: pack || null,
          saved_at: new Date().toISOString(),
          version: 'onboarding_v1_min',
        },
      }

      const res = await fetch('/api/dts/assessment/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          assessmentId: existingAssessmentId,
          onboardingData,
        }),
      })

      const json = await safeReadJson(res)

      if (!res.ok || !json?.ok) {
        console.error('❌ onboarding POST failed', { status: res.status, json })
        alert(json?.error || 'Error guardando onboarding')
        return
      }

      onComplete(existingAssessmentId)
    } catch (err) {
      console.error('❌ Error inesperado onboarding:', err)
      alert('Error inesperado guardando onboarding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empecemos</h1>
          <p className="mt-1 text-sm text-gray-600">
            60 segundos. Esto permite adaptar impacto/esfuerzo y el roadmap.
          </p>
        </div>
        {pack ? (
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 border">
            Pack: <span className="font-mono">{pack}</span>
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de la organización *
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Ej: Talleres López S.L."
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Sector (industry) *
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Selecciona…</option>
            {INDUSTRIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tamaño (size) *
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option value="">Selecciona…</option>
            {SIZES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            País / región *
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Ej: España"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tu rol (opcional)
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">(Opcional) Selecciona…</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {isEditing ? (
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => existingAssessmentId && onComplete(existingAssessmentId)}
            disabled={saving}
          >
            Cancelar
          </button>
        ) : null}

        <button
          className={`ml-auto px-5 py-2 rounded-lg text-white font-medium ${
            canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={saveOnboarding}
          disabled={!canSubmit || saving}
        >
          {saving ? 'Guardando…' : 'Continuar →'}
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        * Obligatorio porque alimenta el cálculo posterior (impacto/esfuerzo/roadmap).
      </div>
    </div>
  )
}
