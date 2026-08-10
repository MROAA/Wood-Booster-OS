import ChatPanel from "../components/ai/ChatPanel"

function SpacemonkeyChat() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-[var(--wood-text)]">
          🐵 <span className="text-[var(--wood-accent)]">Spacemonkey</span>
        </h1>
      </header>
      <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-6">
        <ChatPanel />
      </div>
    </div>
  )
}

export default SpacemonkeyChat
