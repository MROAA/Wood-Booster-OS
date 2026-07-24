import { NavLink } from "react-router-dom"

const primaryLinks = [
  {
    name: "AI Workspace",
    description: "AI Brain ja työtila",
    path: "/",
    icon: "🧠",
    end: true,
  },
  {
    name: "Dashboard",
    description: "Tilannekuva ja luvut",
    path: "/dashboard",
    icon: "📊",
  },
  {
    name: "Projects",
    description: "Projektien hallinta",
    path: "/projects",
    icon: "📦",
  },
  {
    name: "Customers",
    description: "Asiakkaat ja CRM",
    path: "/customers",
    icon: "👥",
  },
]

const systemLinks = [
  {
    name: "Knowledge",
    description: "AI:n tietopankki",
    path: "/knowledge",
    icon: "📚",
  },
  {
    name: "Memory",
    description: "Tallennettu konteksti",
    path: "/memory",
    icon: "💾",
  },
  {
    name: "Capabilities",
    description: "Järjestelmän kyvykkyydet",
    path: "/capabilities",
    icon: "🧩",
  },
  {
    name: "Execution",
    description: "AI-ajot ja toimintajono",
    path: "/execution",
    icon: "▶️",
  },
  {
    name: "Tools",
    description: "Järjestelmän työkalut",
    path: "/tools",
    icon: "🛠️",
  },
  {
    name: "Settings",
    description: "Asetukset",
    path: "/settings",
    icon: "⚙️",
  },
]

function NavigationLink({
  link,
}) {
  return (
    <NavLink
      to={link.path}
      end={link.end}
      className={({ isActive }) => `
        group
        relative
        flex
        items-center
        gap-3
        rounded-xl
        border
        px-3
        py-3
        transition

        ${
          isActive
            ? "border-amber-500/40 bg-amber-500 text-black shadow-lg shadow-amber-500/10"
            : "border-transparent text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
        }
      `}
    >
      {({ isActive }) => (
        <>
          <span
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-lg
              transition

              ${
                isActive
                  ? "bg-black/10"
                  : "bg-neutral-800 group-hover:bg-neutral-700"
              }
            `}
          >
            {link.icon}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {link.name}
            </span>

            <span
              className={`
                mt-0.5
                block
                truncate
                text-xs

                ${
                  isActive
                    ? "text-black/60"
                    : "text-neutral-500"
                }
              `}
            >
              {link.description}
            </span>
          </span>

          {isActive && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-black/50" />
          )}
        </>
      )}
    </NavLink>
  )
}

function SidebarSection({
  title,
  links,
}) {
  return (
    <section>
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
        {title}
      </p>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavigationLink
            key={link.path}
            link={link}
          />
        ))}
      </nav>
    </section>
  )
}

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900 p-5">
      <header className="border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-2xl">
            🪵
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              Wood-Booster
            </h1>

            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-500">
              AI Operating System
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 flex-1 space-y-7 overflow-y-auto pr-1">
        <SidebarSection
          title="Workspace"
          links={primaryLinks}
        />

        <SidebarSection
          title="System"
          links={systemLinks}
        />
      </div>

      <footer className="mt-5">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>

              <span className="text-sm font-semibold text-white">
                Local AI
              </span>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Online
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-neutral-900 px-3 py-2">
              <p className="text-neutral-600">
                Runtime
              </p>

              <p className="mt-1 font-medium text-neutral-300">
                Ollama
              </p>
            </div>

            <div className="rounded-lg bg-neutral-900 px-3 py-2">
              <p className="text-neutral-600">
                Model
              </p>

              <p className="mt-1 font-medium text-neutral-300">
                Qwen 2.5
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-neutral-600">
            Järjestelmä toimii paikallisesti tällä tietokoneella.
          </p>
        </div>
      </footer>
    </aside>
  )
}

export default Sidebar
