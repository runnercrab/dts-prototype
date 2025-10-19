'use client'
import { useState, useEffect, useRef } from 'react'
import { bus } from '../lib/bus'

type Msg = { 
  role: 'user' | 'assistant'
  text: string
  source?: 'text' | 'voice' // ✅ Nuevo: identificar origen
}

export default function AssistantChat() {
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ✅ Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // ✅ Escuchar eventos de voz del avatar
  useEffect(() => {
    // Cuando el usuario habla (voz)
    const handleUserVoice = (data: { text: string }) => {
      setMsgs(m => [...m, { role: 'user', text: data.text, source: 'voice' }])
      // Mostrar "pensando" inmediatamente
      setLoading(true)
    }

    // Cuando el avatar responde (voz)
    const handleAvatarVoice = (data: { text: string }) => {
      setLoading(false)
      setMsgs(m => [...m, { role: 'assistant', text: data.text, source: 'voice' }])
    }

    bus.on('user:voice', handleUserVoice)
    bus.on('avatar:voice', handleAvatarVoice)

    return () => {
      bus.off('user:voice', handleUserVoice)
      bus.off('avatar:voice', handleAvatarVoice)
    }
  }, [])

  async function send() {
    const userText = input.trim()
    if (!userText) return

    // Pinta el mensaje del usuario (texto)
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
              className="btn btn-sm opacity-70 hover:opacity-100"
              onClick={() => setMsgs([])}
              title="Limpiar historial"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Zona de mensajes con scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
          {/* Mensaje de bienvenida */}
          {msgs.length === 0 && (
            <div className="text-center text-neutral-400 py-8">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-sm">Hola, soy tu asistente DTS.</p>
              <p className="text-xs mt-1">¿En qué puedo ayudarte?</p>
            </div>
          )}
          
          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className="inline-block text-left">
                {/* Indicador de fuente (voz/texto) */}
                <div className="text-xs text-neutral-500 mb-1">
                  {m.role === 'user' ? '👤 Usuario' : '🤖 Avatar'}
                  {m.source === 'voice' && ' 🎤'}
                </div>
                <span
                  className={`inline-block px-3 py-2 rounded-lg ${
                    m.role === 'user'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-neutral-800 text-neutral-200'
                  }`}
                >
                  {m.text}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <span className="inline-block px-3 py-2 rounded-lg bg-neutral-700 text-neutral-300">
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
          />
          <button className="btn btn-primary" onClick={send} title="Enviar (↩︎)">
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}