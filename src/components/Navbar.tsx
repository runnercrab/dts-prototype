'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LoginDemo from '@/components/LoginDemo'

export default function Navbar() {
  const [showLoginDemo, setShowLoginDemo] = useState(false)

  return (
    <>
      <nav 
        className="w-full bg-white border-b border-gray-100 sticky top-0 shadow-sm"
        style={{ zIndex: 9999 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <Image 
              src="/gapply-logo.png" 
              alt="Gapply - Transformación Digital" 
              width={120} 
              height={120}
              className="object-contain"
              priority
            />
          </Link>
          
          {/* Navegación + Login Demo */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Inicio
              </Link>
              <Link href="/diagnostico-full" className="text-gray-600 hover:text-gray-900 transition-colors">
                Diagnóstico
              </Link>
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
      </nav>

      {/* Modal Login Demo */}
      {showLoginDemo && (
        <LoginDemo onClose={() => setShowLoginDemo(false)} />
      )}
    </>
  )
}
