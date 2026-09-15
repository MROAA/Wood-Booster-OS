import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import UnifiedDiffView from "./UnifiedDiffView"
import { PATCH_STATUS_LABELS, PATCH_STATUS_TONE, RISK_TONE } from "./patchStatusLabels"

/*
 * Marc (live): "haluan että tehdyt 'omin sanoin' näkyy kun klikkaan
 * unittia" - PatchHistoryList alhaalla näyttää KAIKKI patchit; tämä
 * suodattaa saman GET /hearthwood-patchbay -datan valitun entiteetin
 * omiin muutoksiin ja näyttää ne heti entiteettipaneelissa. editSpec
 * on jo parsittu oliomuotoon (auditStore.js), joten suodatus tehdään
 * lukemalla editSpec.ops[].path[0] === entityId - kattaa NL-box- ja
 * kenttäeditoripolut; wholeFile-muokkaukset (harvinaisia, ei tästä
 * UI:sta) eivät osu suodattimeen.
 */
function matchesEntity(row, entityId) {
  const ops = row.editSpec?.ops

  if (!Array.isArray(ops)) {
    return false
  }

  return ops.some(op => Array.isArray(op.path) && op.path[0] === entityId)
}

function EntityChangeLog({ entityId, reloadKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!entityId) {
      setRows([])
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)

      try {
        const data = await apiGet("/hearthwood-patchbay?archived=false")
        const all = Array.isArray(data) ? data : []

        if (!cancelled) {
          setRows(all.filter(row => matchesEntity(row, entityId)))
        }
      } catch {
        if (!cancelled) {
          setRows([])
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
  }, [entityId, reloadKey])

  if (!entityId) {
    return null
  }

  if (loading) {
    return <div className="text-xs text-[var(--wood-muted)]">Ladataan muutoshistoriaa...</div>
  }

  if (rows.length === 0) {
    return <div className="text-xs text-[var(--wood-muted)]">Ei vielä muutoksia tälle entiteetille.</div>
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        Tämän muutoshistoria ({rows.length})
      </div>

      {
        rows.map(row => (
          <div key={row.id} className="rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(previous => previous === row.id ? null : row.id)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[var(--wood-card)] transition-colors"
            >
              <span className="min-w-0 flex-1 truncate text-xs text-[var(--wood-text)]">{row.summary}</span>

              <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${RISK_TONE[row.risk] || ""}`}>
                {row.risk}
              </span>

              <span className={`shrink-0 text-[11px] ${PATCH_STATUS_TONE[row.status] || "text-[var(--wood-muted)]"}`}>
                {PATCH_STATUS_LABELS[row.status] || row.status}
              </span>
            </button>

            {
              expandedId === row.id && (
                <div className="border-t border-[var(--wood-border)] p-2">
                  <UnifiedDiffView diff={row.diff} />
                </div>
              )
            }
          </div>
        ))
      }
    </div>
  )
}

export default EntityChangeLog
