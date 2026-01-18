// src/components/shell/RightAssistantPane.tsx
"use client";

import AvatarPane from "@/components/AvatarPane";
import AssistantChat from "@/components/AssistantChat";

export default function RightAssistantPane() {
  return (
    <aside className="w-[560px] bg-white border-l border-slate-200 fixed right-0 top-0 bottom-0 overflow-y-auto z-40">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">Tu asistente</h2>
        <p className="text-xs text-slate-500 mt-1">
          Pregúntame lo que necesites sobre el diagnóstico
        </p>
      </div>

      {/* Avatar Section */}
      <div className="p-4 border-b border-slate-200">
        <AvatarPane />
      </div>

      {/* Chat Section */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Chat</h3>
        <AssistantChat messages={[]} />
      </div>
    </aside>
  );
}