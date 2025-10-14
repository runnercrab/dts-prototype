'use client'

import { useEffect, useRef, useState } from 'react'
import StreamingAvatar from '@heygen/streaming-avatar'

const ENV_AVATAR  = (process.env.NEXT_PUBLIC_HEYGEN_AVATAR_NAME || '').trim()
const ENV_VOICE   = (process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || '').trim()
const ENV_KB_ID   = (process.env.NEXT_PUBLIC_HEYGEN_KNOWLEDGE_ID || '7a5ae16fc25444f489d6c5415b6b94d7').trim()
const ENV_GREETING= (process.env.NEXT_PUBLIC_HEYGEN_GREETING || '').trim()

export default function HeygenDebugDemo() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const avatarRef = useRef<any>(null)

  const [avatarName, setAvatarName] = useState(ENV_AVATAR || 'Shawn_Therapist_public')
  const [voiceId, setVoiceId]       = useState(ENV_VOICE) // vacío = usa voz por defecto de HeyGen
  const [text, setText]             = useState('')
  const [ready, setReady]           = useState(false)
  const [starting, setStarting]     = useState(false)
  const [log, setLog]               = useState<string[]>([])

  const greetedRef = useRef(false)
  const [autoGreet, setAutoGreet]   = useState(true)
  const [greeting, setGreeting]     = useState(
    ENV_GREETING || 'Hola, soy tu asesor digital de DTS. ¿Empezamos?'
  )

  const knowledgeId = ENV_KB_ID
  const append = (l: string) => setLog(s => [...s.slice(-300), l])

  useEffect(() => () => { try { avatarRef.current?.stopAvatar() } catch {} }, [])

  const hookVideo = (stream: MediaStream, from: string) => {
    const v = videoRef.current
    if (!v) return
    // @ts-ignore
    v.srcObject = stream
    v.muted = false
    v.playsInline = true
    v.autoplay = true
    v.controls = false
    v.play().catch(()=>{})
    append(`[ok] stream conectado a <video> (${from})`)
  }

  const start = async () => {
    if (starting || ready) return
    setStarting(true)
    greetedRef.current = false

    append(`[..] Start → avatar="${avatarName}", voiceId="${voiceId || '(default)'}" (KB=${knowledgeId})`)
    try {
      const r = await fetch('/api/heygen/token', { method: 'POST' })
      const j = await r.json()
      if (!r.ok || !j?.token) { append(`[err] token: ${JSON.stringify(j)}`); setStarting(false); return }
      const token: string = j.token
      append('[ok] token recibido')

      const avatar: any = new (StreamingAvatar as any)({ token })
      avatarRef.current = avatar
      append(`[info] Métodos detectados: ${Object.keys(avatar).sort().join(', ')}`)

      const evt = (name: string, fn: any) => { try { avatar.on?.(name, fn) } catch {} }
      evt('media_stream', (s: MediaStream) => { append('[event] media_stream'); hookVideo(s,'media_stream') })
      evt('mediaStream', (s: MediaStream) => { append('[event] mediaStream'); hookVideo(s,'mediaStream') })
      evt('video_track',  (t: MediaStreamTrack) => { append('[event] video_track'); hookVideo(new MediaStream([t]),'video_track') })
      evt('status', (s: any) => append(`[event] status: ${JSON.stringify(s)}`))
      evt('error',  (e: any) => append(`[event] error: ${JSON.stringify(e)}`))

      const payload: any = {
        quality: 'high',
        avatarName,
        knowledgeId,
      }
      if (voiceId.trim()) {
        payload.voice = { voice_id: voiceId.trim() }
      }
      append(`[dbg] payload createStartAvatar: ${JSON.stringify(payload)}`)

      await avatar.createStartAvatar(payload)

      if (avatar.mediaStream) hookVideo(avatar.mediaStream, 'avatar.mediaStream')

      setReady(true)
      append('[ok] avatar READY (deberías ver vídeo)')

      if (autoGreet && !greetedRef.current && greeting.trim()) {
        try {
          append(`[auto] saludo: ${greeting}`)
          await avatar.speak({ text: greeting.trim() })
          greetedRef.current = true
        } catch (e:any) {
          append(`[warn] no se pudo reproducir el saludo: ${String(e)}`)
        }
      }
    } catch (e: any) {
      append(`[err] start: ${String(e)}`)
      setReady(false)
    } finally {
      setStarting(false)
    }
  }

  const close = async () => {
    try { await avatarRef.current?.stopAvatar() } catch {}
    avatarRef.current = null
    setReady(false)
    append('[ok] sesión cerrada')
  }

  const repeat = async () => {
    const t = text.trim(); if (!t) return
    append(`[Tú] ${t}`); setText('')
    try { await avatarRef.current?.speak({ text: t }); append('[ok] speak() enviado') }
    catch (e:any) { append(`[err] speak: ${String(e)}`) }
  }

  const talkLLM = async () => {
    const t = text.trim(); if (!t) return
    append(`[Tú] ${t}`); setText('')
    try {
      const r = await fetch('/api/chat',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: t }) })
      const j = await r.json()
      const reply = j?.reply || 'No response'
      append(`[Avatar] ${reply}`)
      await avatarRef.current?.speak({ text: reply })
      append('[ok] speak(LLM) enviado')
    } catch (e:any) {
      append(`[err] LLM/speak: ${String(e)}`)}
  }

  return (
    <main className="container-page">
      <h1 className="mb-4">HeyGen Debug Demo</h1>

      <div className="flex flex-wrap gap-3 mb-3">
        <input className="input" value={avatarName} onChange={e=>setAvatarName(e.target.value)} placeholder="Avatar name (p.ej. Wayne_20240711)" />
        <input className="input" value={voiceId}   onChange={e=>setVoiceId(e.target.value)} placeholder="Voice ID (vacío = usar la del panel)" />
        {!ready ? (
          <button className="btn bg-green-600 hover:bg-green-500" onClick={start} disabled={starting}>
            {starting ? 'Starting…' : 'Start'}
          </button>
        ) : (
          <button className="btn" onClick={close}>Close</button>
        )}
      </div>

      <div className="text-xs text-neutral-400 mb-2">
        <div><strong>.env</strong> avatar: <code>{ENV_AVATAR || '(none)'}</code></div>
        <div><strong>.env</strong> voice: <code>{ENV_VOICE || '(default)'}</code></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoGreet} onChange={e=>setAutoGreet(e.target.checked)} />
          <span className="text-sm text-neutral-300">Saludo automático al iniciar</span>
        </label>
        <input
          className="input flex-1"
          placeholder="Texto del saludo…"
          value={greeting}
          onChange={(e)=>setGreeting(e.target.value)}
        />
      </div>

      <input className="input w-full mb-3" placeholder="Enter text for avatar to speak" value={text} onChange={e=>setText(e.target.value)} />
      <div className="flex gap-3 mb-4">
        <button className="btn btn-primary" onClick={talkLLM} disabled={!ready}>Talk (LLM)</button>
        <button className="btn" onClick={repeat} disabled={!ready}>Repeat</button>
      </div>

      <div className="w-full h-[420px] rounded-xl border border-neutral-800 bg-black overflow-hidden mb-2 flex items-center justify-center">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
      </div>

      <pre className="max-h-60 overflow-auto text-xs text-neutral-300 bg-neutral-900/50 p-2 rounded">
        {log.join('\n')}
      </pre>
    </main>
  )
}
