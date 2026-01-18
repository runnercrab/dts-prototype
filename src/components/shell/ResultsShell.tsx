// src/components/shell/ResultsShell.tsx
import React from "react";

export default function ResultsShell({
  left,
  children,
  right,
}: {
  left: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid grid-cols-[256px,1fr] lg:grid-cols-[256px,1fr,384px]">
        {/* LEFT */}
        <aside className="sticky top-0 h-screen border-r border-slate-200 bg-white">
          <div className="h-full overflow-y-auto">{left}</div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0">
          <div className="px-6 py-8 lg:px-8">{children}</div>
        </main>

        {/* RIGHT */}
        <aside className="hidden lg:block sticky top-0 h-screen border-l border-slate-200 bg-white">
          <div className="h-full overflow-y-auto p-4">{right ?? null}</div>
        </aside>
      </div>
    </div>
  );
}
