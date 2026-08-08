import { useEffect, useState } from "react"
import StatusGlow from "./StatusGlow"

const GITGUARDIAN_BASE = "http://localhost:8002/api/gitguardian"

function GitGuardianCard() {
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [backupResult, setBackupResult] = useState(null)
  const [restoringCommit, setRestoringCommit] = useState(null)
  const [restoreResult, setRestoreResult] = useState(null)

  async function loadStatus() {
    try {
      const res = await fetch(`${GITGUARDIAN_BASE}/status`)
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ online: false, error: error.message })
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch(`${GITGUARDIAN_BASE}/history`)
      const data = await res.json()
      setHistory(data.history || [])
    } catch (error) {
      setHistory([])
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  async function backupNow() {
    try {
      setBackingUp(true)
      setBackupResult(null)
      const res = await fetch(`${GITGUARDIAN_BASE}/backup`, { method: "POST" })
      const data = await res.json()
      setBackupResult(data)
      await loadStatus()
      if (showHistory) {
        await loadHistory()
      }
    } catch (error) {
      setBackupResult({ success: false, message: error.message })
    } finally {
      setBackingUp(false)
    }
  }

  async function toggleHistory() {
    if (!showHistory) {
      await loadHistory()
    }
    setShowHistory(!showHistory)
  }

  async function restoreToCommit(commit) {
    const confirmed = window.confirm(
      `Palautetaanko järjestelmä committiin ${commit}? Nykyiset tallentamattomat muutokset varmuuskopioidaan ensin automaattisesti.`
    )
    if (!confirmed) {
      return
    }

    try {
      setRestoringCommit(commit)
      setRestoreResult(null)
      const res = await fetch(`${GITGUARDIAN_BASE}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commit }),
      })
      const data = await res.json()
      setRestoreResult(data)
      await loadStatus()
      await loadHistory()
    } catch (error) {
      setRestoreResult({ success: false, message: error.message })
    } finally {
      setRestoringCommit(null)
    }
  }

  const isUnsafe = status?.online && status?.security?.safe === false
  const isStable = status?.online && !isUnsafe && status?.is_dirty === false

  const protectionStatus = isUnsafe ? "error" : isStable ? "healthy" : "warning"
  const protectionLabel = isUnsafe ? "AT RISK" : isStable ? "ACTIVE" : "PENDING"

  const backupButtonStyle = isUnsafe
    ? "border-red-700 text-red-400 bg-red-950/20"
    : isStable
      ? "border-green-700 text-green-400 bg-green-950/20"
      : "border-[var(--wood-border)]"

  return (
    <section className="p-6 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-panel)] space-y-4">
      <h2 className="text-lg font-semibold text-[var(--wood-text)]">
        🛡 Git Guardian
      </h2>

      {!status && (
        <p className="text-sm text-gray-400">Ladataan...</p>
      )}

      {status && !status.online && (
        <p className="text-sm text-gray-400">
          {status.error || "Git Guardian ei ole tavoitettavissa."}
        </p>
      )}

      {status && status.online && (
        <div className="space-y-3 text-sm">
          <div>
            Branch:
            {" "}
            {status.branch}
          </div>

          <div>
            Muutokset:
            {" "}
            {status.changes}
          </div>

          <StatusGlow
            label="Protection"
            value={protectionLabel}
            status={protectionStatus}
          />

          {isUnsafe && status.security?.risks?.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-black/10">
              <div className="text-red-400">Turvallisuusriskit havaittu:</div>
              {status.security.risks.map((risk, index) => (
                <div key={index} className="mt-1">
                  {risk.file} — {risk.reason}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={backupNow}
              disabled={backingUp || !status.is_dirty}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors duration-300 ${backupButtonStyle}`}
            >
              {backingUp
                ? "Varmuuskopioidaan..."
                : isStable
                  ? "✓ Vakaa"
                  : "Backup Now"}
            </button>

            <button
              onClick={toggleHistory}
              className="px-4 py-2 rounded-lg border border-[var(--wood-border)] text-sm"
            >
              {showHistory ? "Hide History" : "View History"}
            </button>
          </div>

          {backupResult && (
            <div className="mt-3 p-3 rounded-lg bg-black/10">
              {backupResult.message}
            </div>
          )}

          {restoreResult && (
            <div className="mt-3 p-3 rounded-lg bg-black/10">
              {restoreResult.message}
            </div>
          )}

          {showHistory && (
            <div className="mt-3 space-y-2">
              {history && history.length === 0 && (
                <div className="text-gray-400">Ei vielä varmuuskopioita.</div>
              )}
              {history && history.slice().reverse().map((entry, index) => (
                <div key={index} className="p-3 rounded-lg bg-black/10 space-y-1">
                  <div>{entry.date}</div>
                  <div>
                    {entry.commit} — {entry.verified ? "Verified" : entry.status}
                  </div>
                  <div className="text-gray-400">
                    {entry.files?.length || 0} tiedostoa
                  </div>
                  {entry.verified && (
                    <button
                      onClick={() => restoreToCommit(entry.commit)}
                      disabled={restoringCommit === entry.commit}
                      className="mt-1 px-3 py-1 rounded-lg border border-[var(--wood-border)] text-xs"
                    >
                      {restoringCommit === entry.commit
                        ? "Palautetaan..."
                        : "Palauta tähän"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default GitGuardianCard
