'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav
      className="w-full bg-white border-b border-gray-100 sticky top-0 shadow-sm"
      style={{ zIndex: 9999 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo (SIEMPRE vuelve a /) */}
        <Link href="/" className="flex items-center">
          <Image
            src="/gapply-logo.png"
            alt="Gapply - Transformación Digital"
            width={120}
            height={120}
            className="object-contain"
            priority
          />
        </Link>

        {/* Navegación */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA principal: Empezar diagnóstico */}
          <Link
            href="/start"
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-all"
          >
            Empieza tu diagnóstico
          </Link>
        </div>
      </div>
    </nav>
  )
}
