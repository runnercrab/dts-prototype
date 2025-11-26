'use client'

import { useState } from 'react'
import Image from 'next/image'
import LoginDemo from '@/components/LoginDemo'

export default function Header() {
  const [showLoginDemo, setShowLoginDemo] = useState(false)

  return (
    <>
      {/* Header fijo con botón Login Demo */}
      <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="/">
            <Image 
              src="/gapply-logo.png" 
              alt="Gapply - Transformación Digital" 
              width={150} 
              height={150}
              className="object-contain"
              priority
            />
          </a>
          
          {/* Navegación + Login Demo */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-gray-600 hover:text-gray-900 transition-colors">
                Inicio
              </a>
              <a href="/diagnostico-full" className="text-gray-600 hover:text-gray-900 transition-colors">
                Diagnóstico
              </a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
            </nav>
            
            {/* Botón Login Demo */}
            <button
              onClick={() => setShowLoginDemo(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              🔑 Login Demo
            </button>
          </div>
        </div>
      </div>

      {/* Modal Login Demo */}
      {showLoginDemo && (
        <LoginDemo onClose={() => setShowLoginDemo(false)} />
      )}
    </>
  )
}
