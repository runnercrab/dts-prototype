'use client'
import { useState, useEffect, useRef } from 'react'
import bus from '../lib/bus'  // ✅ CORREGIDO: sin llaves

type Msg = { 
  role: 'user' | 'assistant'
  text: string
  source?: 'voice' | 'text'
}

export default function AssistantChat() {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Escuchar eventos de voz desde el avatar
  useEffect(() => {
    const handleUserVoice = (data: { text: string }) => {
      setMsgs(m => [...m, { role: 'user', text: data.text, source: 'voice' }])
    }

    const handleAvatarVoice = (data: { text: string }) => {
      setMsgs(m => [...m, { role: 'assistant', text: data.text, source: 'voice' }])
    }

    bus.on('user:voice', handleUserVoice)
    bus.on('avatar:voice', handleAvatarVoice)

    return () => {
      bus.off('user:voice', handleUserVoice)
      bus.off('avatar:voice', handleAvatarVoice)
    }
  }, [])

  // Auto-scroll solo cuando el usuario escribe texto (no por voz)
  useEffect(() => {
    const lastMsg = msgs[msgs.length - 1]
    // Solo scroll si el usuario escribió (no por voz)
    if (lastMsg && lastMsg.role === 'user' && lastMsg.source === 'text') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [msgs])

  async function send() {
    const userText = input.trim()
    if (!userText) return

    // Marcar como fuente 'text'
    setMsgs(m => [...m, { role: 'user', text: userText, source: 'text' }])
    setInput('')
    setLoading(true)

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...msgs, { role: 'user', text: userText }] }),
      })

      const data = await r.json()
      const assistantText = data?.reply ?? '(sin respuesta)'

      setMsgs(m => [...m, { role: 'assistant', text: assistantText, source: 'text' }])

      // 🔔 Manda evento al avatar para que lo hable
      bus.emit('llm:reply', { text: assistantText })
    } catch (e: any) {
      setMsgs(m => [...m, { role: 'assistant', text: '(error de conexión)', source: 'text' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card h-full">
      <div className="card-body flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h2>Asistente</h2>
          {msgs.length > 0 && (
            <button
              className="btn btn-muted text-xs"
              onClick={() => setMsgs([])}
              title="Limpiar historial"
            >
              🗑️ Limpiar
            </button>
          )}
        </div>

        {/* Zona de mensajes con scroll */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0"
        >
          {/* Mensaje de bienvenida */}
          {msgs.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <div className="text-4xl mb-2">👋</div>
              <p className="text-sm font-semibold">Hola, soy tu asistente DTS.</p>
              <p className="text-xs mt-1">¿En qué puedo ayudarte?</p>
            </div>
          )}
          
          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className="inline-block text-left">
                {/* Indicador de fuente (voz/texto) */}
                <div className="message-label">
                  {m.role === 'user' ? '👤 Usuario' : '🤖 Avatar'}
                  {m.source === 'voice' && ' 🎤'}
                </div>
                <span className={m.role === 'user' ? 'message-user' : 'message-assistant'}>
                  {m.text}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <span className="message-assistant animate-pulse">
                💭 Pensando...
              </span>
            </div>
          )}
          {/* Marcador invisible para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input + botón enviar */}
        <div className="flex gap-2">
          <input
            className="flex-1 input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu mensaje…"
            onKeyDown={e => {
              if (e.key === 'Enter') send()
            }}
            autoFocus={false}
          />
          <button className="btn btn-primary" onClick={send} title="Enviar (↩︎)">
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}