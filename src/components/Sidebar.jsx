import { NavLink } from "react-router"

const links = [
  { name: "Dashboard", path: "/", icon: "🏠" },
  { name: "Projects", path: "/projects", icon: "📦" },
  { name: "AI Agents", path: "/agents", icon: "🤖" },
  { name: "Knowledge", path: "/knowledge", icon: "📚" },
  { name: "Settings", path: "/settings", icon: "⚙️" },
]

function Sidebar() {
  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
          AI Workstation
        </p>

        <h1 className="mt-3 text-2xl font-bold">
          🪵 Wood-Booster
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Me jatkamme puun tarinaa.
        </p>
      </div>

      <nav className="mt-10 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-amber-500 text-neutral-950"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          System status
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-neutral-300">
            Workstation online
          </span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar