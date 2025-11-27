'use client'
import { useState, useEffect, useRef } from 'react'
import bus from '@/lib/bus'

type Msg = { 
  role: 'user' | 'assistant'
  text: string
  source?: 'voice' | 'text'
}

interface AssistantChatProps {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export default function AssistantChat({ messages = [] }: AssistantChatProps) {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // ========================================
  // SINCRONIZAR con mensajes del padre
  // ========================================
  useEffect(() => {
    const externalMsgs: Msg[] = messages.map(m => ({
      role: m.role,
      text: m.content,
      source: 'text' as const
    }))
    
    setMsgs(externalMsgs)
    console.log(`🔄 Chat sincronizado: ${externalMsgs.length} mensajes cargados`)
  }, [messages])

  // Escuchar eventos de voz desde el avatar
  useEffect(() => {
    const handleUserVoice = (data: { text: string }) => {
      // Solo emitir evento - page.tsx agregará el mensaje
      bus.emit('chatMessage', { role: 'user', content: data.text })
    }

    const handleAvatarVoice = (data: { text: string }) => {
      // Solo emitir evento - page.tsx agregará el mensaje
      bus.emit('chatMessage', { role: 'assistant', content: data.text })
    }

    bus.on('user:voice', handleUserVoice)
    bus.on('avatar:voice', handleAvatarVoice)

    return () => {
      bus.off('user:voice', handleUserVoice)
      bus.off('avatar:voice', handleAvatarVoice)
    }
  }, [])

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function send() {
    const userText = input.trim()
    if (!userText) return

    setInput('')
    setLoading(true)

    // Emitir evento - page.tsx agregará a currentChatMessages
    bus.emit('chatMessage', { role: 'user', content: userText })

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, text: m.text })).concat([{ role: 'user', text: userText }]) }),
      })

      const data = await r.json()
      const assistantText = data?.reply ?? '(sin respuesta)'

      // Emitir respuesta del asistente
      bus.emit('chatMessage', { role: 'assistant', content: assistantText })
    } catch (error) {
      console.error('Error en chat:', error)
      bus.emit('chatMessage', { role: 'assistant', content: 'Lo siento, hubo un error. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-900">Chat con Asistente</h3>
      </div>

      {/* Messages - Con padding bottom GRANDE para evitar solapamiento con botón del avatar */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ paddingBottom: '100px' }}
      >
        {msgs.length === 0 ? (
          <div className="text-center text-gray-500 text-xs mt-4">
            <p>👋 Hola, soy tu asistente DTS.</p>
            <p className="mt-1">¿En qué puedo ayudarte?</p>
          </div>
        ) : (
          msgs.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.source === 'voice' && (
                  <span className="text-[10px] opacity-70 mt-1 block">🎤 Por voz</span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span className="text-xs text-gray-600">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Con posición relativa y sin absolute */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-gray-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe..."
            disabled={loading}
            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            ▶
          </button>
        </form>
      </div>
    </div>
  )
}
