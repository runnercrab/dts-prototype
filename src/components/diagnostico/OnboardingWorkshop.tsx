// src/components/diagnostico/OnboardingWorkshop.tsx
'use client'

import React, { useEffect, useState } from 'react'

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

export default function OnboardingWorkshop({
  onComplete,
  existingAssessmentId,
  existingData,
  pack,
}: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Datos básicos de la organización
  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState('')
  const [numEmployees, setNumEmployees] = useState<number>(10)
  const [role, setRole] = useState('')

  // Pre-Assessment Questions - TM Forum Official
  const [businessAspiration, setBusinessAspiration] = useState('')
  const [digitalTransformationGoals, setDigitalTransformationGoals] = useState('')
  const [brandRepresentation, setBrandRepresentation] = useState('')

  // Culture
  const [culturePrinciples, setCulturePrinciples] = useState('')
  const [cultureChange, setCultureChange] = useState<'yes' | 'no' | ''>('')
  const [workingStyle, setWorkingStyle] = useState('')

  // Data/Technology
  const [legacyBurden, setLegacyBurden] = useState<string>('3')
  const [dataEffectiveness, setDataEffectiveness] = useState('')

  useEffect(() => {
    if (existingData) {
      setIsEditing(true)
      setCompanyName(existingData.companyName || '')
      setSector(existingData.sector || '')
      setNumEmployees(existingData.numEmployees || 10)
      setRole(existingData.role || '')

      setBusinessAspiration(existingData.businessAspiration || '')
      setDigitalTransformationGoals(existingData.digitalTransformationGoals || '')
      setBrandRepresentation(existingData.brandRepresentation || '')

      setCulturePrinciples(existingData.culturePrinciples || '')
      setCultureChange(existingData.cultureChange || '')
      setWorkingStyle(existingData.workingStyle || '')

      setLegacyBurden(existingData.legacyBurden || '3')
      setDataEffectiveness(existingData.dataEffectiveness || '')
    }
  }, [existingData])

  const TOTAL_STEPS = 4
  const progressPct = (step / TOTAL_STEPS) * 100

  const SECTORES = [
    'Telecomunicaciones',
    'Tecnología y Software',
    'Retail y E-commerce',
    'Servicios Profesionales',
    'Manufactura',
    'Salud',
    'Educación',
    'Finanzas y Seguros',
    'Logística y Transporte',
    'Hostelería y Turismo',
    'Medios y Entretenimiento',
    'Energía y Utilities',
    'Otro',
  ]

  const ROLES = [
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
  ]

  const saveOnboarding = async () => {
    if (!existingAssessmentId) {
      alert('Error: falta existingAssessmentId (no debería pasar).')
      return
    }

    setSaving(true)
    try {
      const onboardingData = {
        companyName,
        sector,
        numEmployees,
        role,

        businessAspiration,
        digitalTransformationGoals,
        brandRepresentation,

        culturePrinciples,
        cultureChange,
        workingStyle,

        legacyBurden,
        dataEffectiveness,

        // opcional: te ayuda a depurar
        _meta: {
          pack: pack || null,
          saved_at: new Date().toISOString(),
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
        setSaving(false)
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

  const handleNext = () => {
    // Validaciones por paso
    if (step === 1 && (!companyName || !sector || !role)) {
      alert('Por favor completa todos los campos obligatorios.')
      return
    }
    if (step === 2 && (!businessAspiration || !digitalTransformationGoals || !brandRepresentation)) {
      alert('Por favor responde las 3 preguntas sobre estrategia y cliente.')
      return
    }
    if (step === 3 && (!culturePrinciples || !cultureChange || !workingStyle)) {
      alert('Por favor responde las 3 preguntas sobre cultura organizacional.')
      return
    }
    if (step === 4 && !dataEffectiveness) {
      alert('Por favor responde la pregunta sobre uso efectivo de datos.')
      return
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      saveOnboarding()
    }
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="card">
      <div className="card-body">
        {/* Progreso */}
        <div className="flex items-center gap-3 mb-6">
          <span className="kpi">Paso {step} de {TOTAL_STEPS}</span>
          <div className="flex-1">
            <div className="progress">
              <span style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
              Información Básica de tu Organización
            </h2>
            <p className="text-base" style={{ color: '#475569' }}>
              Datos mínimos para adaptar el diagnóstico.
            </p>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                Nombre de la empresa *
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="Ej: Mi Empresa S.L."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                Sector *
              </label>
              <select
                className="input w-full"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                <option value="">Selecciona un sector</option>
                {SECTORES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                Número de empleados: <strong>{numEmployees}</strong>
              </label>
              <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={numEmployees}
                className="range w-full"
                style={{ ['--sx' as any]: `${((numEmployees - 1) / (500 - 1)) * 100}%` }}
                onChange={(e) => setNumEmployees(+e.target.value)}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: '#64748b' }}>
                <span>1</span>
                <span>250</span>
                <span>500+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                Tu rol en la empresa *
              </label>
              <select
                className="input w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Selecciona tu rol</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                Estrategia, Cliente y Operaciones
              </h2>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Para entender aspiraciones y objetivos
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. ¿Qué te gustaría que lograra el negocio (sin restricciones)? *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                value={businessAspiration}
                onChange={(e) => setBusinessAspiration(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Qué esperas lograr con la Transformación Digital? *
              </label>
              <textarea
                className="input w-full h-32 resize-none"
                value={digitalTransformationGoals}
                onChange={(e) => setDigitalTransformationGoals(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                3. ¿Qué te gustaría que tu marca representara? *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                value={brandRepresentation}
                onChange={(e) => setBrandRepresentation(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                Cultura Organizacional
              </h2>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Cómo trabajáis hoy y hacia dónde queréis moverlo
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. Principios clave de la cultura *
              </label>
              <textarea
                className="input w-full h-32 resize-none"
                value={culturePrinciples}
                onChange={(e) => setCulturePrinciples(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Quieres cambiar la cultura? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cultureChange"
                    checked={cultureChange === 'yes'}
                    onChange={() => setCultureChange('yes')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cultureChange"
                    checked={cultureChange === 'no'}
                    onChange={() => setCultureChange('no')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                3. Estilo de trabajo a promover *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                value={workingStyle}
                onChange={(e) => setWorkingStyle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                Datos y Tecnología
              </h2>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Últimas preguntas
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. Carga de legacy en IT *
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={legacyBurden}
                className="range w-full"
                onChange={(e) => setLegacyBurden(e.target.value)}
              />
              <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
                <span>Muy baja</span><span>Baja</span><span>Media</span><span>Alta</span><span>Muy alta</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Cómo usarías los datos de forma más efectiva? *
              </label>
              <textarea
                className="input w-full h-32 resize-none"
                value={dataEffectiveness}
                onChange={(e) => setDataEffectiveness(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-lg mt-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p className="text-sm" style={{ color: '#1e40af' }}>
                <strong>Listo.</strong> Guardamos el contexto y empezamos el diagnóstico.
              </p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center gap-3 mt-6">
          <button
            className={`btn ${step === 1 ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handlePrev}
            disabled={step === 1 || saving}
          >
            ← Anterior
          </button>

          {isEditing && (
            <button
              className="btn"
              onClick={() => existingAssessmentId && onComplete(existingAssessmentId)}
              disabled={saving}
            >
              Cancelar
            </button>
          )}

          <button
            className="btn btn-primary ml-auto"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? 'Guardando...' : step === TOTAL_STEPS ? (isEditing ? 'Guardar Cambios →' : 'Comenzar Diagnóstico →') : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
