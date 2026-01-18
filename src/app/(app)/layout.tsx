// src/app/(app)/layout.tsx
import AppSidebar from '@/components/shell/AppSidebar'
import RightAssistantPane from '@/components/shell/RightAssistantPane'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 3 columnas */}
      <div className="grid grid-cols-12">
        {/* Left */}
        <div className="col-span-2 min-w-[240px]">
          <AppSidebar />
        </div>

        {/* Center */}
        <main className="col-span-7 min-h-screen">
          <div className="mx-auto max-w-6xl px-6 py-6">
            {children}
          </div>
        </main>

        {/* Right */}
        <div className="col-span-3 min-w-[360px]">
          <RightAssistantPane />
        </div>
      </div>
    </div>
  )
}
