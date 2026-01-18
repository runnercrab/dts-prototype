// src/components/shell/AppShell3Cols.tsx
import SidebarNav from "@/components/shell/SidebarNav";
import AvatarPane from "@/components/AvatarPane";
import AssistantChat from "@/components/AssistantChat";

export default function AppShell3Cols({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Sidebar */}
          <aside className="col-span-12 lg:col-span-2">
            <div className="sticky top-4">
              <SidebarNav />
            </div>
          </aside>

          {/* Middle: Main */}
          <main className="col-span-12 lg:col-span-7">
            <div className="min-h-[calc(100vh-2rem)] rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6">{children}</div>
            </div>
          </main>

          {/* Right: Avatar + Chat */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900">
                  Copiloto
                </div>
                <div className="p-3">
                  <AvatarPane />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900">
                  Chat
                </div>
                <div className="p-3">
                  <AssistantChat messages={[]} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
