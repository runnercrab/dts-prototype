// src/components/shell/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

interface NavItemProps {
  href: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

function NavItem({ href, label, icon, disabled }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    !disabled && (pathname === href || pathname.startsWith(href + "/"));

  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      className={[
        "nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative",
        disabled
          ? "text-slate-400 cursor-not-allowed"
          : "text-slate-700 hover:bg-slate-50 hover:translate-x-0.5",
        isActive ? "bg-blue-50 text-blue-800 font-semibold" : "",
      ].join(" ")}
      onClick={(e) => disabled && e.preventDefault()}
    >
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-800 rounded-r" />
      )}
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function AppSidebar() {
  const params = useParams();
  const assessmentId = params?.assessmentId as string | undefined;

  // Rutas base (sin assessmentId)
  const baseRoutes = {
    diagnostico: "/diagnostico-full",
    resultados: "/resultados",
  };

  // Rutas con assessmentId (si existe)
  const assessmentRoutes = assessmentId
    ? {
        resumen: `/resultados/${assessmentId}`,
        frenos: `/resultados/${assessmentId}/frenos`,
        priorizacion: `/resultados/${assessmentId}/priorizacion`,
        cierre: `/resultados/${assessmentId}/cierre`,
        programas: `/resultados/${assessmentId}/ejecucion/programas`,
        matriz: `/resultados/${assessmentId}/ejecucion/matriz`,
        roadmap: `/resultados/${assessmentId}/ejecucion/roadmap`,
      }
    : null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 fixed left-0 top-0 bottom-0 overflow-y-auto z-40">
      {/* Logo */}
      <div className="px-4 py-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <span className="text-xl font-bold text-slate-900">Gapply</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="py-4 px-3">
        {/* Diagnóstico */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Diagnóstico
            </h3>
          </div>
          <div className="space-y-1">
            <NavItem
              href={baseRoutes.diagnostico}
              label="Evaluación"
              icon="📋"
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Resultados
            </h3>
          </div>
          <div className="space-y-1">
            {assessmentRoutes ? (
              <>
                <NavItem
                  href={assessmentRoutes.resumen}
                  label="Resumen"
                  icon="📊"
                />
                <NavItem
                  href={assessmentRoutes.frenos}
                  label="Frenos"
                  icon="⚠️"
                />
                <NavItem
                  href={assessmentRoutes.priorizacion}
                  label="Priorización"
                  icon="🎯"
                />
                <NavItem
                  href={assessmentRoutes.cierre}
                  label="Cierre"
                  icon="✅"
                />
              </>
            ) : (
              <NavItem
                href={baseRoutes.resultados}
                label="Ver resultados"
                icon="📊"
              />
            )}
          </div>
        </div>

        {/* Ejecución */}
        <div className="mb-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ejecución
            </h3>
          </div>
          <div className="space-y-1">
            {assessmentRoutes ? (
              <>
                <NavItem
                  href={assessmentRoutes.programas}
                  label="Programas"
                  icon="📅"
                />
                <NavItem
                  href={assessmentRoutes.matriz}
                  label="Matriz"
                  icon="📐"
                />
                <NavItem
                  href={assessmentRoutes.roadmap}
                  label="Roadmap"
                  icon="🗺️"
                />
              </>
            ) : (
              <div className="px-3 py-2 text-xs text-slate-400">
                Completa un diagnóstico para ver opciones de ejecución
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
          <div className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm">
            DA
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              David Arias
            </div>
            <div className="text-xs text-slate-500">CEO</div>
          </div>
        </div>
      </div>
    </aside>
  );
}