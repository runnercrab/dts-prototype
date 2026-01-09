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

        {/* Navegación vacía por ahora (header limpio) */}
        <div className="flex items-center gap-6">
          {/* Intencionadamente vacío */}
        </div>
      </div>
    </nav>
  )
}
