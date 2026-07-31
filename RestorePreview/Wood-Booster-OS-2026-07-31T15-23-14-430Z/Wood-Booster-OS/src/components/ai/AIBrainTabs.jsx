const tabs = [
  {
    id: "chat",
    name: "Chat",
    icon: "💬",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    icon: "📚",
  },
  {
    id: "memory",
    name: "Memory",
    icon: "🧠",
  },
  {
    id: "agents",
    name: "Agents",
    icon: "🤖",
  },
  {
    id: "tools",
    name: "Tools",
    icon: "🛠️",
  },
]

function AIBrainTabs({
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={
            activeTab === tab.id
              ? "rounded-xl bg-amber-500 px-4 py-3 font-semibold text-neutral-950"
              : "rounded-xl px-4 py-3 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          }
        >
          {tab.icon} {tab.name}
        </button>
      ))}
    </div>
  )
}

export default AIBrainTabs
