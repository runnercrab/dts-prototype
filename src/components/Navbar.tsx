'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Image
          src="/gapply-icon.png"
          alt="Gapply"
          width={80}              // ← Mucho más grande (era 48)
          height={80}             // ← Mucho más grande
          className="rounded-lg"
          priority
        />
        <span className="navbar-title" style={{ fontSize: '1.75rem', fontWeight: '700' }}>
          Gapply
        </span>
      </div>
      <div className="navbar-menu">
        <Link href="/">Inicio</Link>
        <Link href="/dts-chat">Diagnóstico</Link>
        <Link href="#contacto">Contacto</Link>
      </div>
    </nav>
  )
}