import { useEffect, useState } from "react"
import { apiGet } from "../api/client"
import PulseCard from "../components/systemPulse/PulseCard"
import StatusGlow from "../components/systemPulse/StatusGlow"
import GitGuardianCard from "../components/systemPulse/GitGuardianCard"
import BuildGuardianCard from "../components/systemPulse/BuildGuardianCard"
import PythonSpacemonkeyCard from "../components/systemPulse/PythonSpacemonkeyCard"

// Same host/port Python Git Guardian uses elsewhere (GitGuardianCard.jsx) -
// fetched independently here (not lifted from that card, which keeps its
// own status private) so Next Action can react to "uncommitted changes"
// without duplicating GitGuardianCard's whole fetch/backup/history logic.
const GITGUARDIAN_BASE = "http://localhost:8002/api/gitguardian"

function getPulseStatus(status) {
  if (status === "healthy") return "healthy"
  if (status === "degraded" || status === "warning") return "warning"
  if (status === "error") return "error"
  return "warning"
}

function HQWidget() {
  const [pulse, setPulse] = useState(null)
  const [gitStatus, setGitStatus] = useState(null)
  const [backendOnline, setBackendOnline] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  async function loadPulse() {
    try {
      const pulseData = await apiGet("/system-pulse")
      if (pulseData.success) {
        const summary = pulseData.pulse.summary
        setPulse({
          status: pulseData.pulse.status,
          brain: {
            modules: summary.modules.total,
            activeModules: summary.modules.active,
          },
          build: pulseData.pulse.components?.lastKnownGood,
          python: pulseData.pulse.components?.pythonSpacemonkey,
        })
      }
      setBackendOnline(true)
    } catch (error) {
      setBackendOnline(false)
    }
  }

  async function loadGitStatus() {
    try {
      const res = await fetch(`${GITGUARDIAN_BASE}/status`)
      const data = await res.json()
      setGitStatus(data)
    } catch (error) {
      setGitStatus({ online: false })
    }
  }

  async function loadAll() {
    await Promise.all([loadPulse(), loadGitStatus()])
    setLastUpdate(new Date())
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 10000)
    return () => clearInterval(interval)
  }, [])

  const brainHealthy =
    pulse?.brain?.modules > 0 &&
    pulse?.brain?.modules === pulse?.brain?.activeModules

  const gitAtRisk = gitStatus?.online && gitStatus?.security?.safe === false
  const gitDirty = gitStatus?.online && gitStatus?.is_dirty

  let nextAction = "System healthy. Nothing needs your attention."
  let nextActionStatus = "healthy"

  if (backendOnline === false) {
    nextAction = "Backend is not responding. Start Wood-Booster OS and reopen this widget."
    nextActionStatus = "error"
  } else if (gitAtRisk) {
    nextAction = "Git Guardian flagged a security risk — check the Git Guardian card below."
    nextActionStatus = "error"
  } else if (pulse?.status && getPulseStatus(pulse.status) === "error") {
    nextAction = "System Pulse reports an error — open System Pulse for details."
    nextActionStatus = "error"
  } else if (gitDirty) {
    const count = gitStatus.changes
    nextAction = `${count} uncommitted change${count === 1 ? "" : "s"} in Wood-Booster OS. Consider backing up.`
    nextActionStatus = "warning"
  }

  return (
    <div
      className="
        h-screen
        overflow-y-auto
        bg-[var(--wood-bg)]
        text-[var(--wood-text)]
        p-4
        space-y-4
      "
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-[var(--wood-muted)]">
            WOOD-BOOSTER HQ
          </h1>
          <p className="text-xs text-[var(--wood-muted)] mt-1">
            Wood-Booster OS (main)
          </p>
        </div>
        <StatusGlow
          label="Backend"
          value={
            backendOnline === null
              ? "checking"
              : backendOnline
                ? "online"
                : "offline"
          }
          status={
            backendOnline === null
              ? "warning"
              : backendOnline
                ? "healthy"
                : "error"
          }
        />
      </header>

      <PulseCard title="Next Action">
        <p className="text-base leading-relaxed">{nextAction}</p>
      </PulseCard>

      <PulseCard title="System Status">
        <div className="flex flex-col gap-2">
          <StatusGlow
            label="System"
            value={pulse?.status || "-"}
            status={pulse?.status ? getPulseStatus(pulse.status) : "warning"}
          />
          <StatusGlow
            label="AI Brain"
            value={`${pulse?.brain?.activeModules || 0}/${pulse?.brain?.modules || 0}`}
            status={brainHealthy ? "healthy" : "warning"}
          />
        </div>
      </PulseCard>

      <GitGuardianCard />

      <BuildGuardianCard build={pulse?.build} />

      <PythonSpacemonkeyCard python={pulse?.python} />

      <button
        onClick={loadAll}
        className="
          w-full
          px-4
          py-2
          rounded-lg
          border
          border-[var(--wood-border)]
          text-xs
          text-[var(--wood-muted)]
        "
      >
        {lastUpdate
          ? `Refresh · updated ${lastUpdate.toLocaleTimeString()}`
          : "Refresh"}
      </button>
    </div>
  )
}

export default HQWidget
