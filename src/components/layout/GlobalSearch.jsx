import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  apiGet,
} from "../../api/client"

const systemPages = [
  {
    id: "workspace",
    type: "page",
    title: "AI Workspace",
    description:
      "Avaa AI Brain ja järjestelmän päätyötila.",
    icon: "⬢",
    path: "/",
    keywords:
      "workspace ai brain etusivu koti",
  },
  {
    id: "dashboard",
    type: "page",
    title: "Dashboard",
    description:
      "Avaa projektien ja liiketoiminnan yhteenveto.",
    icon: "▦",
    path: "/dashboard",
    keywords:
      "dashboard yhteenveto tilastot",
  },
  {
    id: "projects",
    type: "page",
    title: "Projects",
    description:
      "Avaa kaikki Wood-Booster-projektit.",
    icon: "▣",
    path: "/projects",
    keywords:
      "projektit projects tuotteet",
  },
  {
    id: "customers",
    type: "page",
    title: "Customers",
    description:
      "Avaa asiakkaat ja CRM.",
    icon: "◎",
    path: "/customers",
    keywords:
      "asiakkaat customers crm",
  },
  {
    id: "knowledge",
    type: "page",
    title: "Knowledge",
    description:
      "Avaa AI Brainin tietopankki.",
    icon: "◌",
    path: "/knowledge",
    keywords:
      "knowledge tieto tietopankki",
  },
  {
    id: "memory",
    type: "page",
    title: "Memory",
    description:
      "Avaa AI Brainin muisti.",
    icon: "◈",
    path: "/memory",
    keywords:
      "memory muisti historia",
  },
  {
    id: "tools",
    type: "page",
    title: "Tools",
    description:
      "Avaa järjestelmän työkalut.",
    icon: "▨",
    path: "/tools",
    keywords:
      "tools työkalut",
  },
  {
    id: "agents",
    type: "page",
    title: "AI Agents",
    description:
      "Avaa AI Brainin agentit.",
    icon: "△",
    path: "/agents",
    keywords:
      "agents agentit tekoäly",
  },
  {
    id: "settings",
    type: "page",
    title: "Settings",
    description:
      "Avaa järjestelmän asetukset.",
    icon: "⚙",
    path: "/settings",
    keywords:
      "settings asetukset",
  },
]

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("fi-FI")
    .trim()
}

function getProjectPath(project) {
  return `/projects/${project.id}`
}

function getCustomerPath(customer) {
  return `/customers/${customer.id}`
}

function GlobalSearch({
  open,
  onClose,
}) {
  const navigate = useNavigate()

  const inputRef = useRef(null)

  const [query, setQuery] =
    useState("")

  const [projects, setProjects] =
    useState([])

  const [customers, setCustomers] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [selectedIndex, setSelectedIndex] =
    useState(0)

  useEffect(() => {
    if (!open) {
      return
    }

    setQuery("")
    setSelectedIndex(0)

    window.setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    async function loadSearchData() {
      setLoading(true)
      setError("")

      try {
        const [
          projectResponse,
          customerResponse,
        ] = await Promise.all([
          apiGet("/projects"),
          apiGet("/customers"),
        ])

        const nextProjects =
          Array.isArray(projectResponse)
            ? projectResponse
            : projectResponse?.projects ||
              []

        const nextCustomers =
          Array.isArray(customerResponse)
            ? customerResponse
            : customerResponse?.customers ||
              []

        setProjects(nextProjects)
        setCustomers(nextCustomers)
      } catch (loadError) {
        console.error(
          "Global search error:",
          loadError,
        )

        setError(
          "Projektien tai asiakkaiden hakeminen epäonnistui.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadSearchData()
  }, [open])

  const searchResults =
    useMemo(() => {
      const normalizedQuery =
        normalizeText(query)

      const projectResults =
        projects.map((project) => ({
          id: `project-${project.id}`,
          type: "project",
          title:
            project.name ||
            "Nimetön projekti",
          description: [
            project.customer?.name ||
              project.customer ||
              "",
            project.status || "",
          ]
            .filter(Boolean)
            .join(" • "),
          icon: "▣",
          path:
            getProjectPath(project),
          keywords: [
            project.name,
            project.status,
            project.notes,
            project.customer?.name,
            project.customer,
          ]
            .filter(Boolean)
            .join(" "),
        }))

      const customerResults =
        customers.map((customer) => ({
          id: `customer-${customer.id}`,
          type: "customer",
          title:
            customer.name ||
            customer.company ||
            "Nimetön asiakas",
          description: [
            customer.company,
            customer.email,
            customer.phone,
          ]
            .filter(Boolean)
            .join(" • "),
          icon: "◎",
          path:
            getCustomerPath(customer),
          keywords: [
            customer.name,
            customer.company,
            customer.email,
            customer.phone,
            customer.notes,
          ]
            .filter(Boolean)
            .join(" "),
        }))

      const allResults = [
        ...systemPages,
        ...projectResults,
        ...customerResults,
      ]

      if (!normalizedQuery) {
        return allResults.slice(0, 12)
      }

      return allResults
        .filter((result) => {
          const searchableText =
            normalizeText([
              result.title,
              result.description,
              result.keywords,
              result.type,
            ].join(" "))

          return searchableText.includes(
            normalizedQuery,
          )
        })
        .slice(0, 20)
    }, [
      customers,
      projects,
      query,
    ])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (
      selectedIndex >=
      searchResults.length
    ) {
      setSelectedIndex(0)
    }
  }, [
    searchResults,
    selectedIndex,
  ])

  function openResult(result) {
    if (!result?.path) {
      return
    }

    navigate(result.path)
    onClose()
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }

    if (
      event.key ===
      "ArrowDown"
    ) {
      event.preventDefault()

      setSelectedIndex(
        (currentIndex) =>
          searchResults.length
            ? (currentIndex + 1) %
              searchResults.length
            : 0,
      )

      return
    }

    if (
      event.key ===
      "ArrowUp"
    ) {
      event.preventDefault()

      setSelectedIndex(
        (currentIndex) =>
          searchResults.length
            ? (currentIndex -
                1 +
                searchResults.length) %
              searchResults.length
            : 0,
      )

      return
    }

    if (event.key === "Enter") {
      event.preventDefault()

      openResult(
        searchResults[
          selectedIndex
        ],
      )
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-start
        justify-center
        bg-black/75
        px-4
        pt-[10vh]
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <section
        className="
          w-full
          max-w-3xl
          overflow-hidden
          rounded-2xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
          shadow-2xl
          shadow-black/60
        "
        onKeyDown={
          handleKeyDown
        }
      >
        <header
          className="
            flex
            items-center
            gap-3
            border-b
            border-[var(--wood-border)]
            px-5
            py-4
          "
        >
          <span
            className="
              text-xl
              text-[var(--wood-muted)]
            "
          >
            ◌
          </span>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Hae projekteja, asiakkaita tai sivuja..."
            className="
              min-w-0
              flex-1
              bg-transparent
              text-lg
              text-[var(--wood-text)]
              outline-none
              placeholder:text-[var(--wood-muted)]
            "
          />

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              border
              border-[var(--wood-border)]
              px-2
              py-1
              text-xs
              font-medium
              text-[var(--wood-muted)]
              transition
              hover:bg-[var(--wood-card)]
              hover:text-[var(--wood-text)]
            "
          >
            ESC
          </button>
        </header>

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[var(--wood-border)]
            bg-[var(--wood-card)]
            px-5
            py-2
            text-xs
            text-[var(--wood-muted)]
          "
        >
          <span>
            ↑ ↓ valitse • Enter avaa
          </span>

          <span>
            {searchResults.length} tulosta
          </span>
        </div>

        <div
          className="
            max-h-[60vh]
            overflow-y-auto
            p-3
          "
        >
          {loading && (
            <div
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-card)]
                px-4
                py-5
                text-sm
                text-[var(--wood-muted)]
              "
            >
              <span
                className="
                  h-2
                  w-2
                  animate-pulse
                  rounded-full
                  bg-[var(--wood-accent)]
                "
              />

              Hakutietoja ladataan...
            </div>
          )}

          {!loading &&
            error && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-900
                  bg-red-950/30
                  px-4
                  py-5
                  text-sm
                  text-red-300
                "
              >
                {error}
              </div>
            )}

          {!loading &&
            !error &&
            searchResults.length ===
              0 && (
              <div
                className="
                  rounded-xl
                  border
                  border-[var(--wood-border)]
                  bg-[var(--wood-card)]
                  px-4
                  py-8
                  text-center
                "
              >
                <span
                  className="
                    text-3xl
                  "
                >
                  ◌
                </span>

                <p
                  className="
                    mt-3
                    font-medium
                    text-[var(--wood-text)]
                  "
                >
                  Ei hakutuloksia
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >
                  Kokeile toista
                  hakusanaa.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            searchResults.length >
              0 && (
              <div
                className="
                  space-y-1
                "
              >
                {searchResults.map(
                  (
                    result,
                    index,
                  ) => {
                    const selected =
                      index ===
                      selectedIndex

                    return (
                      <button
                        key={
                          result.id
                        }
                        type="button"
                        onClick={() =>
                          openResult(
                            result,
                          )
                        }
                        onMouseEnter={() =>
                          setSelectedIndex(
                            index,
                          )
                        }
                        className={`
                          flex
                          w-full
                          items-center
                          gap-4
                          rounded-xl
                          px-4
                          py-3
                          text-left
                          transition

                          ${
                            selected
                              ? "bg-[var(--wood-accent)] text-[#17120c]"
                              : "text-[var(--wood-text)] hover:bg-[var(--wood-card)]"
                          }
                        `}
                      >
                        <span
                          className={`
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            text-xl

                            ${
                              selected
                                ? "bg-black/10"
                                : "bg-[var(--wood-card)]"
                            }
                          `}
                        >
                          {
                            result.icon
                          }
                        </span>

                        <span
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <span
                            className="
                              block
                              truncate
                              font-semibold
                            "
                          >
                            {
                              result.title
                            }
                          </span>

                          <span
                            className={`
                              mt-1
                              block
                              truncate
                              text-xs

                              ${
                                selected
                                  ? "text-[#17120c]/65"
                                  : "text-[var(--wood-muted)]"
                              }
                            `}
                          >
                            {result.description ||
                              "Avaa näkymä"}
                          </span>
                        </span>

                        <span
                          className={`
                            shrink-0
                            rounded-full
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider

                            ${
                              selected
                                ? "bg-black/10 text-[#17120c]"
                                : "bg-[var(--wood-card)] text-[var(--wood-muted)]"
                            }
                          `}
                        >
                          {
                            result.type
                          }
                        </span>
                      </button>
                    )
                  },
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  )
}

export default GlobalSearch
