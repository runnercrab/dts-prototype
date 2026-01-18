'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function NavItem({
  href,
  label,
  disabled,
}: {
  href: string
  label: string
  disabled?: boolean
}) {
  const pathname = usePathname()
  const active = !disabled && (pathname === href || pathname.startsWith(href + '/'))

  return (
    <Link
      href={disabled ? '#' : href}
      aria-disabled={disabled ? true : undefined}
      className={[
        'block rounded-xl px-3 py-2 text-sm font-semibold transition',
        disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100',
        active ? 'bg-slate-100 text-slate-900' : '',
      ].join(' ')}
      onClick={(e) => {
        if (disabled) e.preventDefault()
      }}
    >
      {label}
    </Link>
  )
}

export default function AppSidebar() {
  // OJO: aquí ponemos rutas “canon” (las reales)
  // Marketing NO entra aquí, esto es solo (app)
  return (
    <aside className="h-screen sticky top-0 border-r border-slate-200 bg-white">
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="text-lg font-extrabold tracking-tight text-slate-900">
            Gapply
          </div>
          <div className="text-xs text-slate-500">
            Diagnóstico → Roadmap → Seguimiento
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          <div className="px-2 pt-2 pb-1 text-xs font-bold text-slate-400 uppercase">
            Flujo
          </div>

          <NavItem href="/diagnostico-full" label="1) Diagnóstico" />
          <NavItem href="/resultados" label="2) Resultados" />

          <div className="px-2 pt-4 pb-1 text-xs font-bold text-slate-400 uppercase">
            Ejecución
          </div>

          {/* Nota: estas existen por assessmentId, pero dejamos accesos genéricos;
             la navegación real se hace desde Resultados -> Ejecución */}
          <NavItem href="/resultados" label="Programas y acciones" />
          <NavItem href="/resultados" label="Matriz impacto-esfuerzo" />
          <NavItem href="/resultados" label="Roadmap" />

          <div className="px-2 pt-4 pb-1 text-xs font-bold text-slate-400 uppercase">
            Cuenta
          </div>
          <NavItem href="/start" label="Start (legacy)" disabled />
        </nav>

        {/* Footer user */}
        <div className="px-4 py-4 border-t border-slate-200">
          <div className="text-sm font-semibold text-slate-900">Usuario</div>
          <div className="text-xs text-slate-500">Demo / MVP</div>
        </div>
      </div>
    </aside>
  )
}
