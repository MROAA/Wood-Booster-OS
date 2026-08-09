import { useEffect, useState } from "react"

import { apiGet, apiPost, apiPut } from "../api/client"

function draftStatusLabel(status) {
  if (status === "approved") {
    return "Hyväksytty"
  }

  if (status === "published") {
    return "Julkaistu"
  }

  if (status === "publish_failed") {
    return "Julkaisu epäonnistui"
  }

  return "Luonnos"
}

function BlogStudioTab({ projectId }) {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [selectedDraftId, setSelectedDraftId] = useState(null)

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")

  const activeDraft =
    drafts.find(draft => draft.id === selectedDraftId) || null

  function loadDraftIntoForm(draft) {
    setTitle(draft?.title || "")
    setContent(draft?.content || "")
    setExcerpt(draft?.excerpt || "")
  }

  function selectDraft(draftId) {
    setSelectedDraftId(draftId)

    loadDraftIntoForm(
      drafts.find(draft => draft.id === draftId) || null,
    )
  }

  useEffect(() => {
    if (!projectId) {
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setErrorMessage("")

        const draftsData = await apiGet(
          `/projects/${projectId}/blog-drafts`,
        )

        if (cancelled) {
          return
        }

        const draftList = Array.isArray(draftsData) ? draftsData : []

        setDrafts(draftList)

        if (draftList.length > 0) {
          setSelectedDraftId(draftList[0].id)
          loadDraftIntoForm(draftList[0])
        }
      } catch (loadError) {
        if (cancelled) {
          return
        }

        setErrorMessage(loadError.message)
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
  }, [projectId])

  async function generateDraft() {
    setGenerating(true)
    setErrorMessage("")

    try {
      const draft = await apiPost(
        `/projects/${projectId}/blog-drafts`,
        { useAI: true },
      )

      setDrafts(current => [draft, ...current])
      setSelectedDraftId(draft.id)
      loadDraftIntoForm(draft)
    } catch (generateError) {
      setErrorMessage(generateError.message)
    } finally {
      setGenerating(false)
    }
  }

  async function saveDraft() {
    if (!activeDraft) {
      return
    }

    setSaving(true)
    setErrorMessage("")

    try {
      const updated = await apiPut(
        `/blog-drafts/${activeDraft.id}`,
        {
          title,
          content,
          excerpt,
        },
      )

      setDrafts(current =>
        current.map(draft =>
          draft.id === updated.id ? updated : draft,
        ),
      )
    } catch (saveError) {
      setErrorMessage(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function approveDraft() {
    if (!activeDraft) {
      return
    }

    setSaving(true)
    setErrorMessage("")

    try {
      const updated = await apiPut(
        `/blog-drafts/${activeDraft.id}/approve`,
        {},
      )

      setDrafts(current =>
        current.map(draft =>
          draft.id === updated.id ? updated : draft,
        ),
      )
    } catch (approveError) {
      setErrorMessage(approveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function publishDraft() {
    if (!activeDraft) {
      return
    }

    setPublishing(true)
    setErrorMessage("")

    try {
      const updated = await apiPut(
        `/blog-drafts/${activeDraft.id}/publish`,
        {},
      )

      setDrafts(current =>
        current.map(draft =>
          draft.id === updated.id ? updated : draft,
        ),
      )
    } catch (publishError) {
      setErrorMessage(publishError.message)

      try {
        const refreshed = await apiGet(
          `/projects/${projectId}/blog-drafts`,
        )

        setDrafts(Array.isArray(refreshed) ? refreshed : [])
      } catch {
        // Alkuperäinen virhe on jo näytetty, ei tarvitse toista.
      }
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="panel p-6 text-sm text-[var(--wood-muted)]">
        Ladataan Blog Studiota...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
          Blog Studio
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          WordPress-blogikirjoituksen luonnos
        </h2>

        <p className="mt-2 text-[var(--wood-muted)]">
          AI kirjoittaa blogikirjoituksen projektin tietojen pohjalta.
          Mitään ei julkaista automaattisesti - tarkista ja hyväksy
          teksti ennen julkaisua.
        </p>

        {errorMessage && (
          <div className="mt-5 card border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={generateDraft}
          disabled={generating}
          className="mt-5 wb-button disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Luodaan luonnosta..." : "Luo uusi luonnos"}
        </button>
      </section>

      {drafts.length > 0 && (
        <section className="panel p-6">
          <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
            Luonnokset
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {drafts.map(draft => (
              <button
                key={draft.id}
                type="button"
                onClick={() => selectDraft(draft.id)}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  selectedDraftId === draft.id
                    ? "border-[var(--wood-accent)] text-[var(--wood-accent)]"
                    : "border-[var(--wood-border)] text-[var(--wood-muted)]"
                }`}
              >
                {draft.title || "(nimetön)"} ·{" "}
                {draftStatusLabel(draft.status)}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeDraft && (
        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Luonnos</h3>

            <span className="text-sm text-[var(--wood-muted)]">
              Tila: {draftStatusLabel(activeDraft.status)}
            </span>
          </div>

          {activeDraft.status === "published" &&
            activeDraft.wordpressPermalink && (
              <p className="mt-3 text-sm text-green-400">
                Julkaistu:{" "}
                <a
                  href={activeDraft.wordpressPermalink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {activeDraft.wordpressPermalink}
                </a>
              </p>
            )}

          {activeDraft.status === "publish_failed" &&
            activeDraft.publishError && (
              <p className="mt-3 text-sm text-red-300">
                Julkaisu epäonnistui: {activeDraft.publishError}
              </p>
            )}

          <label className="mt-5 block">
            <span className="text-sm text-[var(--wood-muted)]">
              Otsikko
            </span>

            <input
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="mt-2 wb-input"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm text-[var(--wood-muted)]">
              Sisältö
            </span>

            <textarea
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={10}
              className="mt-2 wb-input resize-y"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm text-[var(--wood-muted)]">
              Ote (valinnainen, WordPress-esikatselua varten)
            </span>

            <textarea
              value={excerpt}
              onChange={event => setExcerpt(event.target.value)}
              rows={2}
              className="mt-2 wb-input resize-y"
            />
          </label>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="wb-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Tallennetaan..." : "Tallenna muutokset"}
            </button>

            <button
              type="button"
              onClick={approveDraft}
              disabled={saving || activeDraft.status !== "draft"}
              className="wb-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activeDraft.status === "draft" ? "Hyväksy" : "Hyväksytty"}
            </button>

            <button
              type="button"
              onClick={publishDraft}
              disabled={
                publishing ||
                !["approved", "publish_failed"].includes(
                  activeDraft.status,
                )
              }
              className="wb-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing
                ? "Julkaistaan..."
                : activeDraft.status === "publish_failed"
                  ? "Yritä uudelleen"
                  : activeDraft.status === "published"
                    ? "Julkaistu"
                    : "Julkaise WordPressiin"}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default BlogStudioTab
