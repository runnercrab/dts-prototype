'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav 
      className="navbar sticky top-0 bg-white shadow-md"
      style={{ zIndex: 9999 }}
    >
      <div className="navbar-brand">
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
      </div>
      <div className="navbar-menu">
        <Link href="/">Inicio</Link>
        <Link href="/diagnostico-full">Diagnóstico</Link>
        <Link href="/contacto">Contacto</Link>
      </div>
    </nav>
  )
}
