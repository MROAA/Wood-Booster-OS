import { useEffect, useState } from "react"

import { apiGet, apiPost } from "../api/client"

const FILE_URL = "http://localhost:3001/uploads"

const CROP_OPTIONS = [
  { value: "", label: "Ei rajausta" },
  { value: "9:16", label: "9:16 (Reels/Story)" },
  { value: "1:1", label: "1:1 (neliö)" },
  { value: "4:5", label: "4:5 (feed)" },
]

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

function statusLabel(file) {
  if (file.status === "processing") {
    return "Käsitellään..."
  }

  if (file.status === "failed") {
    return "Käsittely epäonnistui"
  }

  return null
}

function MediaStudioTab({ projectId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [selectedId, setSelectedId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [crop, setCrop] = useState("")
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [saturation, setSaturation] = useState(1)
  const [watermark, setWatermark] = useState(false)
  const [captionText, setCaptionText] = useState("")

  const [trimStart, setTrimStart] = useState("")
  const [trimDuration, setTrimDuration] = useState("")

  useEffect(() => {
    if (!projectId) {
      return
    }

    let cancelled = false

    async function loadFiles() {
      try {
        setLoading(true)
        setErrorMessage("")

        const data = await apiGet(`/projects/${projectId}/files`)

        if (cancelled) {
          return
        }

        setFiles(Array.isArray(data) ? data : [])
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

    loadFiles()

    return () => {
      cancelled = true
    }
  }, [projectId])

  /*
   * Pollaa jokaista "processing"-tilassa olevaa tiedostoa 2 sekunnin
   * välein, kunnes se on "ready" tai "failed". Ei häiritse muuta
   * käyttöliittymää, koska päivittää vain kyseisen rivin.
   */
  useEffect(() => {
    const processingIds = files
      .filter(file => file.status === "processing")
      .map(file => file.id)

    if (processingIds.length === 0) {
      return
    }

    const interval = setInterval(async () => {
      for (const fileId of processingIds) {
        try {
          const updated = await apiGet(`/files/${fileId}`)

          if (updated.status !== "processing") {
            setFiles(current =>
              current.map(file =>
                file.id === fileId ? updated : file,
              ),
            )
          }
        } catch {
          // Yritetään uudelleen seuraavalla kierroksella.
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [files])

  const selectableFiles = files.filter(
    file => isImage(file) || isVideo(file),
  )

  const selectedFile = selectableFiles.find(
    file => file.id === selectedId,
  )

  const editedVersions = selectedFile
    ? files.filter(file => file.sourceFileId === selectedFile.id)
    : []

  function resetOperations() {
    setCrop("")
    setBrightness(1)
    setContrast(1)
    setSaturation(1)
    setWatermark(false)
    setCaptionText("")
    setTrimStart("")
    setTrimDuration("")
  }

  function selectFile(file) {
    setSelectedId(file.id)
    resetOperations()
  }

  async function savePhotoEdit() {
    setSaving(true)
    setErrorMessage("")

    try {
      const editedFile = await apiPost(
        `/files/${selectedFile.id}/edit`,
        {
          operations: {
            crop: crop || null,
            brightness,
            contrast,
            saturation,
            watermark,
            caption: captionText ? { text: captionText } : null,
          },
        },
      )

      setFiles(current => [editedFile, ...current])
    } catch (saveError) {
      setErrorMessage(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveVideoEdit() {
    setSaving(true)
    setErrorMessage("")

    try {
      const processingFile = await apiPost(
        `/files/${selectedFile.id}/edit-video`,
        {
          operations: {
            trim:
              trimStart || trimDuration
                ? {
                    start: trimStart ? Number(trimStart) : undefined,
                    duration: trimDuration
                      ? Number(trimDuration)
                      : undefined,
                  }
                : null,
            crop: crop || null,
            watermark,
            caption: captionText ? { text: captionText } : null,
          },
        },
      )

      setFiles(current => [processingFile, ...current])
    } catch (saveError) {
      setErrorMessage(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  function saveEdit() {
    if (!selectedFile) {
      return
    }

    if (isVideo(selectedFile)) {
      saveVideoEdit()
    } else {
      savePhotoEdit()
    }
  }

  if (loading) {
    return (
      <div className="panel p-6 text-sm text-[var(--wood-muted)]">
        Ladataan mediaa...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
          Media Studio
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Muokkaa projektin kuvaa ja videota
        </h2>

        <p className="mt-2 text-[var(--wood-muted)]">
          Rajaa, säädä värejä, lisää vesileima tai kuvateksti. Alkuperäinen
          tiedosto säilyy aina - muokkaus tallentuu uutena versiona.
        </p>

        {errorMessage && (
          <div className="mt-5 card border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {selectableFiles.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--wood-muted)]">
            Lisää ensin kuva tai video Galleriaan.
          </p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {selectableFiles.map(file => (
              <button
                key={file.id}
                type="button"
                onClick={() => selectFile(file)}
                className={`card relative overflow-hidden ${
                  selectedId === file.id
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

                {statusLabel(file) && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-xs text-white">
                    {statusLabel(file)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedFile && (
        <section className="panel p-6">
          <h3 className="text-lg font-semibold">
            {selectedFile.originalName}
          </h3>

          {selectedFile.status === "processing" ? (
            <p className="mt-4 text-sm text-[var(--wood-muted)]">
              Käsitellään videota, tämä voi kestää hetken...
            </p>
          ) : (
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {isVideo(selectedFile) ? (
                <video
                  src={fileUrl(projectId, selectedFile)}
                  poster={thumbnailUrl(projectId, selectedFile)}
                  controls
                  className="max-h-96 w-full rounded-xl object-contain"
                />
              ) : (
                <img
                  src={fileUrl(projectId, selectedFile)}
                  alt={selectedFile.originalName}
                  className="max-h-96 w-full rounded-xl object-contain"
                />
              )}

              <div className="space-y-4">
                {isVideo(selectedFile) && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm text-[var(--wood-muted)]">
                        Alkukohta (s)
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={trimStart}
                        onChange={event =>
                          setTrimStart(event.target.value)
                        }
                        className="mt-2 wb-input"
                        placeholder="0"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-[var(--wood-muted)]">
                        Kesto (s)
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={trimDuration}
                        onChange={event =>
                          setTrimDuration(event.target.value)
                        }
                        className="mt-2 wb-input"
                        placeholder="Koko video"
                      />
                    </label>
                  </div>
                )}

                <label className="block">
                  <span className="text-sm text-[var(--wood-muted)]">
                    Rajaus
                  </span>

                  <select
                    value={crop}
                    onChange={event => setCrop(event.target.value)}
                    className="mt-2 wb-input"
                  >
                    {CROP_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {!isVideo(selectedFile) && (
                  <>
                    <label className="block">
                      <span className="text-sm text-[var(--wood-muted)]">
                        Kirkkaus ({brightness.toFixed(2)})
                      </span>

                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={brightness}
                        onChange={event =>
                          setBrightness(Number(event.target.value))
                        }
                        className="mt-2 w-full"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-[var(--wood-muted)]">
                        Kontrasti ({contrast.toFixed(2)})
                      </span>

                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={contrast}
                        onChange={event =>
                          setContrast(Number(event.target.value))
                        }
                        className="mt-2 w-full"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-[var(--wood-muted)]">
                        Saturaatio ({saturation.toFixed(2)})
                      </span>

                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={saturation}
                        onChange={event =>
                          setSaturation(Number(event.target.value))
                        }
                        className="mt-2 w-full"
                      />
                    </label>
                  </>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={watermark}
                    onChange={event => setWatermark(event.target.checked)}
                  />
                  Wood-Booster -vesileima
                </label>

                <label className="block">
                  <span className="text-sm text-[var(--wood-muted)]">
                    Kuvateksti (valinnainen)
                  </span>

                  <input
                    type="text"
                    value={captionText}
                    onChange={event => setCaptionText(event.target.value)}
                    className="mt-2 wb-input"
                    placeholder="Esim. Aurora-pöytä valmis"
                  />
                </label>

                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="wb-button disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Tallennetaan..." : "Tallenna muokattu versio"}
                </button>
              </div>
            </div>
          )}

          {editedVersions.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">
                Muokatut versiot
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {editedVersions.map(version => (
                  <div key={version.id} className="relative">
                    {isVideo(version) ? (
                      <video
                        src={fileUrl(projectId, version)}
                        poster={thumbnailUrl(projectId, version)}
                        muted
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ) : (
                      <img
                        src={fileUrl(projectId, version)}
                        alt={version.originalName}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    )}

                    {statusLabel(version) && (
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-xs text-white">
                        {statusLabel(version)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default MediaStudioTab
