import { useEffect, useRef, useState } from "react"

import { apiGet, apiPost } from "../../api/client"

const RUN_OPTIONS = [10, 25, 50, 100]

/*
 * "Aja tasapainotesti" - erillinen omasta patchista, ks. plan A5:n
 * Balance-tuning flow. n=100 kestää ~5-7min (plan), joten tämä pollaa
 * GET /balance-test:ia sen sijaan että pitäisi HTTP-pyyntöä auki.
 * Yksi ajo kerrallaan koko palvelimelle (balanceRunner.js) - paikallinen
 * yhden käyttäjän työkalu, ei jono.
 */
function BalancePanel() {
  const [job, setJob] = useState(null)
  const [runs, setRuns] = useState(25)
  const [showRaw, setShowRaw] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const pollRef = useRef(null)

  function pollUntilDone() {
    clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const data = await apiGet("/hearthwood-patchbay/balance-test")

        setJob(data)

        if (data.status !== "running") {
          clearInterval(pollRef.current)
        }
      } catch {
        clearInterval(pollRef.current)
      }
    }, 4000)
  }

  useEffect(() => {
    // A run may already be in flight (or its last result still fresh)
    // from before this page mounted - e.g. a reload while it was
    // running. Pick it up instead of showing an empty panel.
    apiGet("/hearthwood-patchbay/balance-test")
      .then(data => {
        if (data.status && data.status !== "idle") {
          setJob(data)

          if (data.status === "running") {
            pollUntilDone()
          }
        }
      })
      .catch(() => {})

    return () => clearInterval(pollRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function start() {
    setErrorMessage("")

    try {
      const data = await apiPost("/hearthwood-patchbay/balance-test", { runs })

      setJob(data)
      pollUntilDone()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const running = job?.status === "running"

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[var(--wood-text)]">Tasapainotesti</div>

        <div className="flex items-center gap-2">
          <select
            value={runs}
            onChange={event => setRuns(Number(event.target.value))}
            disabled={running}
            className="h-8 rounded-full border border-[var(--wood-border)] bg-[var(--wood-bg)] px-2 text-xs text-[var(--wood-text)] outline-none disabled:opacity-50"
          >
            {RUN_OPTIONS.map(n => <option key={n} value={n}>{n} ajoa / komentaja</option>)}
          </select>

          <button
            type="button"
            disabled={running}
            onClick={start}
            className="
              rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
              px-3 py-1 text-xs font-medium text-[#17120c] transition-opacity
              disabled:cursor-not-allowed disabled:opacity-30
            "
          >
            {running ? "Käynnissä..." : "Aja tasapainotesti"}
          </button>
        </div>
      </div>

      <div className="text-[11px] text-[var(--wood-muted)]">
        {runs >= 100 ? "n=100 kestää noin 5-7 min." : "Ajaa " + runs + " simuloitua läpipeluuta per komentaja - kestää muutaman minuutin."}
      </div>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      {
        running && (
          <div className="text-xs text-amber-400">
            ⏳ Tasapainotesti käynnissä ({job.runs} ajoa / komentaja)...
          </div>
        )
      }

      {
        job?.status === "error" && (
          <div className="text-xs text-red-300">{job.error}</div>
        )
      }

      {
        job?.status === "done" && (
          <div className="space-y-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--wood-muted)]">
                  <th className="text-left font-normal">Komentaja</th>
                  <th className="text-right font-normal">Voitot</th>
                  <th className="text-right font-normal">%</th>
                </tr>
              </thead>
              <tbody>
                {
                  job.winRates.map(row => (
                    <tr key={row.character} className="border-t border-[var(--wood-border)]">
                      <td className="py-1 capitalize text-[var(--wood-text)]">{row.character}</td>
                      <td className="py-1 text-right text-[var(--wood-text)]">{row.wins}/{row.total}</td>
                      <td className="py-1 text-right font-mono text-[var(--wood-text)]">{row.pct}%</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <button
              type="button"
              onClick={() => setShowRaw(previous => !previous)}
              className="text-[11px] text-[var(--wood-muted)] underline hover:text-[var(--wood-text)]"
            >
              {showRaw ? "Piilota koko tuloste" : "Näytä koko tuloste"}
            </button>

            {
              showRaw && (
                <pre className="wood-scroll max-h-64 overflow-auto rounded-lg border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--wood-muted)]">
                  {job.raw}
                </pre>
              )
            }
          </div>
        )
      }
    </div>
  )
}

export default BalancePanel
