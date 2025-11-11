'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// Tipos
interface OnboardingData {
  // Paso 2
  mainPurpose: string
  digitalAmbition: string[]
  
  // Paso 3
  companyName: string
  sector: string
  numEmployees: number
  role: string
  
  // Paso 4
  evaluationScope: string
  specificArea?: string
  
  // Paso 5
  analysisLevel: string
  
  // Paso 6
  agreedToStart: boolean
}

interface Props {
  onComplete: (assessmentId: string) => void
}

export default function OnboardingWorkshop({ onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  
  // Estado del formulario
  const [mainPurpose, setMainPurpose] = useState('')
  const [digitalAmbition, setDigitalAmbition] = useState<string[]>([])
  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState('')
  const [numEmployees, setNumEmployees] = useState<number>(10)
  const [role, setRole] = useState('')
  const [evaluationScope, setEvaluationScope] = useState('')
  const [specificArea, setSpecificArea] = useState('')
  const [analysisLevel] = useState('full')
  const [agreedToStart, setAgreedToStart] = useState(false)

  const TOTAL_STEPS = 6
  const progressPct = (step / TOTAL_STEPS) * 100

  // Opciones
  const SECTORES = [
    'Tecnología y Software',
    'Retail y E-commerce',
    'Servicios Profesionales',
    'Manufactura',
    'Salud',
    'Educación',
    'Finanzas y Seguros',
    'Logística y Transporte',
    'Hostelería y Turismo',
    'Otro'
  ]

  const ROLES = [
    'CEO / Fundador',
    'Director General',
    'CTO / Director Tecnología',
    'Director Operaciones',
    'Director Marketing',
    'Gerente / Manager',
    'Consultor Externo',
    'Otro'
  ]

  const AMBICIONES = [
    'Mejorar experiencia del cliente',
    'Aumentar eficiencia operativa',
    'Reducir costos',
    'Incrementar ventas online',
    'Tomar decisiones basadas en datos',
    'Mejorar competitividad',
    'Innovar en productos/servicios',
    'Atraer y retener talento digital'
  ]

  const SCOPES = [
    { value: 'full-organization', label: 'Toda la organización' },
    { value: 'functional-area', label: 'Un área funcional específica' },
    { value: 'business-unit', label: 'Una unidad de negocio' },
    { value: 'pilot-project', label: 'Proyecto piloto' }
  ]

  // Handlers
  const toggleAmbition = (amb: string) => {
    setDigitalAmbition(prev =>
      prev.includes(amb) ? prev.filter(a => a !== amb) : [...prev, amb]
    )
  }

  const saveAssessment = async () => {
    setSaving(true)
    try {
      const onboardingData: OnboardingData = {
        mainPurpose,
        digitalAmbition,
        companyName,
        sector,
        numEmployees,
        role,
        evaluationScope,
        specificArea: specificArea || undefined,
        analysisLevel,
        agreedToStart
      }

      console.log('💾 Guardando assessment en Supabase...')

      const { data, error } = await supabase
        .from('dts_assessments')
        .insert({
          dmm_version_id: '4e95ce5c-adfc-4095-82a7-715953b46906', // ID correcto
          assessment_type: 'full',
          status: 'in-progress',
          phase_0_completed: true,
          onboarding_data: onboardingData,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('❌ Error guardando assessment:', error)
        alert('Error al guardar el assessment. Por favor, intenta de nuevo.')
        setSaving(false)
        return
      }

      if (!data || !data.id) {
        console.error('❌ No se recibió ID del assessment:', data)
        alert('Error: No se pudo obtener el ID del assessment.')
        setSaving(false)
        return
      }

      const assessmentId = data.id as string
      console.log('✅ Assessment guardado con ID:', assessmentId)
      
      // Llamar a onComplete con el ID como string
      onComplete(assessmentId)
    } catch (err) {
      console.error('❌ Error inesperado:', err)
      alert('Error inesperado. Por favor, intenta de nuevo.')
      setSaving(false)
    }
  }

  const handleNext = () => {
    // Validaciones por paso
    if (step === 2 && (!mainPurpose || digitalAmbition.length === 0)) {
      alert('Por favor completa el propósito y selecciona al menos una ambición.')
      return
    }
    if (step === 3 && (!companyName || !sector || !role)) {
      alert('Por favor completa todos los campos obligatorios.')
      return
    }
    if (step === 4 && !evaluationScope) {
      alert('Por favor selecciona el alcance de la evaluación.')
      return
    }
    if (step === 6 && !agreedToStart) {
      alert('Por favor acepta las condiciones para continuar.')
      return
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      // Guardar assessment y continuar
      saveAssessment()
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

        {/* Contenido por paso */}
        
        {/* PASO 1: Bienvenida */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
              ¡Bienvenido al Diagnóstico Digital FULL!
            </h2>
            <p className="text-base" style={{ color: '#475569' }}>
              Este diagnóstico evalúa la madurez digital de tu empresa usando el modelo oficial 
              <strong> TM Forum Digital Maturity Model v5.1</strong>.
            </p>
            <div className="p-4 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p className="text-sm mb-2" style={{ color: '#1e40af' }}>
                <strong>¿Qué vas a hacer?</strong>
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: '#475569' }}>
                <li>Responder 40 preguntas clave (TIER 1) de forma manual</li>
                <li>La IA inferirá 89 preguntas adicionales (TIER 2) basándose en tus respuestas</li>
                <li>Tiempo estimado: 25-35 minutos</li>
                <li>Obtendrás un roadmap personalizado de transformación digital</li>
              </ul>
            </div>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Antes de empezar, vamos a conocer un poco sobre tu empresa y tus objetivos.
            </p>
          </div>
        )}

        {/* PASO 2: Propósito y Ambición */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
              Propósito y Ambición Digital
            </h2>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. ¿Cuál es el principal motivo para hacer este diagnóstico? *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Ej: Queremos identificar oportunidades de mejora para ser más competitivos..."
                value={mainPurpose}
                onChange={(e) => setMainPurpose(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Qué ambiciones digitales tiene tu empresa? (selecciona todas las que apliquen) *
              </label>
              <div className="grid md:grid-cols-2 gap-2">
                {AMBICIONES.map((amb) => (
                  <label
                    key={amb}
                    className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
                    style={{
                      borderColor: digitalAmbition.includes(amb) ? '#2563eb' : '#e2e8f0',
                      background: digitalAmbition.includes(amb) ? '#eff6ff' : 'white'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={digitalAmbition.includes(amb)}
                      onChange={() => toggleAmbition(amb)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm" style={{ color: '#0f172a' }}>{amb}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Datos de Organización */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
              Datos de tu Organización
            </h2>

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

        {/* PASO 4: Alcance */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
              Alcance de la Evaluación
            </h2>

            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#475569' }}>
                ¿Qué parte de la organización quieres evaluar? *
              </label>
              <div className="space-y-2">
                {SCOPES.map((sc) => (
                  <label
                    key={sc.value}
                    className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition"
                    style={{
                      borderColor: evaluationScope === sc.value ? '#2563eb' : '#e2e8f0',
                      background: evaluationScope === sc.value ? '#eff6ff' : 'white'
                    }}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={evaluationScope === sc.value}
                      onChange={() => setEvaluationScope(sc.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium" style={{ color: '#0f172a' }}>
                      {sc.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {(evaluationScope === 'functional-area' || evaluationScope === 'business-unit') && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                  Especifica el área o unidad
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ej: Departamento de Marketing"
                  value={specificArea}
                  onChange={(e) => setSpecificArea(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* PASO 5: Nivel de Análisis */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
              Nivel de Análisis
            </h2>

            <div className="p-4 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">✓</div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#15803d' }}>
                    Diagnóstico FULL seleccionado
                  </p>
                  <p className="text-sm" style={{ color: '#166534' }}>
                    Evaluarás <strong>40 criterios manualmente (TIER 1)</strong> y la IA inferirá 
                    <strong> 89 criterios adicionales (TIER 2)</strong> basándose en tus respuestas.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p className="text-sm mb-2" style={{ color: '#1e40af' }}>
                <strong>¿Por qué esta estrategia?</strong>
              </p>
              <ul className="text-sm space-y-1 list-disc pl-5" style={{ color: '#475569' }}>
                <li>Tiempo óptimo: 25-35 minutos (vs 60+ min si fuera todo manual)</li>
                <li>Precisión: 40 criterios clave evaluados por ti</li>
                <li>Completitud: 129 criterios totales en el resultado final</li>
                <li>Podrás revisar y ajustar las inferencias de la IA</li>
              </ul>
            </div>
          </div>
        )}

        {/* PASO 6: Confirmación */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
              Resumen y Confirmación
            </h2>

            <div className="p-4 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#475569' }}>Empresa:</p>
                  <p style={{ color: '#0f172a' }}>{companyName}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#475569' }}>Sector:</p>
                  <p style={{ color: '#0f172a' }}>{sector}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#475569' }}>Empleados:</p>
                  <p style={{ color: '#0f172a' }}>{numEmployees}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: '#475569' }}>Tu rol:</p>
                  <p style={{ color: '#0f172a' }}>{role}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold mb-1" style={{ color: '#475569' }}>Alcance:</p>
                  <p style={{ color: '#0f172a' }}>
                    {SCOPES.find(s => s.value === evaluationScope)?.label}
                    {specificArea && ` - ${specificArea}`}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold mb-1" style={{ color: '#475569' }}>Ambiciones digitales:</p>
                  <p style={{ color: '#0f172a' }}>{digitalAmbition.join(', ')}</p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer"
              style={{ borderColor: agreedToStart ? '#2563eb' : '#e2e8f0' }}
            >
              <input
                type="checkbox"
                checked={agreedToStart}
                onChange={(e) => setAgreedToStart(e.target.checked)}
                className="w-5 h-5 mt-0.5"
              />
              <span className="text-sm" style={{ color: '#475569' }}>
                Confirmo que la información es correcta y estoy listo para comenzar el diagnóstico. 
                Entiendo que el proceso tomará aproximadamente 30 minutos.
              </span>
            </label>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex items-center gap-3 mt-6">
          <button
            className={`btn ${step === 1 ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handlePrev}
            disabled={step === 1 || saving}
          >
            ← Anterior
          </button>
          <button
            className="btn btn-primary ml-auto"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? 'Guardando...' : step === TOTAL_STEPS ? 'Comenzar Diagnóstico →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}