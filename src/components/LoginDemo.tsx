'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoginDemoProps {
  onClose: () => void
}

export default function LoginDemo({ onClose }: LoginDemoProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Credenciales hardcoded para demo
    if (username.toLowerCase() === 'gapply' && password === 'demo') {
      // Assessment ID completo de Gapply con 129 respuestas
      const GAPPLY_ASSESSMENT_ID = 'b4b63b9b-4412-4628-8a9a-527b0696426a'
      
      // Guardar en localStorage
      localStorage.setItem('dts_assessment_id', GAPPLY_ASSESSMENT_ID)
      
      // Pequeña pausa para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirigir al diagnóstico
      router.push('/diagnostico-full')
    } else {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎯 Login Demo
          </h2>
          <p className="text-sm text-gray-600">
            Accede al diagnóstico completo de Gapply
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Usuario */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Gapply"
              required
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="demo"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botón submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Cargando...' : '✨ Acceder al Diagnóstico'}
          </button>
        </form>

        {/* Info adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 <strong>Credenciales demo:</strong><br />
            Usuario: Gapply | Contraseña: demo
          </p>
        </div>
      </div>
    </div>
  )
}
