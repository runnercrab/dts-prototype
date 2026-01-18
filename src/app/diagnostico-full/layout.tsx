// src/app/diagnostico-full/layout.tsx
import type { ReactNode } from "react";
import CollapsibleSidebar from "@/components/shell/CollapsibleSidebar";

export const dynamic = "force-dynamic";

export default function DiagnosticoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Left Sidebar - Collapsible */}
      <CollapsibleSidebar />

      {/* Main Content - Solo margen izquierdo */}
      {/* El avatar está integrado en el grid interno de la página */}
      <main className="ml-16 min-h-screen transition-all duration-200">
        {children}
      </main>

      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 m-4 text-center">
          <div className="text-4xl mb-4">💻</div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Versión de escritorio</h2>
          <p className="text-sm text-slate-600">
            Gapply funciona mejor en pantallas grandes.
          </p>
        </div>
      </div>
    </div>
  );
}