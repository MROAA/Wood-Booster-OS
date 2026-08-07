import { useEffect, useState } from "react"

const API_URL = "http://localhost:3001/api"

function StatusRow({
  name,
  description,
  status,
  icon,
}) {
  const statusStyles = {
    ONLINE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    CONNECTED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    READY: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    ACTIVE: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    CHECKING: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    OFFLINE: "border-red-500/20 bg-red-500/10 text-red-400",
    ERROR: "border-red-500/20 bg-red-500/10 text-red-400",
    UNKNOWN: "border-neutral-700 bg-neutral-800 text-neutral-400",
  }

  const badgeStyle =
    statusStyles[status] || statusStyles.UNKNOWN

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">
          {name}
        </p>

        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {description}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${badgeStyle}`}
      >
        {status}
      </span>
    </div>
  )
}

function SystemStatus() {
  const [backendStatus, setBackendStatus] =
    useState("CHECKING")

  const [databaseStatus, setDatabaseStatus] =
    useState("CHECKING")

  const [backendMessage, setBackendMessage] =
    useState("Tarkistetaan yhteyttä")

  useEffect(() => {
    let isMounted = true

    async function checkSystems() {
      try {
        const healthResponse = await fetch(
          `${API_URL}/health`,
        )

        if (!healthResponse.ok) {
          throw new Error(
            `Backend vastasi tilakoodilla ${healthResponse.status}`,
          )
        }

        const healthData =
          await healthResponse.json()

        if (!isMounted) {
          return
        }

        setBackendStatus("ONLINE")
        setBackendMessage(
          healthData.message ||
            healthData.service ||
            "API vastaa normaalisti",
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        setBackendStatus("OFFLINE")
        setBackendMessage(
          "Yhteyttä porttiin 3001 ei saatu",
        )

        setDatabaseStatus("UNKNOWN")
        return
      }

      try {
        const databaseResponse = await fetch(
          `${API_URL}/dashboard`,
        )

        if (!databaseResponse.ok) {
          throw new Error(
            `Tietokantatarkistus epäonnistui: ${databaseResponse.status}`,
          )
        }

        await databaseResponse.json()

        if (isMounted) {
          setDatabaseStatus("CONNECTED")
        }
      } catch (error) {
        if (isMounted) {
          setDatabaseStatus("ERROR")
        }
      }
    }

    checkSystems()

    const intervalId = window.setInterval(
      checkSystems,
      30000,
    )

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  const ollamaStatus =
    backendStatus === "ONLINE"
      ? "READY"
      : "UNKNOWN"

  const systems = [
    {
      name: "Backend API",
      description: backendMessage,
      status: backendStatus,
      icon: "⊞",
    },
    {
      name: "Database",
      description: "Prisma ja SQLite",
      status: databaseStatus,
      icon: "▤",
    },
    {
      name: "Ollama",
      description: "qwen2.5:7b · portti 11434",
      status: ollamaStatus,
      icon: "⬢",
    },
    {
      name: "Active Agent",
      description: "Valitaan automaattisesti viestin mukaan",
      status: "ACTIVE",
      icon: "⚡",
    },
  ]

  return (
    <div className="space-y-3">
      {systems.map((system) => (
        <StatusRow
          key={system.name}
          name={system.name}
          description={system.description}
          status={system.status}
          icon={system.icon}
        />
      ))}

      <p className="px-1 pt-1 text-xs text-neutral-600">
        Järjestelmän tila tarkistetaan automaattisesti
        30 sekunnin välein.
      </p>
    </div>
  )
}

export default SystemStatus
