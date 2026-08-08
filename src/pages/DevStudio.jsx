import { useEffect, useState } from "react"

import { apiGet, apiPost, apiPut } from "../api/client"


const STATUS_LABELS = {
  draft: "Luonnos",
  approved: "Hyväksytty",
  written: "Kirjoitettu levylle",
  write_failed: "Kirjoitus epäonnistui",
}


function DevStudio() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [prompt, setPrompt] = useState("")
  const [filePath, setFilePath] = useState("")
  const [generating, setGenerating] = useState(false)

  const [busyDraftId, setBusyDraftId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setErrorMessage("")

        const draftsData = await apiGet("/python-drafts")

        if (cancelled) {
          return
        }

        setDrafts(Array.isArray(draftsData) ? draftsData : [])
      } catch (loadError) {
        if (!cancelled) {
          setErrorMessage(loadError.message)
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
  }, [])

  async function generateDraft() {
    if (!prompt.trim() || !filePath.trim()) {
      setErrorMessage("Kerro mitä skripti tekee ja anna sille tiedostonimi.")
      return
    }

    setGenerating(true)
    setErrorMessage("")

    try {
      const draft = await apiPost("/python-drafts", {
        useAI: true,
        prompt,
        filePath,
      })

      setDrafts(current => [draft, ...current])
      setPrompt("")
      setFilePath("")
    } catch (generateError) {
      setErrorMessage(generateError.message)
    } finally {
      setGenerating(false)
    }
  }

  function updateDraftInList(updated) {
    setDrafts(current =>
      current.map(draft => (draft.id === updated.id ? updated : draft)),
    )
  }

  async function updateCode(draft, code) {
    updateDraftInList({ ...draft, code })
  }

  async function saveDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}`, {
        code: draft.code,
        filePath: draft.filePath,
      })

      updateDraftInList(updated)
    } catch (saveError) {
      setErrorMessage(saveError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function approveDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/approve`, {})

      updateDraftInList(updated)
    } catch (approveError) {
      setErrorMessage(approveError.message)
    } finally {
      setBusyDraftId(null)
    }
  }

  async function writeDraft(draft) {
    setBusyDraftId(draft.id)
    setErrorMessage("")

    try {
      const updated = await apiPut(`/python-drafts/${draft.id}/write`, {})

      updateDraftInList(updated)
    } catch (writeError) {
      setErrorMessage(writeError.message)

      try {
        const refreshed = await apiGet("/python-drafts")

        setDrafts(Array.isArray(refreshed) ? refreshed : [])
      } catch {
        // ignore refresh failure, error message already shown
      }
    } finally {
      setBusyDraftId(null)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.25em]
          text-[var(--wood-accent)]
        ">
          Boosterverse
        </p>

        <h1 className="
          mt-2
          text-4xl
          font-bold
          text-[var(--wood-text)]
        ">
          🐍 Dev Studio
        </h1>

        <p className="
          mt-3
          max-w-3xl
          text-[var(--wood-muted)]
        ">
          Pyydä Python-koodia suomeksi, tarkista ja muokkaa
          tulosta, hyväksy, ja kirjoita levylle vasta sen jälkeen.
          Mitään ei koskaan kirjoiteta automaattisesti.
        </p>
      </header>

      {errorMessage && (
        <div className="
          rounded-xl
          border
          border-red-900
          bg-red-950/30
          p-4
          text-sm
          text-red-300
        ">
          {errorMessage}
        </div>
      )}

      <section className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      ">
        <h2 className="
          text-xl
          font-bold
          text-[var(--wood-text)]
        ">
          Uusi pyyntö
        </h2>

        <div className="mt-4 space-y-3">
          <label className="block text-sm text-[var(--wood-muted)]">
            Mitä skripti tekee?

            <textarea
              className="
                mt-1
                w-full
                rounded-xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-bg)]
                p-3
                text-[var(--wood-text)]
              "
              rows={3}
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              placeholder="Esim. kirjoita skripti joka muuttaa kansion tiedostonimet pieniksi kirjaimiksi"
            />
          </label>

          <label className="block text-sm text-[var(--wood-muted)]">
            Tiedostonimi

            <input
              className="
                mt-1
                w-full
                rounded-xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-bg)]
                p-3
                text-[var(--wood-text)]
              "
              value={filePath}
              onChange={event => setFilePath(event.target.value)}
              placeholder="esim. rename_lowercase.py"
            />
          </label>

          <button
            type="button"
            className="
              rounded-xl
              bg-[var(--wood-accent)]
              px-4
              py-2
              font-semibold
              text-[var(--wood-bg)]
              disabled:opacity-50
            "
            disabled={generating}
            onClick={generateDraft}
          >
            {generating ? "Kirjoitetaan..." : "Luo koodi"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--wood-text)]">
          Luonnokset
        </h2>

        {loading && (
          <p className="text-sm text-[var(--wood-muted)]">Ladataan...</p>
        )}

        {!loading && drafts.length === 0 && (
          <p className="text-sm text-[var(--wood-muted)]">
            Ei vielä luonnoksia.
          </p>
        )}

        {drafts.map(draft => (
          <DraftCard
            key={draft.id}
            draft={draft}
            busy={busyDraftId === draft.id}
            onCodeChange={code => updateCode(draft, code)}
            onSave={() => saveDraft(draft)}
            onApprove={() => approveDraft(draft)}
            onWrite={() => writeDraft(draft)}
          />
        ))}
      </section>
    </div>
  )
}


function DraftCard({ draft, busy, onCodeChange, onSave, onApprove, onWrite }) {
  return (
    <article className="
      rounded-2xl
      border
      border-[var(--wood-border)]
      bg-[var(--wood-panel)]
      p-5
    ">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--wood-text)]">
            {draft.title}
          </h3>

          <p className="mt-1 text-xs text-[var(--wood-muted)]">
            {draft.filePath}
          </p>
        </div>

        <StatusBadge status={draft.status} />
      </div>

      <textarea
        className="
          mt-4
          w-full
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-bg)]
          p-3
          font-mono
          text-xs
          text-[var(--wood-text)]
        "
        rows={10}
        value={draft.code}
        onChange={event => onCodeChange(event.target.value)}
        disabled={draft.status === "written"}
      />

      {draft.status === "write_failed" && draft.writeError && (
        <p className="mt-2 text-xs text-red-400">{draft.writeError}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            px-3
            py-1.5
            text-sm
            text-[var(--wood-text)]
            disabled:opacity-50
          "
          disabled={busy || draft.status === "written"}
          onClick={onSave}
        >
          Tallenna muokkaukset
        </button>

        <button
          type="button"
          className="
            rounded-xl
            border
            border-[var(--wood-border)]
            px-3
            py-1.5
            text-sm
            text-[var(--wood-text)]
            disabled:opacity-50
          "
          disabled={busy || draft.status !== "draft"}
          onClick={onApprove}
        >
          Hyväksy
        </button>

        <button
          type="button"
          className="
            rounded-xl
            bg-[var(--wood-accent)]
            px-3
            py-1.5
            text-sm
            font-semibold
            text-[var(--wood-bg)]
            disabled:opacity-50
          "
          disabled={
            busy ||
            (draft.status !== "approved" && draft.status !== "write_failed")
          }
          onClick={onWrite}
        >
          Kirjoita levylle
        </button>
      </div>
    </article>
  )
}


function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status

  const toneClass =
    status === "written"
      ? "border-emerald-900 bg-emerald-950/40 text-emerald-400"
      : status === "write_failed"
        ? "border-red-900 bg-red-950/40 text-red-400"
        : status === "approved"
          ? "border-cyan-900 bg-cyan-950/40 text-cyan-400"
          : "border-[var(--wood-border)] bg-[var(--wood-card)] text-[var(--wood-muted)]"

  return (
    <span
      className={`
        w-fit
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        ${toneClass}
      `}
    >
      ● {label}
    </span>
  )
}


export default DevStudio
