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
  const prevMessagesRef = useRef<string>('')

  // ========================================
  // SINCRONIZAR con mensajes del padre
  // ========================================
  useEffect(() => {
    const key = JSON.stringify(messages)
    if (key === prevMessagesRef.current) return
    prevMessagesRef.current = key

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
      setMsgs(prev => [...prev, { role: 'user', text: data.text, source: 'voice' }])
      bus.emit('chatMessage', { role: 'user', content: data.text })
    }

    const handleAvatarVoice = (data: { text: string }) => {
      setMsgs(prev => [...prev, { role: 'assistant', text: data.text, source: 'voice' }])
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

    // Agregar mensaje del usuario al chat local
    setMsgs(prev => [...prev, { role: 'user', text: userText, source: 'text' }])
    bus.emit('chatMessage', { role: 'user', content: userText })

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, text: m.text })).concat([{ role: 'user', text: userText }]) }),
      })

      const data = await r.json()
      const assistantText = data?.reply ?? '(sin respuesta)'

      setMsgs(prev => [...prev, { role: 'assistant', text: assistantText, source: 'text' }])
      bus.emit('chatMessage', { role: 'assistant', content: assistantText })
    } catch (error) {
      console.error('Error en chat:', error)
      const errorMsg = 'Lo siento, hubo un error. Intenta de nuevo.'
      setMsgs(prev => [...prev, { role: 'assistant', text: errorMsg, source: 'text' }])
      bus.emit('chatMessage', { role: 'assistant', content: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {msgs.length === 0 ? (
          <div className="text-center text-slate-400 text-[14px] mt-6">
            <p>👋 Hola, soy tu asistente.</p>
            <p className="mt-1">¿En qué puedo ayudarte?</p>
          </div>
        ) : (
          msgs.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#1a90ff] text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.source === 'voice' && (
                  <span className="text-[11px] opacity-60 mt-1 block">🎤 Por voz</span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-500"></div>
                <span className="text-[13px] text-slate-500">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
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
            placeholder="Escribe un mensaje..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-[14px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{ backgroundColor: '#1a90ff' }}
          >
            ▶
          </button>
        </form>
      </div>
    </div>
  )
}