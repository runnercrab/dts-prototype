'use client'

import { useEffect, useRef, useState } from 'react'
import StreamingAvatar from '@heygen/streaming-avatar'

const ENV_AVATAR = (process.env.NEXT_PUBLIC_HEYGEN_AVATAR_NAME || '').trim() || 'Shawn_Therapist_public'
const ENV_VOICE  = (process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || '').trim()
const ENV_GREETING = (process.env.NEXT_PUBLIC_HEYGEN_GREETING || 'Hola, soy tu asesor digital de DTS. Mantén pulsado para hablar.').trim()

type PttState = 'idle' | 'arming' | 'recording'

export default function AvatarPane() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const avatarRef = useRef<any>(null)

  // Audio PTT
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const procStreamRef  = useRef<MediaStream | null>(null)
  const recRef         = useRef<MediaRecorder | null>(null)
  const recChunksRef   = useRef<BlobPart[]>([])
  const recStartTsRef  = useRef<number>(0)

  // VAD avatar
  const avatarAudioCtxRef = useRef<AudioContext | null>(null)
  const avatarAnalyserRef = useRef<AnalyserNode | null>(null)
  const [avatarTalking, setAvatarTalking] = useState(false)

  const [ready, setReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const [pttState, setPttState] = useState<PttState>('idle')
  const [log, setLog] = useState<string[]>([])
  const append = (l: string) => setLog(s => [...s.slice(-400), l])

  const cooldownUntilRef = useRef<number>(0)
  const [, setCooldownTick] = useState(0)
  const armCooldown = (ms:number) => {
    cooldownUntilRef.current = Date.now() + ms
    setTimeout(() => setCooldownTick(t => t + 1), ms + 30)
  }

  useEffect(() => {
    // silencia warnings ruidosos del datachannel
    const orig = console.error
    console.error = (...args: any[]) => {
      try {
        const msg = args?.map(a => (typeof a === 'string' ? a : a?.message || '')).join(' ')
        if (/Unknown DataChannel error on lossy|RTCEngine\.handleDataError/i.test(msg)) return
      } catch {}
      orig(...args)
    }
    return () => {
      console.error = orig
      try { avatarRef.current?.stopAvatar?.() } catch {}
      stopAudio(); stopAvatarMonitor()
    }
  }, [])

  function stopAudio() {
    try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop() } catch {}
    recRef.current = null; recChunksRef.current = []; setPttState('idle')
    if (audioCtxRef.current) { try { audioCtxRef.current.close() } catch {} }
    audioCtxRef.current = null; procStreamRef.current = null
  }

  function hookVideo(stream: MediaStream) {
    const v = videoRef.current; if (!v) return
    // @ts-ignore
    v.srcObject = stream; v.muted = false; v.playsInline = true; v.autoplay = true; v.controls = false
    v.play().catch(()=>{})
    startAvatarMonitor(stream)
  }

  function startAvatarMonitor(stream: MediaStream) {
    stopAvatarMonitor()
    try {
      const ctx = new AudioContext(); avatarAudioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; avatarAnalyserRef.current = analyser
      src.connect(analyser)

      const PEAK_ON = 12, PEAK_OFF = 9, SILENCE_MS = 700
      const buf = new Uint8Array(analyser.frequencyBinCount)
      let talking = false, lastAboveTs = 0, lastState = false

      const loop = () => {
        if (!avatarAnalyserRef.current) return
        analyser.getByteTimeDomainData(buf)
        let peak = 0; for (let i=0;i<buf.length;i++){ const v = Math.abs(buf[i]-128); if (v>peak) peak=v }
        const now = performance.now()
        if (!talking) { if (peak >= PEAK_ON) { talking = true; lastAboveTs = now } }
        else { if (peak >= PEAK_OFF) lastAboveTs = now; if (now - lastAboveTs > SILENCE_MS) talking = false }
        if (talking !== lastState) { lastState = talking; setAvatarTalking(talking); if (!talking) armCooldown(300) }
        if (avatarAnalyserRef.current) requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    } catch {}
  }
  function stopAvatarMonitor() {
    try { avatarAnalyserRef.current?.disconnect() } catch {}
    avatarAnalyserRef.current = null
    if (avatarAudioCtxRef.current) { try { avatarAudioCtxRef.current.close() } catch {} }
    avatarAudioCtxRef.current = null
    setAvatarTalking(false)
  }

  async function ensureMicChain() {
    const base: MediaStreamConstraints = { audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:false, channelCount:1, sampleRate:48000 } }
    const raw = await navigator.mediaDevices.getUserMedia(base)
    const ctx = new AudioContext(); audioCtxRef.current = ctx
    const src = ctx.createMediaStreamSource(raw)
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -28; comp.knee.value = 22; comp.ratio.value = 3.5; comp.attack.value = 0.003; comp.release.value = 0.25
    const dest = ctx.createMediaStreamDestination()
    src.connect(comp).connect(dest)
    procStreamRef.current = dest.stream
  }

  async function transcribeBlob(blob: Blob): Promise<{ text:string, lang:'es'|'other' }> {
    const fd = new FormData(); fd.append('audio', blob, 'audio.webm'); fd.append('lang','es')
    const r = await fetch('/api/stt', { method:'POST', body: fd, cache:'no-store' })
    if (!r.ok) return { text:'', lang:'other' }
    const j = await r.json(); const lang = (j?.lang==='es') ? 'es':'other'
    return { text:(j?.text||'').trim(), lang }
  }

  async function startRecord() {
    console.log('🎤 Iniciando grabación...')
    if (avatarTalking) return
    if (Date.now() < cooldownUntilRef.current) return
    if (!procStreamRef.current) await ensureMicChain()
    if (recRef.current && recRef.current.state!=='inactive') return

    recChunksRef.current = []
    const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(c => (window as any).MediaRecorder?.isTypeSupported?.(c)) || 'audio/webm'
    const rec = new MediaRecorder(procStreamRef.current!, { mimeType: mime, bitsPerSecond: 128_000 })
    recRef.current = rec; recStartTsRef.current = Date.now()
    setPttState('arming')
    rec.ondataavailable = e => { if (e.data && e.data.size) recChunksRef.current.push(e.data) }
    rec.onstart = () => {
      setPttState('recording')
      console.log('✅ Grabación iniciada')
    }
    rec.start(0)

    // ✅ FIX: Eliminadas las 2 líneas que causaban la doble llamada a stopRecordAndSend
    // El onPointerUp del botón ya maneja el evento de soltar
  }

  async function stopRecordAndSend() {
    console.log('🛑 stopRecordAndSend llamado, estado:', recRef.current?.state)
    const rec = recRef.current
    if (!rec || rec.state==='inactive') { 
      console.log('⚠️ Recorder ya estaba inactivo')
      setPttState('idle'); 
      return 
    }
    setPttState('idle')
    await new Promise<void>(res => { rec.onstop = () => res(); try{ rec.stop() }catch{ res() } })

    const blob = new Blob(recChunksRef.current, { type: (rec.mimeType.includes('webm') ? 'audio/webm' : 'audio/mp4') })
    recChunksRef.current = []
    console.log('🎵 Blob creado, tamaño:', blob.size)

    const { text, lang } = await transcribeBlob(blob)
    console.log('📝 Transcripción:', text, 'Lang:', lang)
    if (!text) {
      console.log('⚠️ No hay texto en la transcripción')
      return
    }

    const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text }), cache:'no-store' })
    const j = await r.json().catch(()=> ({}))
    const reply = (j?.reply||'').trim() || 'Puedo ayudarte con el diagnóstico DTS.'
    console.log('💬 Respuesta del avatar:', reply)

    try {
      await avatarRef.current?.speak({
        text: reply,
        task_type:'REPEAT',
        task_mode:'SYNC'
      })
    } finally { armCooldown(2200) }
  }

  const start = async () => {
    if (starting || ready) return
    setStarting(true)
    try {
      const tr = await fetch('/api/heygen/token', { method:'POST', cache:'no-store' })
      const tj = await tr.json()
      if (!tr.ok || !tj?.token) { setStarting(false); return }

      const avatar: any = new (StreamingAvatar as any)({ token: tj.token })
      avatarRef.current = avatar

      const on = (n:string, fn:any)=>{ try{ avatar.on?.(n, fn) } catch{} }
      on('media_stream', (s:MediaStream)=> hookVideo(s))
      on('mediaStream', (s:MediaStream)=> hookVideo(s))
      on('AVATAR_START_TALKING', ()=> setAvatarTalking(true))
      on('AVATAR_STOP_TALKING',  ()=> setAvatarTalking(false))

      const payload:any = { 
        quality:'high', 
        avatarName: ENV_AVATAR, 
        language:'es', 
        version:'v1',
        ...(ENV_VOICE && {
          voice: { 
            voiceId: ENV_VOICE,
            rate: 1.0 
          }
        })
      }
      
      await avatar.createStartAvatar(payload)

      if (avatar.mediaStream) hookVideo(avatar.mediaStream)
      setReady(true)

      try {
        await avatar.speak({
          text: ENV_GREETING.slice(0,120),
          task_type:'REPEAT',
          task_mode:'SYNC'
        })
      } finally { armCooldown(1000) }
    } finally {
      setStarting(false)
    }
  }

  const close = async () => {
    try { avatarRef.current?.stopAvatar?.() } catch {}
    avatarRef.current = null; setReady(false)
    stopAudio(); stopAvatarMonitor()
  }

  const cooldownActive = Date.now() < cooldownUntilRef.current
  const recActive = pttState === 'arming' || pttState === 'recording'

  return (
    <div className="card relative">
      <div className="card-body">

        <div className="mb-3 flex gap-2">
          {!ready ? (
            <button className="btn btn-primary" onClick={start} disabled={starting}>
              {starting ? 'Starting…' : 'Start'}
            </button>
          ) : (
            <button className="btn" onClick={close}>Close</button>
          )}
        </div>

        {/* Player — el video NO captura clicks */}
        <div className="relative w-full h-[420px] rounded-xl border border-neutral-800 bg-black overflow-hidden">
          {/* Mensaje de carga mientras se inicia el avatar */}
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 z-20">
              <div className="flex flex-col items-center space-y-4">
                {/* Spinner animado */}
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-neutral-600 border-t-white rounded-full animate-spin"></div>
                </div>
                {/* Texto principal */}
                <div className="text-white text-2xl font-semibold">
                  Connecting...
                </div>
                {/* Texto descriptivo */}
                <div className="text-neutral-400 text-sm text-center max-w-xs px-4">
                  Loading up your avatar now for a realtime interactive experience
                </div>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full object-cover pointer-events-none"
            autoPlay
            playsInline
          />
          {ready && (
            <button
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-md ring-1 ring-white/30
                          ${recActive ? 'bg-red-600 text-white' : (avatarTalking || cooldownActive) ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-white text-black'}`}
              title={(avatarTalking || cooldownActive) ? 'Espera a que el avatar termine…' : 'Mantén pulsado para hablar'}
              disabled={avatarTalking || cooldownActive}
              onPointerDown={(e)=>{ e.preventDefault(); if (avatarTalking || cooldownActive) return; try { (e.currentTarget as any).setPointerCapture?.(e.pointerId) } catch {}; startRecord() }}
              onPointerUp={(e)=>{ e.preventDefault(); if (avatarTalking || cooldownActive) return; stopRecordAndSend(); try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId) } catch {} }}
              onPointerCancel={(e)=>{ e.preventDefault(); if (!(avatarTalking || cooldownActive)) stopRecordAndSend() }}
              onPointerLeave={(e)=>{ e.preventDefault(); if (!(avatarTalking || cooldownActive) && recActive) stopRecordAndSend() }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Log para debug - puedes ocultarlo después */}
        <pre className="mt-3 max-h-36 overflow-auto text-xs text-neutral-300 bg-neutral-900/50 p-2 rounded">{log.join('\n')}</pre>
      </div>
    </div>
  )
}