import { useNavigate } from "react-router-dom"
const ICONS = [
  { label: "Dashboard", icon: "⌂", path: "/" },
  { label: "Projektit", icon: "▣", path: "/projects" },
  { label: "Asiakkaat", icon: "◎", path: "/customers" },
  { label: "Materiaalit", icon: "◇", path: "/inventory" },
  { label: "Ostot", icon: "▦", path: "/purchases" },
  { label: "Tarjoukset", icon: "▧", path: "/quotes" },
  { label: "Laskut", icon: "▥", path: "/invoices" },
  { label: "Knowledge", icon: "◌", path: "/knowledge" },
  { label: "Memory", icon: "◈", path: "/memory" },
  { label: "Agents", icon: "△", path: "/agents" },
  { label: "Settings", icon: "⚙", path: "/settings" },
  { label: "Spider-pasianssi", icon: "♤", path: "/spider-solitaire" },
]
function VirtualDesktop() {
  const navigate = useNavigate()
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--wood-accent)]">
          Työpöytä
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--wood-text)]">
          🖥 Virtuaalinen työpöytä
        </h1>
        <p className="mt-2 text-[var(--wood-muted)]">
          Pikakuvakkeet kaikkiin järjestelmän osiin.
        </p>
      </header>
      <section
        className="
          grid
          grid-cols-2
          sm:grid-cols-4
          md:grid-cols-6
          gap-6
          rounded-2xl
          border
          p-8
        "
        style={{
          borderColor: "var(--wood-border)",
          background: "var(--wood-panel)",
        }}
      >
        {ICONS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="
              flex
              flex-col
              items-center
              gap-2
              rounded-xl
              p-4
              transition
              hover:bg-[var(--wood-card)]
            "
          >
            <span className="text-4xl">{item.icon}</span>
            <span className="text-xs text-center text-[var(--wood-muted)]">
              {item.label}
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}
export default VirtualDesktop

Save (Ctrl+S).

Step 2: Add the route
code ~/Wood-Booster-AI/Wood-Booster-OS/src/App.jsx

Add this import near the other page imports (anywhere in that list, e.g. right after import SpiderSolitaire from "./pages/SpiderSolitaire"):

import VirtualDesktop from "./pages/VirtualDesktop"

Then add this new <Route> anywhere inside the <Route element={<OSLayout />}> block, alongside the others (e.g. right after the /spider-solitaire route):

        <Route
          path="/desktop"
          element={
            <VirtualDesktop />
          }
        />

Save (Ctrl+S).

Step 3: Add the sidebar button
code ~/Wood-Booster-AI/Wood-Booster-OS/src/components/layout/Sidebar.jsx

Find the first group in the groups array ("TYÖTILA"), which currently looks like:

  {
    title: "TYÖTILA",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "⌂"
      }
    ]
  },

Change it to include a second item:

  {
    title: "TYÖTILA",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "⌂"
      },
      {
        label: "Työpöytä",
        path: "/desktop",
        icon: "🖥"
      }
    ]
  },