'use client'

import { useEffect, useRef, useState } from 'react'
import StreamingAvatar from '@heygen/streaming-avatar'

type ChatResponse = { reply?: string; text?: string; message?: string }

export default function AvatarPane() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const avatarRef = useRef<any>(null)

  const [ready, setReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const [text, setText] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [recState, setRecState] = useState<'idle' | 'recording'>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const append = (l: string) => setLog(s => [...s.slice(-200), l])

  const avatarName = (process.env.NEXT_PUBLIC_HEYGEN_AVATAR_NAME || 'Shawn_Therapist_public').trim()
  const voiceId   = (process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID   || 'e488fe9cf63b420998d3180d15b7fe7f').trim()

  useEffect(() => () => cleanup(), [])

  const cleanup = () => {
    try { watchdogRef.current && clearTimeout(watchdogRef.current) } catch {}
    try { mediaRecorderRef.current?.stop() } catch {}
    try { avatarRef.current?.stopAvatar() } catch {}
    avatarRef.current = null
    setStarting(false)
    setReady(false)
  }

  const hookVideo = (stream: MediaStream, from: string) => {
    const v = videoRef.current
    if (!v) return
    // @ts-ignore
    v.srcObject = stream
    v.muted = false
    v.playsInline = true
    v.autoplay = true
    v.controls = false
    v.play().catch(() => {})
    append(`[ok] stream→<video> (${from})`)
  }

  const start = async () => {
    if (starting || ready) return
    setStarting(true)
    append(`[..] Start → avatarName="${avatarName}", voiceId="${voiceId}", quality="high"`)

    try {
      const r = await fetch('/api/heygen/token', { method: 'POST' })
      const data = await r.json()
      if (!r.ok || !data?.token) { append(`[err] token: ${JSON.stringify(data)}`); setStarting(false); return }
      const token: string = data.token

      const avatar: any = new (StreamingAvatar as any)({ token })
      avatarRef.current = avatar

      // eventos opcionales
      avatar.on?.('media_stream', (s: MediaStream) => { append('[event] media_stream'); hookVideo(s, 'media_stream') })
      avatar.on?.('mediaStream', (s: MediaStream) => { append('[event] mediaStream'); hookVideo(s, 'mediaStream') })
      avatar.on?.('video_track', (t: MediaStreamTrack) => { append('[event] video_track'); hookVideo(new MediaStream([t]), 'video_track') })
      avatar.on?.('status', (s: any) => append(`[event] status: ${JSON.stringify(s)}`))
      avatar.on?.('error', (e: any) => append(`[event] error: ${JSON.stringify(e)}`))

      // attach si existe; si no, container en createStartAvatar
      const hasAttach = typeof avatar.attach === 'function'
      if (hasAttach) {
        if (!containerRef.current) { append('[err] sin container'); setStarting(false); return }
        append('[..] attach(container)')
        await avatar.attach(containerRef.current)
      }

      append('[..] creando sesión de avatar')
      await avatar.createStartAvatar({
        quality: 'high',
        avatarName,
        voice: { voice_id: voiceId },
        ...(hasAttach ? {} : { container: containerRef.current || undefined }),
      })

      watchdogRef.current = setTimeout(() => {
        append('[info] si no ves vídeo, revisa permisos de streaming/voz en la cuenta.')
      }, 10000)

      setReady(true)
      setStarting(false)
      append('[ok] avatar READY')
    } catch (e: any) {
      append(`[err] start: ${String(e)}`)
      setStarting(false)
      setReady(false)
    }
  }

  const reset = async () => { append('[..] Reiniciar sesión'); cleanup(); await start() }

  const askLLM = async (prompt?: string) => {
    try {
      if (!ready) return append('[warn] avatar no READY (pulsa Start)')
      const userMsg = (prompt ?? text).trim()
      if (!userMsg) return
      append(`[Tú] ${userMsg}`)
      if (!prompt) setText('')

      const rr = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const j: ChatResponse = await rr.json().catch(() => ({} as ChatResponse))
      const reply = j.reply || j.text || j.message || 'No he podido generar respuesta ahora mismo.'
      append(`[Avatar] ${reply}`)
      await avatarRef.current?.speak({ text: reply })
    } catch (e: any) {
      append(`[err] speak/LLM: ${String(e)}`)
    }
  }

  const toggleRec = async () => {
    if (!ready) return append('[warn] avatar no READY (pulsa Start)')
    if (recState === 'idle') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = mr
        audioChunksRef.current = []

        mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data) }
        mr.onstop = async () => {
          try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            const fd = new FormData()
            fd.append('audio', blob, 'input.webm')
            append('[..] transcribiendo audio (STT)')
            const r = await fetch('/api/stt', { method: 'POST', body: fd })
            const j = await r.json()
            const transcript: string = j?.text || ''
            append(`[Tú 🎙️] ${transcript || '(vacío)'}`)
            if (!transcript) return
            await askLLM(transcript)
          } catch (e: any) {
            append(`[err] STT/LLM: ${String(e)}`)
          } finally {
            stream.getTracks().forEach(t => t.stop())
            setRecState('idle')
          }
        }

        mr.start()
        setRecState('recording')
        append('[mic] grabando… pulsa de nuevo para detener')
      } catch (e: any) {
        append(`[err] mic: ${String(e)}`)
        setRecState('idle')
      }
    } else {
      try { mediaRecorderRef.current?.stop(); append('[mic] deteniendo grabación…') }
      catch (e: any) { append(`[err] stop mic: ${String(e)}`); setRecState('idle') }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') askLLM() }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="mb-3">Avatar</h2>

        {/* Contenedor donde el SDK pinta el vídeo/canvas */}
        <div ref={containerRef} className="w-full h-[420px] md:h-[520px] rounded-xl border border-neutral-800 bg-black overflow-hidden" />

        {/* Vídeo oculto para builds que emiten media_stream/video_track */}
        <video ref={videoRef} className="w-full h-[1px] opacity-0" autoPlay playsInline />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!ready ? (
            <button className="btn" onClick={start} disabled={starting}>
              {starting ? 'Iniciando…' : 'Start'}
            </button>
          ) : (
            <button className="btn" onClick={reset}>Reiniciar</button>
          )}

          <input
            className="input flex-1"
            placeholder="Escribe tu pregunta… (Enter para enviar)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="btn btn-primary" onClick={() => askLLM()} disabled={!ready}>Preguntar</button>

          <button className={`btn ${recState === 'recording' ? 'bg-red-700' : ''}`} onClick={toggleRec} disabled={!ready}>
            {recState === 'recording' ? 'Detener' : '🎙️ Mic'}
          </button>
        </div>

        <pre className="mt-3 max-h-40 overflow-auto text-xs text-neutral-300 bg-neutral-900/50 p-2 rounded">
          {log.join('\n')}
        </pre>
      </div>
    </div>
  )
}
