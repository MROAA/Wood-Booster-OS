import ChatPanel from "../components/ai/ChatPanel"
import VirtualWorkspacePanel from "../components/workspace/VirtualWorkspacePanel"

function ProjectWorkspace() {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      <div className="w-1/2 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-6 overflow-hidden">
        <ChatPanel />
      </div>
      <div className="w-1/2 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-6 overflow-hidden">
        <VirtualWorkspacePanel />
      </div>
    </div>
  )
}

export default ProjectWorkspace
