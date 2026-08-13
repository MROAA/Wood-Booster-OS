import {
  useEffect,
  useState
} from "react"

import {
  apiGet,
  apiPost,
} from "../../api/client"




function RestoreRow({ snapshot, onRestored }) {

  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState(null)

  async function runRestore(){

    try {

      setStatus("restoring")
      setError(null)

      const data = await apiPost(
        "/system/restore",
        { file: snapshot.file, confirm: true }
      )

      setStatus("success")
      setConfirming(false)
      onRestored(data)

    }
    catch(err){

      setStatus("error")
      setError(err.message)

    }

  }

  return (
    <div className="mt-2 flex items-center justify-between gap-3 text-sm">

      <div className="min-w-0">
        <p className="truncate">{snapshot.file}</p>
        <p className="text-xs text-[var(--wood-muted)]">
          {snapshot.created || snapshot.size || ""}
        </p>
      </div>

      {!confirming && (
        <button
          onClick={() => setConfirming(true)}
          disabled={status === "restoring"}
          className="shrink-0 rounded-lg border border-[var(--wood-border)] px-3 py-1 text-xs transition hover:scale-105"
        >
          Palauta
        </button>
      )}

      {confirming && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-red-400">Varma?</span>
          <button
            onClick={runRestore}
            disabled={status === "restoring"}
            className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-400 transition hover:scale-105"
          >
            {status === "restoring" ? "Palautetaan..." : "Vahvista"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={status === "restoring"}
            className="rounded-lg border border-[var(--wood-border)] px-3 py-1 text-xs"
          >
            Peru
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1 w-full text-xs text-red-400">{error}</p>
      )}

    </div>
  )

}




function SnapshotCard() {

  const [createStatus, setCreateStatus] = useState("idle")
  const [snapshot, setSnapshot] = useState(null)

  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)

  const [restoreResult, setRestoreResult] = useState(null)


  async function loadSnapshots(){

    try {

      setLoading(true)

      const data = await apiGet("/backups")

      if(data.success){
        setSnapshots(data.snapshots)
      }

    }
    catch(error){

      console.error(error)

    }
    finally {

      setLoading(false)

    }

  }


  useEffect(() => {

    loadSnapshots()

  }, [])


  async function createSnapshot(){

    try {

      setCreateStatus("creating")

      const data = await apiPost("/backup", {})

      if(data.success){

        setSnapshot(data)
        setCreateStatus("success")
        loadSnapshots()

      }
      else {

        setCreateStatus("error")

      }

    }
    catch(error){

      console.error(error)
      setCreateStatus("error")

    }

  }


  function handleRestored(data){

    setRestoreResult(data)
    loadSnapshots()

  }


  const glowStyle =
    createStatus === "success"
      ? "border-green-500 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.7)]"
      : createStatus === "creating"
        ? "border-yellow-500 text-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.7)]"
        : createStatus === "error"
          ? "border-red-500 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)]"
          : "border-[var(--wood-border)]"


  return (

    <section
      className={`
        card
        p-6
        wood-hover
        transition-all
        duration-500
        ${glowStyle}
      `}
    >

      <h2>System Snapshot</h2>

      <p className="mt-2 text-sm text-[var(--wood-muted)]">
        Luo ja palauta Wood-Booster HQ -varmuuskopioita
      </p>

      <button
        onClick={createSnapshot}
        disabled={createStatus === "creating"}
        className="mt-5 rounded-xl border border-[var(--wood-accent)] px-5 py-2 transition hover:scale-105"
      >
        {createStatus === "creating" ? "Creating..." : "Create Snapshot"}
      </button>

      {createStatus === "success" && snapshot && (
        <div className="mt-5 space-y-2 text-sm">
          <p className="text-green-400">● Snapshot created</p>
          <p className="text-[var(--wood-muted)]">{snapshot.file}</p>
        </div>
      )}

      {createStatus === "error" && (
        <p className="mt-5 text-red-400">Snapshot failed</p>
      )}

      {restoreResult && (
        <div className="mt-5 space-y-1 text-sm">
          <p className="text-green-400">● Restore completed</p>
          <p className="text-[var(--wood-muted)]">
            Palautettu: {restoreResult.restoredFrom}
          </p>
          <p className="text-[var(--wood-muted)]">
            Turvakopio ennen palautusta: {restoreResult.safetyBackup}
          </p>
          <p className="text-xs text-[var(--wood-muted)]">
            Käynnistä palvelin uudelleen jos backend-tiedostoja palautui.
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-[var(--wood-border)] pt-4">

        <p className="text-sm text-[var(--wood-muted)]">Varmuuskopiot</p>

        {loading && (
          <p className="mt-2 text-sm">Ladataan...</p>
        )}

        {!loading && snapshots.length === 0 && (
          <p className="mt-2 text-sm text-[var(--wood-muted)]">
            Ei varmuuskopioita
          </p>
        )}

        {!loading && snapshots.map(item => (
          <RestoreRow
            key={item.file}
            snapshot={item}
            onRestored={handleRestored}
          />
        ))}

      </div>

    </section>

  )

}




export default SnapshotCard
