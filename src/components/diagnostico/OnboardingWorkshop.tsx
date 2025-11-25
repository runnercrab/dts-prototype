'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onComplete: (assessmentId: string) => void
  existingAssessmentId?: string
  existingData?: any
}

export default function OnboardingWorkshop({ onComplete, existingAssessmentId, existingData }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Datos básicos de la organización
  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState('')
  const [numEmployees, setNumEmployees] = useState<number>(10)
  const [role, setRole] = useState('')
  
  // Pre-Assessment Questions - TM Forum Official
  // Strategy, Customer, Operations
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

  // Cargar datos existentes si los hay
  React.useEffect(() => {
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

  // Opciones
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
    'Otro'
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
    'Otro'
  ]

  const saveAssessment = async () => {
    setSaving(true)
    try {
      const onboardingData = {
        // Datos básicos
        companyName,
        sector,
        numEmployees,
        role,
        
        // Pre-Assessment Questions
        businessAspiration,
        digitalTransformationGoals,
        brandRepresentation,
        culturePrinciples,
        cultureChange,
        workingStyle,
        legacyBurden,
        dataEffectiveness
      }

      // Si estamos editando, actualizar el assessment existente
      if (isEditing && existingAssessmentId) {
        console.log('💾 Actualizando assessment existente...')
        
        const { error } = await supabase
          .from('dts_assessments')
          .update({
            onboarding_data: onboardingData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAssessmentId)

        if (error) {
          console.error('❌ Error actualizando assessment:', error)
          alert('Error al actualizar el assessment. Por favor, intenta de nuevo.')
          setSaving(false)
          return
        }

        console.log('✅ Assessment actualizado')
        onComplete(existingAssessmentId)
        return
      }

      // Si es nuevo, crear assessment
      console.log('💾 Guardando assessment en Supabase...')

      const { data, error } = await supabase
        .from('dts_assessments')
        .insert({
          dmm_version_id: '4e95ce5c-adfc-4095-82a7-715953b46906',
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
      
      onComplete(assessmentId)
    } catch (err) {
      console.error('❌ Error inesperado:', err)
      alert('Error inesperado. Por favor, intenta de nuevo.')
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

        {/* PASO 1: Datos Básicos */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
              Información Básica de tu Organización
            </h2>
            <p className="text-base" style={{ color: '#475569' }}>
              Comenzaremos con algunos datos básicos antes de las preguntas estratégicas del 
              <strong> TM Forum Digital Maturity Model</strong>.
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

        {/* PASO 2: Strategy, Customer, Operations */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                Estrategia, Cliente y Operaciones
              </h2>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Estas preguntas nos ayudarán a entender tus aspiraciones de negocio
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. Suponiendo que no hay restricciones, ¿qué te gustaría que lograra el negocio? *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Ej: Ser el mejor proveedor de servicios digitales a través de una base tecnológica innovadora..."
                value={businessAspiration}
                onChange={(e) => setBusinessAspiration(e.target.value)}
              />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                Pregunta del TM Forum: "Assuming there are no constraints what would you like the business to achieve?"
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Qué esperas lograr con la Transformación Digital? *
              </label>
              <textarea
                className="input w-full h-32 resize-none"
                placeholder="Ej: Que todos los procesos sean digitales e inteligentes, crear mayor claridad interna, reorientar hacia el cliente..."
                value={digitalTransformationGoals}
                onChange={(e) => setDigitalTransformationGoals(e.target.value)}
              />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "What do you hope to achieve from Digital Transformation?"
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                3. ¿Qué te gustaría que tu marca represente para tus clientes? *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Ej: La marca representa gran calidad de servicio en todo lo que hacemos..."
                value={brandRepresentation}
                onChange={(e) => setBrandRepresentation(e.target.value)}
              />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "What would you like your brand to represent to your customers?"
              </p>
            </div>
          </div>
        )}

        {/* PASO 3: Culture */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                Cultura Organizacional
              </h2>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Entender tu cultura actual y deseada es clave para la transformación digital
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. ¿Sobre qué principios clave está construida la cultura de tu empresa? *
              </label>
              <textarea
                className="input w-full h-32 resize-none"
                placeholder="Ej: Reinventar la relación con clientes internos, método ágil, desarrollar habilidades del futuro, cultura de innovación..."
                value={culturePrinciples}
                onChange={(e) => setCulturePrinciples(e.target.value)}
              />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "What key principles is your company's culture built around?"
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Quieres cambiar la cultura de tu empresa? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cultureChange"
                    value="yes"
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
                    value="no"
                    checked={cultureChange === 'no'}
                    onChange={() => setCultureChange('no')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "Do you want to change the culture of your company?"
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                3. ¿Qué estilo de trabajo te gustaría promover? *
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Ej: Trabajo ágil, colaboración entre equipos, enfoque en el cliente, innovación continua..."
                value={workingStyle}
                onChange={(e) => setWorkingStyle(e.target.value)}
              />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "What style of working would you like to promote?"
              </p>
            </div>
          </div>
        )}

        {/* PASO 4: Data/Technology */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                Datos y Tecnología
              </h2>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>
                Últimas preguntas sobre tu situación tecnológica actual
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                1. ¿Cómo calificarías la carga de sistemas legacy en tu entorno IT? *
              </label>
              <div className="space-y-2">
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
                  <span>Muy baja</span>
                  <span>Baja</span>
                  <span>Media</span>
                  <span>Alta</span>
                  <span>Muy alta</span>
                </div>
                <p className="text-sm font-medium text-center" style={{ color: '#0f172a' }}>
                  Nivel seleccionado: {
                    legacyBurden === '1' ? 'Muy baja' :
                    legacyBurden === '2' ? 'Baja' :
                    legacyBurden === '3' ? 'Media' :
                    legacyBurden === '4' ? 'Alta' : 'Muy alta'
                  }
                </p>
              </div>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "How would you rate the burden of legacy in your IT environment resp. technical debt?"
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>
                2. ¿Cómo podrías usar los datos de forma más efectiva para lograr tus objetivos? *
              </label>
              <textarea
                className="input w-full h-32 resize-none"
                placeholder="Ej: Combinar datos de diferentes fuentes, aplicar análisis predictivo, usar datos para aprendizaje continuo..."
                value={dataEffectiveness}
                onChange={(e) => setDataEffectiveness(e.target.value)}
              />
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                TM Forum: "How might you use data more effectively to achieve your goals?"
              </p>
            </div>

            <div className="p-4 rounded-lg mt-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p className="text-sm" style={{ color: '#1e40af' }}>
                <strong>¡Listo!</strong> Con esta información inicial, podremos personalizar tu diagnóstico 
                de madurez digital según la metodología oficial TM Forum.
              </p>
            </div>
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
          
          {/* Botón Cancelar - solo si está editando */}
          {isEditing && (
            <button
              className="btn"
              onClick={() => onComplete(existingAssessmentId!)}
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
