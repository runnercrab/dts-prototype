'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">D</div>
        <div>
          <span className="navbar-title">DTS</span>
          <span className="navbar-subtitle"> | Digital Transformation Score</span>
        </div>
      </div>
      <div className="navbar-menu">
        <Link href="/">Inicio</Link>
        <Link href="/dts-chat">Diagnóstico</Link>
        <Link href="#contacto">Contacto</Link>
      </div>
    </nav>
  )
}
