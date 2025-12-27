'use client'

import { useEffect, useRef, useState } from 'react'
import StreamingAvatar from '@heygen/streaming-avatar'
import bus from '../lib/bus'

const ENV_AVATAR =
  (process.env.NEXT_PUBLIC_HEYGEN_AVATAR_NAME || '').trim() || 'Shawn_Therapist_public'
const ENV_VOICE = (process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || '').trim()
const ENV_GREETING = (
  process.env.NEXT_PUBLIC_HEYGEN_GREETING ||
  'Hola, soy tu asesor digital de DTS. Mantén pulsado para hablar.'
).trim()

type PttState = 'idle' | 'arming' | 'recording'

declare global {
  interface Window {
    __DTS_LAST_CONSOLE_ERROR__?: any[]
  }
}

export default function AvatarPane() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const avatarRef = useRef<any>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const rawStreamRef = useRef<MediaStream | null>(null)
  const procStreamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<BlobPart[]>([])
  const recStartTsRef = useRef<number>(0)

  const avatarAudioCtxRef = useRef<AudioContext | null>(null)
  const avatarAnalyserRef = useRef<AnalyserNode | null>(null)
  const [avatarTalking, setAvatarTalking] = useState(false)

  const [ready, setReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const [pttState, setPttState] = useState<PttState>('idle')
  const [log, setLog] = useState<string[]>([])
  const append = (l: string) => setLog((s) => [...s.slice(-400), l])

  const cooldownUntilRef = useRef<number>(0)
  const [, setCooldownTick] = useState(0)
  const armCooldown = (ms: number) => {
    cooldownUntilRef.current = Date.now() + ms
    setTimeout(() => setCooldownTick((t) => t + 1), ms + 30)
  }

  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const INACTIVITY_TIMEOUT = 35 * 1000

  useEffect(() => {
    if (ready) {
      console.log(
        '🕐 Avatar listo, iniciando timer de inactividad:',
        INACTIVITY_TIMEOUT / 1000,
        'segundos'
      )

      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)

      inactivityTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Sesión cerrada por inactividad')
        closeSession()
      }, INACTIVITY_TIMEOUT)
    } else {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
        console.log('🔄 Timer de inactividad cancelado (ready=false)')
      }
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
        inactivityTimeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const restartInactivityTimer = () => {
    if (!ready) return
    console.log('🔄 Reiniciando timer de inactividad')

    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)

    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Sesión cerrada por inactividad')
      closeSession()
    }, INACTIVITY_TIMEOUT)
  }

  /**
   * ✅ CLAVE:
   * - Ignora SOLO el ruido de WebRTC/HeyGen
   * - NO normaliza args (para no ver "{}")
   * - Guarda el último error real en window.__DTS_LAST_CONSOLE_ERROR__
   */
  useEffect(() => {
    const orig = console.error

    console.error = (...args: any[]) => {
      try {
        if (typeof window !== 'undefined') {
          window.__DTS_LAST_CONSOLE_ERROR__ = args
        }

        const msg = args
          ?.map((a) => {
            if (typeof a === 'string') return a
            if (a instanceof Error) return a.message
            if (a && typeof a === 'object') return (a as any)?.message || ''
            return ''
          })
          .join(' ')

        if (/Unknown DataChannel error on (lossy|reliable)|RTCEngine\.handleDataError/i.test(msg)) {
          return
        }
      } catch {
        // si falla el parsing, NO bloquees el error
      }

      // 👇 IMPORTANTÍSIMO: delega TAL CUAL (sin convertir a {})
      orig(...args)
    }

    return () => {
      console.error = orig
      try {
        avatarRef.current?.stopAvatar?.()
      } catch {}
      stopAudio()
      stopAvatarMonitor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopAudio() {
    console.log('🛑 Deteniendo audio completamente...')

    try {
      if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop()
    } catch (e) {
      console.log('Error deteniendo recorder:', e)
    }

    recRef.current = null
    recChunksRef.current = []
    setPttState('idle')

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close()
        console.log('✅ AudioContext cerrado')
      } catch (e) {
        console.log('Error cerrando AudioContext:', e)
      }
    }
    audioCtxRef.current = null

    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log('✅ Pista de audio detenida:', track.label)
      })
      rawStreamRef.current = null
    }

    if (procStreamRef.current) {
      procStreamRef.current.getTracks().forEach((track) => track.stop())
      procStreamRef.current = null
    }

    console.log('✅ Audio completamente detenido')
  }

  function hookVideo(stream: MediaStream) {
    const v = videoRef.current
    if (!v) return
    // @ts-ignore
    v.srcObject = stream
    v.muted = false
    v.playsInline = true
    v.autoplay = true
    v.controls = false
    v.play().catch(() => {})
    startAvatarMonitor(stream)
  }

  function startAvatarMonitor(stream: MediaStream) {
    stopAvatarMonitor()
    try {
      const ctx = new AudioContext()
      avatarAudioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      avatarAnalyserRef.current = analyser
      src.connect(analyser)

      const PEAK_ON = 12,
        PEAK_OFF = 9,
        SILENCE_MS = 700
      const buf = new Uint8Array(analyser.frequencyBinCount)
      let talking = false,
        lastAboveTs = 0,
        lastState = false

      const loop = () => {
        if (!avatarAnalyserRef.current) return
        analyser.getByteTimeDomainData(buf)
        let peak = 0
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i] - 128)
          if (v > peak) peak = v
        }
        const now = performance.now()
        if (!talking) {
          if (peak >= PEAK_ON) {
            talking = true
            lastAboveTs = now
          }
        } else {
          if (peak >= PEAK_OFF) lastAboveTs = now
          if (now - lastAboveTs > SILENCE_MS) talking = false
        }
        if (talking !== lastState) {
          lastState = talking
          setAvatarTalking(talking)
          if (!talking) armCooldown(300)
        }
        if (avatarAnalyserRef.current) requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    } catch {}
  }

  function stopAvatarMonitor() {
    try {
      avatarAnalyserRef.current?.disconnect()
    } catch {}
    avatarAnalyserRef.current = null
    if (avatarAudioCtxRef.current) {
      try {
        avatarAudioCtxRef.current.close()
      } catch {}
    }
    avatarAudioCtxRef.current = null
    setAvatarTalking(false)
  }

  async function ensureMicChain() {
    console.log('🎤 Solicitando permisos de micrófono...')

    if (procStreamRef.current && rawStreamRef.current) {
      console.log('✅ Micrófono ya configurado')
      return
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = devices.filter((d) => d.kind === 'audioinput')

    console.log('🎤 Dispositivos de audio encontrados:', audioInputs.length)
    audioInputs.forEach((d) => console.log(`  - ${d.label} (${d.deviceId.substring(0, 20)}...)`))

    const builtInMic = audioInputs.find((d) => {
      const label = d.label.toLowerCase()
      return (
        (label.includes('built-in') ||
          label.includes('integrado') ||
          label.includes('macbook') ||
          label.includes('imac') ||
          label.includes('internal') ||
          label.includes('default') ||
          label === 'micrófono' ||
          label === 'microphone') &&
        !label.includes('iphone') &&
        !label.includes('ipad') &&
        !label.includes('airpods') &&
        !label.includes('bluetooth')
      )
    })

    if (builtInMic) console.log('✅ Micrófono integrado encontrado:', builtInMic.label)
    else console.log('⚠️ No se encontró micrófono integrado, usando el predeterminado')

    const base: MediaStreamConstraints = {
      audio: {
        ...(builtInMic && { deviceId: { exact: builtInMic.deviceId } }),
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: 48000,
      },
    }

    console.log('🎤 Solicitando acceso al micrófono...')
    const raw = await navigator.mediaDevices.getUserMedia(base)

    const track = raw.getAudioTracks()[0]
    const settings = track.getSettings()
    console.log('🎤 Micrófono activo:', track.label)
    console.log('🎤 Settings:', settings)

    const isExternal =
      track.label.toLowerCase().includes('iphone') ||
      track.label.toLowerCase().includes('ipad') ||
      track.label.toLowerCase().includes('continuity')

    if (isExternal) {
      console.warn('⚠️ Se detectó dispositivo externo vía Continuity')
      raw.getTracks().forEach((t) => t.stop())

      console.log('🔄 Reintentando con dispositivo predeterminado...')
      const fallbackConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        },
      }
      const fallbackRaw = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
      rawStreamRef.current = fallbackRaw
      console.log('✅ Usando dispositivo predeterminado:', fallbackRaw.getAudioTracks()[0].label)
    } else {
      rawStreamRef.current = raw
      console.log('✅ Permisos de micrófono obtenidos correctamente')
    }

    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    const src = ctx.createMediaStreamSource(rawStreamRef.current!)
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -28
    comp.knee.value = 22
    comp.ratio.value = 3.5
    comp.attack.value = 0.003
    comp.release.value = 0.25

    const dest = ctx.createMediaStreamDestination()
    src.connect(comp).connect(dest)
    procStreamRef.current = dest.stream

    console.log('✅ Cadena de audio configurada correctamente')
  }

  async function transcribeBlob(blob: Blob): Promise<{ text: string; lang: 'es' | 'other' }> {
    const fd = new FormData()
    fd.append('audio', blob, 'audio.webm')
    fd.append('lang', 'es')
    const r = await fetch('/api/stt', { method: 'POST', body: fd, cache: 'no-store' })
    if (!r.ok) return { text: '', lang: 'other' }
    const j = await r.json()
    const lang = j?.lang === 'es' ? 'es' : 'other'
    return { text: (j?.text || '').trim(), lang }
  }

  const isRecordingRef = useRef(false)

  async function startRecord() {
    console.log('🎤 Iniciando grabación...')

    if (isRecordingRef.current) {
      console.log('⚠️ Ya hay una grabación en curso')
      return
    }

    restartInactivityTimer()

    if (avatarTalking) return
    if (Date.now() < cooldownUntilRef.current) return

    isRecordingRef.current = true

    try {
      if (!procStreamRef.current || !rawStreamRef.current) {
        console.log('⚠️ El micrófono no está configurado. Esto no debería pasar.')
        isRecordingRef.current = false
        return
      }

      if (recRef.current && recRef.current.state !== 'inactive') return

      recChunksRef.current = []
      const mime =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((c) =>
          (window as any).MediaRecorder?.isTypeSupported?.(c)
        ) || 'audio/webm'

      const rec = new MediaRecorder(procStreamRef.current!, { mimeType: mime, bitsPerSecond: 128_000 })
      recRef.current = rec
      recStartTsRef.current = Date.now()
      setPttState('arming')

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) recChunksRef.current.push(e.data)
      }

      rec.onstart = () => {
        setPttState('recording')
        console.log('✅ Grabación iniciada')
      }

      rec.start(0)
    } catch (e) {
      console.error('❌ Error al iniciar grabación:', e)
      isRecordingRef.current = false
      setPttState('idle')
    }
  }

  async function stopRecordAndSend() {
    console.log('🛑 stopRecordAndSend llamado')

    if (!isRecordingRef.current) {
      console.log('⚠️ No hay grabación activa')
      return
    }

    const rec = recRef.current
    if (!rec || rec.state === 'inactive') {
      console.log('⚠️ Recorder ya estaba inactivo')
      setPttState('idle')
      isRecordingRef.current = false
      return
    }

    setPttState('idle')

    await new Promise<void>((res) => {
      rec.onstop = () => {
        console.log('✅ Grabación detenida')
        res()
      }
      try {
        rec.stop()
      } catch (e) {
        console.log('Error deteniendo recorder:', e)
        res()
      }
    })

    isRecordingRef.current = false

    const blob = new Blob(recChunksRef.current, {
      type: rec.mimeType.includes('webm') ? 'audio/webm' : 'audio/mp4',
    })
    recChunksRef.current = []
    console.log('🎵 Blob creado, tamaño:', blob.size)

    const { text, lang } = await transcribeBlob(blob)
    console.log('📝 Transcripción:', text, 'Lang:', lang)
    if (!text) return

    bus.emit('user:voice', { text })

    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
      cache: 'no-store',
    })
    const j = await r.json().catch(() => ({}))
    const reply = (j?.reply || '').trim() || 'Puedo ayudarte con el diagnóstico DTS.'
    console.log('💬 Respuesta del avatar:', reply)

    bus.emit('avatar:voice', { text: reply })

    try {
      await avatarRef.current?.speak({ text: reply, task_type: 'REPEAT', task_mode: 'SYNC' })
    } finally {
      armCooldown(2200)
    }
  }

  const start = async () => {
    console.log('1️⃣ Función start llamada')
    if (starting || ready) return
    setStarting(true)

    try {
      console.log('2️⃣ Obteniendo token...')
      const tr = await fetch('/api/heygen/token', { method: 'POST', cache: 'no-store' })
      const tj = await tr.json()
      if (!tr.ok || !tj?.token) {
        setStarting(false)
        return
      }

      console.log('2.5️⃣ Solicitando permisos de micrófono...')
      try {
        await ensureMicChain()
        console.log('✅ Permisos de micrófono obtenidos correctamente')
      } catch (e) {
        console.error('❌ Error obteniendo permisos de micrófono:', e)
        alert('⚠️ Necesitamos permisos de micrófono para usar el avatar. Por favor, permite el acceso.')
        setStarting(false)
        return
      }

      console.log('3️⃣ Creando avatar...')
      const avatar: any = new (StreamingAvatar as any)({ token: tj.token })
      avatarRef.current = avatar

      const on = (n: string, fn: any) => {
        try {
          avatar.on?.(n, fn)
        } catch {}
      }
      on('media_stream', (s: MediaStream) => hookVideo(s))
      on('mediaStream', (s: MediaStream) => hookVideo(s))
      on('AVATAR_START_TALKING', () => setAvatarTalking(true))
      on('AVATAR_STOP_TALKING', () => setAvatarTalking(false))

      const payload: any = {
        quality: 'high',
        avatarName: ENV_AVATAR,
        language: 'es',
        version: 'v1',
        ...(ENV_VOICE && { voice: { voiceId: ENV_VOICE, rate: 1.0 } }),
      }

      console.log('4️⃣ Iniciando avatar...')
      await avatar.createStartAvatar(payload)

      if (avatar.mediaStream) hookVideo(avatar.mediaStream)
      console.log('5️⃣ Avatar iniciado, estableciendo ready=true')
      setReady(true)

      try {
        console.log('6️⃣ Avatar hablando greeting...')
        await avatar.speak({ text: ENV_GREETING.slice(0, 120), task_type: 'REPEAT', task_mode: 'SYNC' })
      } finally {
        armCooldown(1000)
      }
    } finally {
      setStarting(false)
      console.log('7️⃣ Start completado')
    }
  }

  const closeSession = () => {
    console.log('🚪 Cerrando sesión del avatar...')
    setReady(false)

    stopAudio()
    stopAvatarMonitor()

    try {
      avatarRef.current?.stopAvatar?.()
      console.log('✅ Avatar cerrado')
    } catch (e) {
      console.log('Error cerrando avatar:', e)
    }

    avatarRef.current = null
    console.log('✅ Sesión cerrada completamente')
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
            <button className="btn" onClick={closeSession}>
              Close
            </button>
          )}
        </div>

        <div className="relative w-full h-[240px] rounded-xl border border-neutral-800 bg-black overflow-hidden">
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 z-20">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-neutral-600 border-t-white rounded-full animate-spin"></div>
                </div>
                <div className="text-white text-2xl font-semibold">Connecting...</div>
                <div className="text-neutral-400 text-sm text-center max-w-xs px-4">
                  Loading up your avatar now for a realtime interactive experience
                </div>
              </div>
            </div>
          )}

          <video ref={videoRef} className="w-full h-full object-cover pointer-events-none" autoPlay playsInline />

          {ready && (
            <button
              className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-md ring-1 ring-white/30
                ${
                  recActive
                    ? 'bg-red-600 text-white'
                    : avatarTalking || cooldownActive
                      ? 'bg-neutral-400 text-white cursor-not-allowed'
                      : 'bg-white text-black'
                }`}
              title={avatarTalking || cooldownActive ? 'Espera a que el avatar termine…' : 'Mantén pulsado para hablar'}
              disabled={avatarTalking || cooldownActive}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (avatarTalking || cooldownActive) return
                try {
                  ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
                } catch {}
                startRecord()
              }}
              onPointerUp={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (avatarTalking || cooldownActive) return
                stopRecordAndSend()
                try {
                  ;(e.currentTarget as any).releasePointerCapture?.(e.pointerId)
                } catch {}
              }}
              onPointerCancel={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!(avatarTalking || cooldownActive)) stopRecordAndSend()
              }}
              onPointerLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!(avatarTalking || cooldownActive) && recActive) stopRecordAndSend()
              }}
              onContextMenu={(e) => e.preventDefault()}
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H9v2h6v-2h-2v-2.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            </button>
          )}
        </div>

        <pre className="mt-3 max-h-36 overflow-auto text-xs text-neutral-300 bg-neutral-900/50 p-2 rounded">
          {log.join('\n')}
        </pre>
      </div>
    </div>
  )
}
