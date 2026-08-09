import { useState } from "react"
import ChatPanel from "./ChatPanel"
function SpacemonkeyDrawer({ open, onClose }) {
  const [conversationId, setConversationId] = useState(null)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-[420px] h-full bg-[var(--wood-bg)] border-l border-[var(--wood-border)] flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--wood-text)]">
            🐵 Spacemonkey
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            conversationId={conversationId}
            setConversationId={setConversationId}
          />
        </div>
      </div>
    </div>
  )
}
export default SpacemonkeyDrawer