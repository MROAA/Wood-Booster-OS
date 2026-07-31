import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  useLocation,
  useNavigate,
} from "react-router-dom"

import Sidebar from "./Sidebar"

const commands = [
  {
    id: "workspace",
    label: "AI Workspace",
    description: "Avaa AI Brainin päätyötila",
    icon: "🧠",
    path: "/",
    keywords: [
      "workspace",
      "ai",
      "brain",
      "chat",
      "keskustelu",
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Avaa järjestelmän yleisnäkymä",
    icon: "📊",
    path: "/dashboard",
    keywords: [
      "dashboard",
      "etusivu",
      "tilanne",
      "yhteenveto",
    ],
  },
  {
    id: "projects",
    label: "Projects",
    description: "Avaa projektien hallinta",
    icon: "📦",
    path: "/projects",
    keywords: [
      "projects",
      "projektit",
      "projekti",
      "työt",
    ],
  },
  {
    id: "customers",
    label: "Customers",
    description: "Avaa asiakkaat ja CRM",
    icon: "👥",
    path: "/customers",
    keywords: [
      "customers",
      "asiakkaat",
      "asiakas",
      "crm",
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "Avaa AI Brainin tietopankki",
    icon: "📚",
    path: "/knowledge",
    keywords: [
      "knowledge",
      "tieto",
      "tietopankki",
      "dokumentit",
    ],
  },
  {
    id: "memory",
    label: "Memory",
    description: "Avaa järjestelmän muisti",
    icon: "💾",
    path: "/memory",
    keywords: [
      "memory",
      "muisti",
      "konteksti",
    ],
  },
  {
    id: "tools",
    label: "Tools",
    description: "Avaa AI-työkalut",
    icon: "🛠️",
    path: "/tools",
    keywords: [
      "tools",
      "työkalut",
      "toiminnot",
    ],
  },
  {
    id: "settings",
    label: "Settings",
    description: "Avaa järjestelmän asetukset",
    icon: "⚙️",
    path: "/settings",
    keywords: [
      "settings",
      "asetukset",
      "määritykset",
    ],
  },
]

function Layout({
  children,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const inputRef = useRef(null)

  const [paletteOpen, setPaletteOpen] =
    useState(false)

  const [searchTerm, setSearchTerm] =
    useState("")

  const [selectedIndex, setSelectedIndex] =
    useState(0)

  const filteredCommands = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase()

    if (!normalizedSearch) {
      return commands
    }

    return commands.filter((command) => {
      const searchableText = [
        command.label,
        command.description,
        ...command.keywords,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(
        normalizedSearch,
      )
    })
  }, [searchTerm])

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()

        setPaletteOpen((currentValue) => {
          const nextValue = !currentValue

          if (nextValue) {
            setSearchTerm("")
            setSelectedIndex(0)
          }

          return nextValue
        })
      }

      if (event.key === "Escape") {
        setPaletteOpen(false)
      }
    }

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown,
      )
    }
  }, [])

  useEffect(() => {
    if (!paletteOpen) {
      return
    }

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [paletteOpen])

  useEffect(() => {
    setPaletteOpen(false)
  }, [location.pathname])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchTerm])

  function closePalette() {
    setPaletteOpen(false)
    setSearchTerm("")
    setSelectedIndex(0)
  }

  function runCommand(command) {
    navigate(command.path)
    closePalette()
  }

  function handlePaletteKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault()

      setSelectedIndex((currentIndex) => {
        if (filteredCommands.length === 0) {
          return 0
        }

        return (
          (currentIndex + 1) %
          filteredCommands.length
        )
      })
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()

      setSelectedIndex((currentIndex) => {
        if (filteredCommands.length === 0) {
          return 0
        }

        return (
          currentIndex === 0
            ? filteredCommands.length - 1
            : currentIndex - 1
        )
      })
    }

    if (event.key === "Enter") {
      event.preventDefault()

      const selectedCommand =
        filteredCommands[selectedIndex]

      if (selectedCommand) {
        runCommand(selectedCommand)
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <Sidebar />

      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>

      <button
        type="button"
        onClick={() => {
          setSearchTerm("")
          setSelectedIndex(0)
          setPaletteOpen(true)
        }}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-300 shadow-2xl shadow-black/40 transition hover:border-amber-500/50 hover:bg-neutral-800 hover:text-white"
        aria-label="Avaa komentopaletti"
      >
        <span className="text-base">
          ⌕
        </span>

        <span>
          Command Palette
        </span>

        <span className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-500">
          Ctrl K
        </span>
      </button>

      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePalette()
            }
          }}
        >
          <section
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/70"
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
          >
            <header className="border-b border-neutral-800 p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl text-amber-500">
                  ⌕
                </span>

                <input
                  ref={inputRef}
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  onKeyDown={
                    handlePaletteKeyDown
                  }
                  type="text"
                  placeholder="Hae näkymää tai komentoa..."
                  className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-neutral-600"
                />

                <button
                  type="button"
                  onClick={closePalette}
                  className="rounded-lg border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                >
                  ESC
                </button>
              </div>
            </header>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {filteredCommands.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="font-medium text-white">
                    Komentoa ei löytynyt
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    Kokeile esimerkiksi projektit,
                    asiakkaat tai asetukset.
                  </p>
                </div>
              )}

              {filteredCommands.map(
                (command, index) => {
                  const selected =
                    index === selectedIndex

                  const active =
                    command.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(
                          command.path,
                        )

                  return (
                    <button
                      key={command.id}
                      type="button"
                      onMouseEnter={() =>
                        setSelectedIndex(index)
                      }
                      onClick={() =>
                        runCommand(command)
                      }
                      className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition ${
                        selected
                          ? "bg-amber-500 text-black"
                          : "text-neutral-300 hover:bg-neutral-800"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                          selected
                            ? "bg-black/10"
                            : "bg-neutral-800"
                        }`}
                      >
                        {command.icon}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">
                            {command.label}
                          </span>

                          {active && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                selected
                                  ? "bg-black/10 text-black"
                                  : "bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              Auki
                            </span>
                          )}
                        </span>

                        <span
                          className={`mt-1 block text-sm ${
                            selected
                              ? "text-black/70"
                              : "text-neutral-500"
                          }`}
                        >
                          {command.description}
                        </span>
                      </span>

                      <span
                        className={
                          selected
                            ? "text-black/60"
                            : "text-neutral-600"
                        }
                      >
                        Enter
                      </span>
                    </button>
                  )
                },
              )}
            </div>

            <footer className="flex flex-wrap items-center gap-4 border-t border-neutral-800 px-5 py-3 text-xs text-neutral-600">
              <span>↑ ↓ valitse</span>
              <span>Enter avaa</span>
              <span>Esc sulkee</span>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export default Layout
