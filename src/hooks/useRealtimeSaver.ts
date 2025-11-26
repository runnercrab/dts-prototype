import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import bus from '@/lib/bus'

interface Response {
  as_is_level: number
  as_is_confidence: 'low' | 'medium' | 'high'
  as_is_notes?: string
  to_be_level: number
  to_be_timeframe: '6months' | '1year' | '2years' | '3years+'
  importance: number
}

/**
 * Hook ÚNICO que guarda TODO en tiempo real:
 * - Respuestas del criterio (AS-IS, TO-BE, Importancia)
 * - Mensajes del chat
 */
export function useRealtimeSaver(
  assessmentId: string | null,
  currentCriteriaId: string | null
) {
  // Debounce para no guardar en cada tecla
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // ====================================
    // GUARDAR RESPUESTAS DEL CRITERIO
    // ====================================
    const handleResponseChange = async (response: Response) => {
      if (!assessmentId || !currentCriteriaId) return

      // Debounce: esperar 500ms después del último cambio
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await supabase.from('dts_responses').upsert({
            assessment_id: assessmentId,
            criteria_id: currentCriteriaId,
            as_is_level: response.as_is_level,
            as_is_confidence: response.as_is_confidence,
            as_is_notes: response.as_is_notes || null,
            to_be_level: response.to_be_level,
            to_be_timeframe: response.to_be_timeframe,
            importance: response.importance,
            response_source: 'manual',
            reviewed_by_user: true
          }, { onConflict: 'assessment_id,criteria_id' })
          
          console.log('✅ Respuesta guardada')
        } catch (error) {
          console.error('❌ Error guardando respuesta:', error)
        }
      }, 500)
    }

    // ====================================
    // GUARDAR MENSAJES DEL CHAT
    // ====================================
    const handleChatMessage = async (message: { 
      role: 'user' | 'assistant' | 'system'
      content: string 
    }) => {
      if (!assessmentId || !currentCriteriaId) return

      try {
        await supabase.from('dts_chat_messages').insert({
          assessment_id: assessmentId,
          criteria_id: currentCriteriaId,
          role: message.role,
          content: message.content
        })
        console.log('✅ Mensaje guardado')
      } catch (error) {
        console.error('❌ Error guardando mensaje:', error)
      }
    }

    // Escuchar eventos
    bus.on('responseChange', handleResponseChange)
    bus.on('chatMessage', handleChatMessage)

    // Limpiar
    return () => {
      bus.off('responseChange', handleResponseChange)
      bus.off('chatMessage', handleChatMessage)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [assessmentId, currentCriteriaId])
}
