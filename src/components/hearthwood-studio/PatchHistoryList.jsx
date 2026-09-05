import { useEffect, useState } from "react"

import { apiGet, apiPost } from "../../api/client"

import UnifiedDiffView from "./UnifiedDiffView"
import { PATCH_STATUS_LABELS, PATCH_STATUS_TONE, RISK_TONE, REVERTABLE_STATUSES } from "./patchStatusLabels"

/*
 * Historia: GET /api/hearthwood-patchbay (?archived=) - jo
 * uusin-ensin järjestyksessä (auditStore.list). `reloadKey`-propin
 * muutos (parent kasvattaa sen jokaisen onnistuneen apply()-kutsun
 * jälkeen) laukaisee uudelleenhaun.
 */
function PatchHistoryList({ reloadKey, onReverted }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage("")

      try {
        const data = await apiGet("/hearthwood-patchbay?archived=false")

        if (!cancelled) {
          setRows(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  async function handleRevert(id) {
    if (!window.confirm("Peruuta tämä muutos ja palauta aiempi tila?")) {
      return
    }

    setBusyId(id)
    setErrorMessage("")

    try {
      await apiPost(`/hearthwood-patchbay/${id}/revert`, {})

      const refreshed = await apiGet("/hearthwood-patchbay?archived=false")

      setRows(Array.isArray(refreshed) ? refreshed : [])
      onReverted?.()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="wood-scroll h-full min-h-0 overflow-y-auto p-4 space-y-2">
      {loading && <div className="text-sm text-[var(--wood-muted)]">Ladataan historiaa...</div>}

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      {
        !loading && rows.length === 0 && !errorMessage && (
          <div className="text-sm text-[var(--wood-muted)]">Ei vielä yhtään muutosta.</div>
        )
      }

      {
        rows.map(row => (
          <div key={row.id} className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(previous => previous === row.id ? null : row.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--wood-card)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[var(--wood-text)]">{row.summary}</div>
                <div className="text-[11px] text-[var(--wood-muted)]">
                  {new Date(row.createdAt).toLocaleString("fi-FI")}
                </div>
              </div>

              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${RISK_TONE[row.risk] || ""}`}>
                {row.risk}
              </span>

              <span className={`shrink-0 text-xs ${PATCH_STATUS_TONE[row.status] || "text-[var(--wood-muted)]"}`}>
                {PATCH_STATUS_LABELS[row.status] || row.status}
              </span>
            </button>

            {
              expandedId === row.id && (
                <div className="space-y-2 border-t border-[var(--wood-border)] p-4">
                  <div className="text-xs text-[var(--wood-muted)]">
                    {(row.targetFiles || []).join(", ")}
                  </div>

                  <UnifiedDiffView diff={row.diff} />

                  {
                    row.qaResult && (
                      <div className="text-xs text-[var(--wood-muted)]">
                        lint: {row.qaResult.lint?.ok ? "✓" : "✗"} · build: {row.qaResult.build?.ok ? "✓" : "✗"}
                      </div>
                    )
                  }

                  {
                    REVERTABLE_STATUSES.has(row.status) && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => handleRevert(row.id)}
                        className="
                          rounded-full border border-red-900 px-3 py-1 text-xs font-medium
                          text-red-400 transition-opacity disabled:opacity-30
                          hover:bg-red-950/30
                        "
                      >
                        {busyId === row.id ? "Peruutetaan..." : "Peruuta"}
                      </button>
                    )
                  }
                </div>
              )
            }
          </div>
        ))
      }
    </div>
  )
}

export default PatchHistoryList
