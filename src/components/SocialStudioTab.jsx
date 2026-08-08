import { useEffect, useState } from "react"

import { apiGet, apiPost, apiPut } from "../api/client"

const FILE_URL = "http://localhost:3001/uploads"

function isImage(file) {
  return Boolean(file.mimeType?.startsWith("image/"))
}

function isVideo(file) {
  return Boolean(file.mimeType?.startsWith("video/"))
}

function fileUrl(projectId, file) {
  return `${FILE_URL}/projects/${projectId}/${file.storedName}`
}

function thumbnailUrl(projectId, file) {
  return `${FILE_URL}/projects/${projectId}/${file.storedName}.thumb.jpg`
}

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

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
]

function SocialStudioTab({ projectId }) {
  const [drafts, setDrafts] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [selectedPlatform, setSelectedPlatform] = useState("instagram")

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copyLabel, setCopyLabel] = useState("Kopioi teksti")

  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [selectedFileIds, setSelectedFileIds] = useState([])

  const activeDraft =
    drafts.find(draft => draft.platform === selectedPlatform) || null

  function loadDraftIntoForm(draft) {
    setCaption(draft?.caption || "")
    setHashtags(draft?.hashtags || "")

    try {
      const parsedIds = JSON.parse(draft?.selectedFileIds || "[]")

      setSelectedFileIds(Array.isArray(parsedIds) ? parsedIds : [])
    } catch {
      setSelectedFileIds([])
    }
  }

  function selectPlatform(platform) {
    setSelectedPlatform(platform)

    loadDraftIntoForm(
      drafts.find(draft => draft.platform === platform) || null,
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

        const [draftsData, filesData] = await Promise.all([
          apiGet(`/projects/${projectId}/social-drafts`),
          apiGet(`/projects/${projectId}/files`),
        ])

        if (cancelled) {
          return
        }

        const draftList = Array.isArray(draftsData) ? draftsData : []

        setDrafts(draftList)
        setFiles(Array.isArray(filesData) ? filesData : [])

        loadDraftIntoForm(
          draftList.find(draft => draft.platform === "instagram") || null,
        )
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

  const mediaFiles = files.filter(
    file =>
      (isImage(file) || isVideo(file)) &&
      file.status !== "processing" &&
      file.status !== "failed",
  )

  async function generateDraft() {
    setGenerating(true)
    setErrorMessage("")

    try {
      const draft = await apiPost(
        `/projects/${projectId}/social-drafts`,
        { platform: selectedPlatform },
      )

      setDrafts(current => [draft, ...current])
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
        `/social-drafts/${activeDraft.id}`,
        {
          caption,
          hashtags,
          selectedFileIds,
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
        `/social-drafts/${activeDraft.id}/approve`,
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
        `/social-drafts/${activeDraft.id}/publish`,
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
          `/projects/${projectId}/social-drafts`,
        )

        setDrafts(Array.isArray(refreshed) ? refreshed : [])
      } catch {
        // Alkuperäinen virhe on jo näytetty, ei tarvitse toista.
      }
    } finally {
      setPublishing(false)
    }
  }

  function toggleFile(fileId) {
    setSelectedFileIds(current =>
      current.includes(fileId)
        ? current.filter(id => id !== fileId)
        : [...current, fileId],
    )
  }

  async function copyText() {
    const text = `${caption}\n\n${hashtags}`.trim()

    try {
      await navigator.clipboard.writeText(text)
      setCopyLabel("Kopioitu!")
    } catch {
      setCopyLabel("Kopiointi epäonnistui")
    }

    setTimeout(() => setCopyLabel("Kopioi teksti"), 2000)
  }

  function downloadSelectedFiles() {
    const selected = mediaFiles.filter(file =>
      selectedFileIds.includes(file.id),
    )

    for (const file of selected) {
      const link = document.createElement("a")

      link.href = fileUrl(projectId, file)
      link.download = file.originalName || file.storedName
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="panel p-6 text-sm text-[var(--wood-muted)]">
        Ladataan Social Studiota...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
          Social Studio
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Somejulkaisun luonnos
        </h2>

        <p className="mt-2 text-[var(--wood-muted)]">
          AI kirjoittaa kuvatekstin ja hashtagit projektin tietojen ja
          Wood-Boosterin brändiäänen pohjalta, sävyllä ja pituudella
          joka sopii valitulle alustalle.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectPlatform(option.value)}
              className={`rounded-lg border px-4 py-2 text-sm ${
                selectedPlatform === option.value
                  ? "border-[var(--wood-accent)] text-[var(--wood-accent)]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

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
          {generating
            ? "Luodaan luonnosta..."
            : activeDraft
              ? "Luo uusi luonnos"
              : "Luo julkaisuluonnos"}
        </button>
      </section>

      {activeDraft && (
        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">
              Luonnos -{" "}
              {
                PLATFORM_OPTIONS.find(
                  option => option.value === activeDraft.platform,
                )?.label
              }
            </h3>

            <span className="text-sm text-[var(--wood-muted)]">
              Tila: {draftStatusLabel(activeDraft.status)}
            </span>
          </div>

          {activeDraft.status === "published" &&
            activeDraft.publishedPermalink && (
              <p className="mt-3 text-sm text-green-400">
                Julkaistu:{" "}
                <a
                  href={activeDraft.publishedPermalink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {activeDraft.publishedPermalink}
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
              Kuvateksti
            </span>

            <textarea
              value={caption}
              onChange={event => setCaption(event.target.value)}
              rows={5}
              className="mt-2 wb-input resize-y"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm text-[var(--wood-muted)]">
              Hashtagit
            </span>

            <input
              type="text"
              value={hashtags}
              onChange={event => setHashtags(event.target.value)}
              className="mt-2 wb-input"
            />
          </label>

          {mediaFiles.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
                Valitse julkaisuun tulevat tiedostot
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {mediaFiles.map(file => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => toggleFile(file.id)}
                    className={`card relative overflow-hidden ${
                      selectedFileIds.includes(file.id)
                        ? "border-[var(--wood-accent)]"
                        : ""
                    }`}
                  >
                    {isVideo(file) ? (
                      <video
                        src={fileUrl(projectId, file)}
                        poster={thumbnailUrl(projectId, file)}
                        muted
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <img
                        src={fileUrl(projectId, file)}
                        alt={file.originalName}
                        className="aspect-square w-full object-cover"
                      />
                    )}

                    {selectedFileIds.includes(file.id) && (
                      <span className="absolute right-1 top-1 rounded-full bg-[var(--wood-accent)] px-2 text-xs text-black">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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

            {activeDraft.platform === "instagram" && (
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
                      : "Julkaise Instagramiin"}
              </button>
            )}

            <button
              type="button"
              onClick={copyText}
              className="rounded-lg border border-[var(--wood-border)] px-4 py-2 text-sm"
            >
              {copyLabel}
            </button>

            <button
              type="button"
              onClick={downloadSelectedFiles}
              disabled={selectedFileIds.length === 0}
              className="rounded-lg border border-[var(--wood-border)] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lataa valitut tiedostot
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default SocialStudioTab
