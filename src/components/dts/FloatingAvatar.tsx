"use client";
import { useState } from "react";
import AvatarPane from "@/components/AvatarPane";
import AssistantChat from "@/components/AssistantChat";

const GAPPLY_BLUE = "#1a90ff";

export default function FloatingAvatar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">

      {/* ── Panel del avatar + chat ── */}
      {open && (
        <div
          className="w-[420px] md:w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[15px] font-semibold text-slate-700">Asistente Gapply</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Avatar */}
          <div className="shrink-0">
            <AvatarPane />
          </div>

          {/* Chat — scrollable */}
          <div className="flex-1 min-h-[200px] overflow-y-auto border-t border-slate-100">
            <AssistantChat />
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-all relative"
        style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.3)' }}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </button>
    </div>
  );
}