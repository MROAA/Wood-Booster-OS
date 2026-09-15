import { useState } from "react"

import { apiGet } from "../../api/client"

/*
 * Terveystarkistus - nappi + vihreä/punainen lista GET /doctor:sta
 * (doctor.js). Puhtaasti lukeva, ei koskaan estä mitään - hyödyllinen
 * kun jokin (Ollama, Git Guardian) ei toimi odotetusti eikä ole
 * ilmeistä miksi apply/preview reagoi oudosti.
 */
function DoctorPanel() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function runCheck() {
    setLoading(true)
    setErrorMessage("")

    try {
      const data = await apiGet("/hearthwood-patchbay/doctor")
      setResult(data)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[var(--wood-text)]">Terveystarkistus</div>

        <button
          type="button"
          disabled={loading}
          onClick={runCheck}
          className="
            rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs
            text-[var(--wood-muted)] transition-opacity disabled:opacity-30
            hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]
          "
        >
          {loading ? "Tarkistetaan..." : "Aja tarkistus"}
        </button>
      </div>

      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      {
        result && (
          <div className="space-y-1.5">
            <div className={`text-xs font-semibold ${result.healthy ? "text-emerald-400" : "text-red-400"}`}>
              {result.healthy ? "● Kaikki kunnossa" : "● Jokin vaatii huomiota"}
            </div>

            {
              result.checks.map(check => (
                <div key={check.name} className="flex items-start justify-between gap-2 text-xs">
                  <span className={check.ok ? "text-emerald-400" : "text-red-400"}>
                    {check.ok ? "✓" : "✗"} {check.name}
                  </span>
                  <span className="text-right text-[var(--wood-muted)] truncate max-w-[55%]">{check.detail}</span>
                </div>
              ))
            }
          </div>
        )
      }
    </div>
  )
}

export default DoctorPanel
