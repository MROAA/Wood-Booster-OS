import { useEffect, useState } from "react"

import { apiGet } from "../api/client"

import IdentityCard from "../components/spacemonkey/IdentityCard"
import PersonalityCard from "../components/spacemonkey/PersonalityCard"

import { adaptSpacemonkeyDashboard } from "../services/spacemonkeyDashboardAdapter"

function SpacemonkeyPersona() {
  const [core, setCore] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError("")

        const data = await apiGet("/spacemonkey/state")

        if (cancelled) {
          return
        }

        if (data.success) {
          setCore(adaptSpacemonkeyDashboard(data.data))
        } else {
          setError(
            data.error || "Spacemonkey-tilan lataaminen epäonnistui.",
          )
        }
      } catch (loadError) {
        if (cancelled) {
          return
        }

        setError(
          loadError.message || "Spacemonkey-tilan lataaminen epäonnistui.",
        )
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
          Spacemonkey
        </p>

        <h1 className="mt-2 text-2xl font-semibold">
          Kuka Spacemonkey on
        </h1>
      </header>

      {error && (
        <div className="panel p-6 text-red-400">
          {error}
        </div>
      )}

      {!core && !error && (
        <div className="panel p-6 text-sm text-[var(--wood-muted)]">
          Ladataan...
        </div>
      )}

      {core && (
        <div className="grid gap-6 lg:grid-cols-2">
          <IdentityCard identity={core?.identity} />
          <PersonalityCard persona={core?.persona} />
        </div>
      )}
    </div>
  )
}

export default SpacemonkeyPersona
