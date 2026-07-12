const tabs = [
  {
    id: "overview",
    title: "Overview",
    icon: "📋",
  },
  {
    id: "materials",
    title: "Materials",
    icon: "🪵",
  },
  {
    id: "gallery",
    title: "Gallery",
    icon: "🖼️",
  },
  {
    id: "timeline",
    title: "Timeline",
    icon: "📅",
  },
  {
    id: "costs",
    title: "Costs",
    icon: "💰",
  },
  {
    id: "quote",
    title: "Quote",
    icon: "📄",
  },
  {
    id: "ai",
    title: "AI",
    icon: "🤖",
  },
  {
    id: "notes",
    title: "Notes",
    icon: "📝",
  },
]

function ProjectTabs({ activeTab, onChange }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 font-medium transition ${
              activeTab === tab.id
                ? "bg-amber-500 text-neutral-950"
                : "border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProjectTabs