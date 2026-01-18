// src/components/shell/CollapsibleSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

interface NavItemProps {
  href: string;
  label: string;
  icon: string;
  disabled?: boolean;
  collapsed: boolean;
}

function NavItem({ href, label, icon, disabled, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = !disabled && (pathname === href || pathname.startsWith(href + "/"));

  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      title={collapsed ? label : undefined}
      className={[
        "flex items-center gap-3 rounded-lg text-sm transition-all relative",
        collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5",
        disabled
          ? "text-slate-400 cursor-not-allowed"
          : "text-slate-700 hover:bg-slate-50",
        isActive ? "bg-blue-50 text-blue-800 font-semibold" : "",
      ].join(" ")}
      onClick={(e) => disabled && e.preventDefault()}
    >
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-800 rounded-r" />
      )}
      <span className="text-lg">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
}

function Section({ title, children, collapsed }: SectionProps) {
  return (
    <div className="mb-6">
      {!collapsed && (
        <div className="px-3 mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const params = useParams();
  const assessmentId = params?.assessmentId as string | undefined;

  const baseRoutes = {
    diagnostico: "/diagnostico-full",
    resultados: "/resultados",
  };

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
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={[
        "bg-white border-r border-slate-200 fixed left-0 top-0 bottom-0 overflow-y-auto z-40 transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      ].join(" ")}
    >
      {/* Logo */}
      <div className={["border-b border-slate-200", collapsed ? "px-3 py-4" : "px-4 py-6"].join(" ")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
            G
          </div>
          {!collapsed && <span className="text-xl font-bold text-slate-900">Gapply</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="py-4 px-2">
        <Section title="Diagnóstico" collapsed={collapsed}>
          <NavItem href={baseRoutes.diagnostico} label="Evaluación" icon="📋" collapsed={collapsed} />
        </Section>

        <Section title="Resultados" collapsed={collapsed}>
          {assessmentRoutes ? (
            <>
              <NavItem href={assessmentRoutes.resumen} label="Resumen" icon="📊" collapsed={collapsed} />
              <NavItem href={assessmentRoutes.frenos} label="Frenos" icon="⚠️" collapsed={collapsed} />
              <NavItem href={assessmentRoutes.priorizacion} label="Priorización" icon="🎯" collapsed={collapsed} />
              <NavItem href={assessmentRoutes.cierre} label="Cierre" icon="✅" collapsed={collapsed} />
            </>
          ) : (
            <NavItem href={baseRoutes.resultados} label="Ver resultados" icon="📊" collapsed={collapsed} />
          )}
        </Section>

        <Section title="Ejecución" collapsed={collapsed}>
          {assessmentRoutes ? (
            <>
              <NavItem href={assessmentRoutes.programas} label="Programas" icon="📅" collapsed={collapsed} />
              <NavItem href={assessmentRoutes.matriz} label="Matriz" icon="📐" collapsed={collapsed} />
              <NavItem href={assessmentRoutes.roadmap} label="Roadmap" icon="🗺️" collapsed={collapsed} />
            </>
          ) : (
            // DESPUÉS
            <div className={["text-xs text-blue-600 font-semibold", collapsed ? "hidden" : "px-3 py-2"].join(" ")}>
            Completa un diagnóstico primero
            </div>
          )}
        </Section>
      </nav>

      {/* User Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-2">
        <div className={["flex items-center gap-3 rounded-lg hover:bg-slate-50", collapsed ? "px-1 py-2 justify-center" : "px-3 py-2"].join(" ")}>
          <div className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
            DA
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">David Arias</div>
              <div className="text-xs text-slate-500">CEO</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}