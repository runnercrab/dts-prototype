'use client'

import { useEffect, useRef, useState } from 'react'
import StreamingAvatar from '@heygen/streaming-avatar'

const ENV_AVATAR   = (process.env.NEXT_PUBLIC_HEYGEN_AVATAR_NAME || '').trim()
const ENV_VOICE    = (process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || '').trim()
const ENV_KB_ID    = (process.env.NEXT_PUBLIC_HEYGEN_KNOWLEDGE_ID || '7a5ae16fc25444f489d6c5415b6b94d7').trim()
const ENV_GREETING = (process.env.NEXT_PUBLIC_HEYGEN_GREETING || '').trim()

// Utilidades
const sleep = (ms:number) => new Promise(r=>setTimeout(r, ms))

function seemsNonSpanish(text:string) {
  if (!text) return false
  const total = text.length
  let nonLatin = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) || 0
    const isLatin =
      (code >= 0x0020 && code <= 0x007E) ||
      (code >= 0x00A0 && code <= 0x024F) ||
      (code >= 0x1E00 && code <= 0x1EFF) ||
      (code === 0x00A1 || code === 0x00BF)
    if (!isLatin) nonLatin++
  }
  return (nonLatin / total) > 0.30
}

// --- VAD simple (RMS) ---
class SimpleVAD {
  analyser: AnalyserNode
  data: Float32Array
  ctx: AudioContext
  source: MediaStreamAudioSourceNode
  rmsThresh: number
  hotMs: number
  coldMs: number
  constructor(stream: MediaStream, opts?: { rmsThresh?: number; hotMs?: number; coldMs?: number }) {
    this.ctx = new AudioContext()
    this.source = this.ctx.createMediaStreamSource(stream)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.data = new Float32Array(this.analyser.fftSize)
    this.source.connect(this.analyser)
    this.rmsThresh = opts?.rmsThresh ?? 0.015
    this.hotMs     = opts?.hotMs ?? 250
    this.coldMs    = opts?.coldMs ?? 700
  }
  private getRMS(): number {
    this.analyser.getFloatTimeDomainData(this.data)
    let sum = 0
    for (let i=0; i<this.data.length; i++) sum += this.data[i]*this.data[i]
    return Math.sqrt(sum / this.data.length)
  }
  async waitForSpeech(pollMs=60): Promise<boolean> {
    const need = this.hotMs
    let acc = 0
    while (true) {
      const rms = this.getRMS()
      if (rms >= this.rmsThresh) { acc += pollMs; if (acc >= need) return true }
      else acc = 0
      await sleep(pollMs)
    }
  }
  async waitForSilence(pollMs=80): Promise<void> {
    const need = this.coldMs
    let acc = 0
    while (true) {
      const rms = this.getRMS()
      if (rms < this.rmsThresh * 0.8) { acc += pollMs; if (acc >= need) return }
      else acc = 0
      await sleep(pollMs)
    }
  }
  async close() {
    try { this.source.disconnect() } catch {}
    try { this.analyser.disconnect() } catch {}
    try { await this.ctx.close() } catch {}
  }
}

export default function HeygenDebugDemo() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const avatarRef   = useRef<any>(null)

  // Mic
  const micStreamRef = useRef<MediaStream | null>(null)
  const listeningRef = useRef(false)
  const vadRef       = useRef<SimpleVAD | null>(null)

  // UI
  const [avatarName, setAvatarName] = useState(ENV_AVATAR || 'Shawn_Therapist_public')
  const [voiceId, setVoiceId]       = useState(ENV_VOICE)
  const [ready, setReady]           = useState(false)
  const [starting, setStarting]     = useState(false)
  const [log, setLog]               = useState<string[]>([])
  const [speaking, setSpeaking]     = useState(false)
  const [micHint, setMicHint]       = useState<string>('')

  const cooldownUntilRef = useRef<number>(0)
  const [greeting] = useState(ENV_GREETING || 'Hola, soy tu asesor digital de DTS. ¿Listo para comenzar la evaluación?')
  const knowledgeId = ENV_KB_ID

  const append = (l: string) => setLog(s => [...s.slice(-500), l])

  // ---- parche: filtrar error de LiveKit "Unknown DataChannel error on lossy" solo en desarrollo ----
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const origError = console.error
    console.error = (...args: any[]) => {
      try {
        const msg = (args && args[0]) ? String(args[0]) : ''
        if (msg.includes('Unknown DataChannel error on lossy')) {
          // silenciamos este error ruidoso del dev overlay
          return
        }
      } catch {}
      origError(...args)
    }
    return () => { console.error = origError }
  }, [])

  useEffect(() => {
    append(`[env] UA: ${navigator.userAgent}`)
    return () => {
      try { avatarRef.current?.stopAvatar?.() } catch {}
      stopListening()
    }
  }, [])

  // ---------- Helpers ----------
  const isMicLive = () =>
    !!(micStreamRef.current && micStreamRef.current.getTracks().some(t => t.kind === 'audio' && t.readyState === 'live' && t.enabled))

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

  const ensureMic = async () => {
    append('[mic] solicitando permiso…')
    if (isMicLive()) { append('[mic] ya autorizado'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:false, channelCount:1 }
      })
      micStreamRef.current = stream
      append('[mic] permiso concedido y stream listo')
      setMicHint('')
    } catch (e:any) {
      const name = e?.name || 'Error'
      append(`[err] mic permiso: ${name}`)
      setMicHint(
        name === 'NotAllowedError'
          ? 'Permiso denegado. Pulsa el candado → Micrófono → Permitir y recarga.'
          : name === 'NotFoundError'
          ? 'No hay micrófono disponible. Conéctalo o elige otro dispositivo de entrada.'
          : 'No se pudo activar el micro. Revisa permisos del sitio.'
      )
      throw e
    }
  }

  async function transcribeBlob(blob: Blob): Promise<string> {
    const fd = new FormData()
    fd.append('audio', blob, 'audio.webm')
    fd.append('lang', 'es') // fuerza idioma ES
    const r = await fetch('/api/stt', { method:'POST', body: fd })
    if (!r.ok) {
      const t = await r.text().catch(()=> '')
      append(`[err] STT: ${r.status} ${t}`)
      return ''
    }
    const j = await r.json()
    return (j?.text || '').trim()
  }

  function stopListening() {
    listeningRef.current = false
    try { vadRef.current?.close() } catch {}
    vadRef.current = null
    micStreamRef.current?.getTracks()?.forEach(t => t.stop())
    micStreamRef.current = null
    append('[mic] escucha detenida')
  }

  function pickMime(): string {
    const cands = ['audio/webm;codecs=opus','audio/webm','audio/mp4']
    const ok = cands.find(c => (window as any).MediaRecorder?.isTypeSupported?.(c))
    append(`[mic] MIME elegido: ${ok || 'ninguno'}`)
    return ok || ''
  }

  // ---------- Bucle escucha con VAD ----------
  async function listenLoop() {
    if (!isMicLive()) { append('[mic] no hay stream activo'); return }
    if (listeningRef.current) { append('[mic] ya estaba escuchando'); return }
    listeningRef.current = true
    append('[mic] escucha continua INICIADA')

    try {
      vadRef.current = new SimpleVAD(micStreamRef.current!, { rmsThresh: 0.015, hotMs: 250, coldMs: 700 })
    } catch (e:any) {
      append(`[err] VAD init: ${String(e)}`)
      listeningRef.current = false
      return
    }

    const mime = pickMime()
    if (!mime) { append('[err] MediaRecorder sin MIME soportado. Prueba en Chrome/Edge.'); listeningRef.current = false; return }

    while (listeningRef.current) {
      try {
        const now = Date.now()
        if (speaking || now < cooldownUntilRef.current) {
          await sleep(120)
          continue
        }

        if (!isMicLive()) {
          append('[mic] stream no live. Reintentando permiso…')
          try {
            await ensureMic()
            try { vadRef.current?.close() } catch {}
            vadRef.current = new SimpleVAD(micStreamRef.current!, { rmsThresh: 0.015, hotMs: 250, coldMs: 700 })
          } catch {
            await sleep(800)
            continue
          }
        }

        // Espera voz
        await vadRef.current!.waitForSpeech(60)
        if (!listeningRef.current) break

        // Grabar
        const rec = new MediaRecorder(micStreamRef.current!, { mimeType: mime, bitsPerSecond: 32000 })
        const chunks: BlobPart[] = []
        let recording = true
        const startTs = Date.now()
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) }
        rec.start(250)
        append('[mic] grabando…')

        const MAX_MS = 8000
        const MIN_MS = 600
        while (recording && listeningRef.current) {
          if (speaking) break
          const elapsed = Date.now() - startTs
          if (elapsed >= MAX_MS) break
          await vadRef.current!.waitForSilence(90)
          if (Date.now() - startTs >= MIN_MS) break
        }

        await new Promise<void>(res => { rec.onstop = () => res(); try { rec.stop() } catch { res() } })

        const blob = new Blob(chunks, { type: mime.includes('webm') ? 'audio/webm' : 'audio/mp4' })
        append(`[mic] chunk=${blob.size}B`)
        if (blob.size < 12000) { append('[mic] ignorado (silencio corto)'); continue }

        const text = await transcribeBlob(blob)
        if (!text || text.length <= 2) { append('[stt] vacío/corto'); continue }
        if (seemsNonSpanish(text)) { append(`[stt] descartado no-ES: "${text.slice(0, 60)}"`); continue }

        append(`[🎙️ tú] ${text}`)

        while (speaking && listeningRef.current) { await sleep(80) }
        if (!listeningRef.current) break

        const r = await fetch('/api/chat', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ message: text })
        })
        const j = await r.json().catch(()=> ({}))
        const reply = (j?.reply || '').trim() || 'Puedo ayudarte con el diagnóstico DTS: Estrategia, Procesos, Personas, Tecnología, Datos y Cliente.'
        append(`[Avatar] ${reply}`)

        try {
          setSpeaking(true)
          await avatarRef.current?.speak({ text: reply })
        } catch(e:any) {
          append(`[err] speak: ${String(e)}`)
        } finally {
          setSpeaking(false)
          cooldownUntilRef.current = Date.now() + 1200
        }

        await sleep(120)
      } catch (e:any) {
        append(`[err] loop: ${String(e)}`)
        await sleep(400)
      }
    }

    append('[mic] escucha continua PARADA')
  }

  // ---------- Sesión ----------
  const start = async () => {
    if (starting || ready) return
    setStarting(true)
    try {
      append(`[..] Start → avatar="${avatarName}", voiceId="${voiceId || '(default)'}" (KB=${knowledgeId})`)

      const tr = await fetch('/api/heygen/token', { method:'POST' })
      const tj = await tr.json()
      if (!tr.ok || !tj?.token) { append(`[err] token: ${JSON.stringify(tj)}`); setStarting(false); return }
      append('[ok] token recibido')

      const avatar: any = new (StreamingAvatar as any)({ token: tj.token })
      avatarRef.current = avatar

      const evt = (n:string, fn:any)=>{ try{ avatar.on?.(n, fn) } catch{} }
      evt('media_stream', (s:MediaStream)=>{ append('[event] media_stream'); hookVideo(s,'media_stream') })
      evt('mediaStream', (s:MediaStream)=>{ append('[event] mediaStream'); hookVideo(s,'mediaStream') })
      evt('video_track',  (t:MediaStreamTrack)=>{ append('[event] video_track'); hookVideo(new MediaStream([t]),'video_track') })
      evt('error', (e:any)=> append(`[event] error: ${String(e?.message||e)}`))
      evt('status',(s:any)=> append(`[event] status: ${JSON.stringify(s)}`))

      const payload:any = { quality:'high', avatarName, knowledgeId, language:'es' }
      const trimmed = (voiceId||'').trim()
      if (trimmed) payload.voice = { voice_id: trimmed }

      append(`[dbg] payload createStartAvatar: ${JSON.stringify(payload)}`)
      await avatar.createStartAvatar(payload)
      if (avatar.mediaStream) hookVideo(avatar.mediaStream, 'avatar.mediaStream')

      setReady(true)
      append('[ok] avatar READY (vídeo + TTS HeyGen)')

      try {
        setSpeaking(true)
        await avatar.speak({ text: greeting })
      } catch {}
      finally {
        setSpeaking(false)
        cooldownUntilRef.current = Date.now() + 1200
      }
    } catch (e:any) {
      append(`[err] start: ${String(e?.message||e)}`)
      setReady(false)
    } finally {
      setStarting(false)
    }
  }

  const close = async () => {
    try { avatarRef.current?.stopAvatar?.() } catch {}
    avatarRef.current = null
    setReady(false)
    stopListening()
    append('[ok] sesión cerrada')
  }

  // ---------- UI ----------
  return (
    <main className="container-page">
      <h1 className="mb-4">HeyGen Debug — Mic manual (sin subtítulos)</h1>

      <div className="flex flex-wrap gap-3 mb-3">
        <input className="input" value={avatarName} onChange={e=>setAvatarName(e.target.value)} placeholder="Avatar (p.ej. Shawn_Therapist_public)" />
        <input className="input" value={voiceId} onChange={e=>setVoiceId(e.target.value)} placeholder="(Opcional) HeyGen Voice ID (snake_case)" />

        <button className="btn" onClick={async()=>{ try{ await ensureMic() } catch{} }}>
          {isMicLive() ? 'Mic autorizado' : 'Autorizar micrófono'}
        </button>

        {!ready ? (
          <button className="btn bg-green-600 hover:bg-green-500" onClick={start} disabled={starting}>
            {starting ? 'Starting…' : 'Start'}
          </button>
        ) : (
          <button className="btn" onClick={close}>Close</button>
        )}
      </div>

      <div className="text-xs text-neutral-400 mb-2">
        <span className="mr-3">{isMicLive() ? '🎙️ Mic listo' : 'Mic no autorizado aún'}</span>
        <span>{listeningRef.current ? '🟢 Escuchando (manual + VAD)' : '⚪ Inactivo'}</span>
        {micHint && <div className="mt-2 text-amber-300">{micHint}</div>}
      </div>

      <div className="relative w-full h-[420px] rounded-xl border border-neutral-800 bg-black overflow-hidden mb-2">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />

        {ready && (
          <button
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-md ring-1 ring-white/30
                        ${listeningRef.current ? 'bg-red-600 text-white' : 'bg-white text-black'}`}
            title={listeningRef.current ? 'Detener escucha' : 'Empezar a escuchar'}
            onClick={async ()=>{
              append(`[ui] mic button click; listening=${listeningRef.current}`)
              if (!isMicLive()) {
                try { await ensureMic() } catch { return }
              }
              if (!listeningRef.current) {
                listenLoop()
              } else {
                listeningRef.current = false
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"/>
            </svg>
          </button>
        )}
      </div>

      <pre className="max-h-60 overflow-auto text-xs text-neutral-300 bg-neutral-900/50 p-2 rounded">
        {log.join('\n')}
      </pre>
    </main>
  )
}
