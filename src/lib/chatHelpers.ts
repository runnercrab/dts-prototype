// src/lib/chatHelpers.ts
import { supabase } from './supabase'

/**
 * Guarda un mensaje del chat en la base de datos
 */
export async function saveChatMessage({
  assessmentId,
  criteriaId,
  role,
  content,
  sessionId,
}: {
  assessmentId: string
  criteriaId?: string | null
  role: 'user' | 'assistant' | 'system'
  content: string
  sessionId?: string | null
}) {
  try {
    const { data, error } = await supabase
      .from('dts_chat_messages')
      .insert({
        assessment_id: assessmentId,
        criteria_id: criteriaId || null,
        role,
        content,
        session_id: sessionId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error guardando mensaje de chat:', error)
      throw error
    }

    console.log('✅ Mensaje de chat guardado:', data.id)
    return data
  } catch (err) {
    console.error('Error en saveChatMessage:', err)
    throw err
  }
}

/**
 * Carga todos los mensajes del chat para un assessment específico
 */
export async function loadChatMessages(assessmentId: string) {
  try {
    const { data, error } = await supabase
      .from('dts_chat_messages')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error cargando mensajes:', error)
      throw error
    }

    return data || []
  } catch (err) {
    console.error('Error en loadChatMessages:', err)
    return []
  }
}

/**
 * Carga mensajes del chat para un criterio específico
 */
export async function loadChatMessagesForCriterion(
  assessmentId: string,
  criteriaId: string
) {
  try {
    const { data, error } = await supabase
      .from('dts_chat_messages')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('criteria_id', criteriaId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error cargando mensajes del criterio:', error)
      throw error
    }

    return data || []
  } catch (err) {
    console.error('Error en loadChatMessagesForCriterion:', err)
    return []
  }
}

/**
 * Guarda múltiples mensajes de chat a la vez
 */
export async function saveBulkChatMessages({
  assessmentId,
  criteriaId,
  messages,
}: {
  assessmentId: string
  criteriaId?: string | null
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}) {
  try {
    const messagesToInsert = messages.map(msg => ({
      assessment_id: assessmentId,
      criteria_id: criteriaId || null,
      role: msg.role,
      content: msg.content,
    }))

    const { data, error } = await supabase
      .from('dts_chat_messages')
      .insert(messagesToInsert)
      .select()

    if (error) {
      console.error('Error guardando mensajes bulk:', error)
      throw error
    }

    console.log(`✅ ${data.length} mensajes guardados`)
    return data
  } catch (err) {
    console.error('Error en saveBulkChatMessages:', err)
    throw err
  }
}

/**
 * Elimina todos los mensajes de un assessment (usar con precaución)
 */
export async function deleteChatMessages(assessmentId: string) {
  try {
    const { error } = await supabase
      .from('dts_chat_messages')
      .delete()
      .eq('assessment_id', assessmentId)

    if (error) {
      console.error('Error eliminando mensajes:', error)
      throw error
    }

    console.log('✅ Mensajes eliminados para assessment:', assessmentId)
  } catch (err) {
    console.error('Error en deleteChatMessages:', err)
    throw err
  }
}