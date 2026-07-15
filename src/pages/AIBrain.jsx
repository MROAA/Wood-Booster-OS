import { useMemo, useRef, useState } from "react"

const API_URL = "http://localhost:3001/api"
const allowedExtensions = [".txt", ".md", ".pdf", ".docx"]

const emptySettings = {
  folder: "Yleinen",
  topic: "Yleinen",
  tags: "",
  author: "Marc",
  priority: 3,
  confidence: 100,
  alwaysUse: false,
}

function AIBrain() {
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [settings, setSettings] = useState(emptySettings)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState("")

  const validFiles = useMemo(
    () => files.filter(isSupportedFile),
    [files],
  )

  const invalidFiles = useMemo(
    () => files.filter((file) => !isSupportedFile(file)),
    [files],
  )

  function handleSettingsChange(event) {
    const { name, value, type, checked } = event.target

    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }))

    setError("")
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList || [])

    if (incoming.length === 0) {
      return
    }

    setFiles((current) => {
      const existingKeys = new Set(
        current.map(createFileKey),
      )

      const uniqueIncoming = incoming.filter((file) => {
        const key = createFileKey(file)

        if (existingKeys.has(key)) {
          return false
        }

        existingKeys.add(key)
        return true
      })

      return [...current, ...uniqueIncoming]
    })

    setResults([])
    setError("")
  }

  function handleFileInput(event) {
    addFiles(event.target.files)
    event.target.value = ""
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function removeFile(index) {
    setFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    )
  }

  async function handleUpload() {
    if (validFiles.length === 0) {
      setError(
        "Valitse vähintään yksi TXT-, MD-, PDF- tai DOCX-tiedosto.",
      )
      return
    }

    setUploading(true)
    setError("")
    setResults([])

    const nextResults = []

    try {
      for (const file of validFiles) {
        try {
          const uploadResult = await uploadKnowledgeFile(
            file,
            settings,
          )

          nextResults.push({
            fileName: file.name,
            success: true,
            message: `${uploadResult.chunkCount || 0} tietopalaa luotu`,
          })
        } catch (uploadError) {
          nextResults.push({
            fileName: file.name,
            success: false,
            message:
              uploadError.message ||
              "Tiedoston käsittely epäonnistui",
          })
        }

        setResults([...nextResults])
      }

      setFiles((current) =>
        current.filter(
          (file) =>
            !nextResults.some(
              (result) =>
                result.success &&
                result.fileName === file.name,
            ),
        ),
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
            Wood-Booster AI Brain
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Opeta tekoälyä tiedostoilla
          </h1>

          <p className="mt-4 max-w-3xl text-neutral-400">
            Pudota TXT-, MD-, PDF- tai DOCX-tiedostoja.
            Ne pilkotaan tietopaloiksi ja lisätään heti
            chatbotin käytettäväksi.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              File intake
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Lisää tiedostoja AI:n aivoille
            </h2>

            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`mt-6 rounded-2xl border-2 border-dashed p-10 text-center transition ${
                dragging
                  ? "border-amber-400 bg-amber-500/10"
                  : "border-neutral-700 bg-neutral-950"
              }`}
            >
              <p className="text-6xl">🧠</p>

              <h3 className="mt-5 text-xl font-semibold">
                Pudota tiedostot tähän
              </h3>

              <p className="mx-auto mt-3 max-w-lg text-neutral-400">
                Voit valita useita tiedostoja kerralla.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileInput}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
              >
                Valitse tiedostoja
              </button>

              <p className="mt-4 text-xs text-neutral-600">
                Enintään 20 Mt per tiedosto
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                {files.map((file, index) => (
                  <div
                    key={createFileKey(file)}
                    className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {isSupportedFile(file) ? "📄" : "⚠️"}{" "}
                        {file.name}
                      </p>

                      <p className="mt-2 text-sm text-neutral-500">
                        {formatFileSize(file.size)}
                        {!isSupportedFile(file) && " · Ei tuettu"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => removeFile(index)}
                      className="rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Poista
                    </button>
                  </div>
                ))}
              </div>
            )}

            {invalidFiles.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
                {invalidFiles.length} tiedostoa ohitetaan,
                koska niiden muotoa ei tueta.
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || validFiles.length === 0}
              className="mt-6 w-full rounded-xl bg-amber-500 px-5 py-4 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Tiedostoja käsitellään..."
                : `⬆ Lisää ${validFiles.length} tiedostoa AI Brainiin`}
            </button>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Knowledge settings
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Tiedon asetukset
              </h2>

              <div className="mt-5 space-y-5">
                <FormField label="Kansio">
                  <select
                    name="folder"
                    value={settings.folder}
                    onChange={handleSettingsChange}
                    className={inputClasses}
                  >
                    {[
                      "Yleinen",
                      "Brand",
                      "Products",
                      "Materials",
                      "Manufacturing",
                      "Marketing",
                      "WordPress",
                      "Projects",
                      "Personal",
                      "AI-Instructions",
                    ].map((folder) => (
                      <option key={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Aihe">
                  <input
                    name="topic"
                    value={settings.topic}
                    onChange={handleSettingsChange}
                    className={inputClasses}
                  />
                </FormField>

                <FormField label="Tagit">
                  <input
                    name="tags"
                    value={settings.tags}
                    onChange={handleSettingsChange}
                    placeholder="puu, brändi, ohje"
                    className={inputClasses}
                  />
                </FormField>

                <FormField label="Kirjoittaja">
                  <input
                    name="author"
                    value={settings.author}
                    onChange={handleSettingsChange}
                    className={inputClasses}
                  />
                </FormField>

                <FormField
                  label={`Prioriteetti: ${settings.priority}/5`}
                >
                  <input
                    type="range"
                    name="priority"
                    min="1"
                    max="5"
                    value={settings.priority}
                    onChange={handleSettingsChange}
                    className="mt-3 w-full"
                  />
                </FormField>

                <FormField
                  label={`Luotettavuus: ${settings.confidence} %`}
                >
                  <input
                    type="range"
                    name="confidence"
                    min="0"
                    max="100"
                    value={settings.confidence}
                    onChange={handleSettingsChange}
                    className="mt-3 w-full"
                  />
                </FormField>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <input
                    type="checkbox"
                    name="alwaysUse"
                    checked={settings.alwaysUse}
                    onChange={handleSettingsChange}
                    className="mt-1"
                  />

                  <span>
                    <span className="block font-medium">
                      Käytä aina
                    </span>

                    <span className="mt-1 block text-sm text-neutral-500">
                      Korostaa tämän tiedon merkitystä
                      AI Brainin vastauksissa.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Upload results
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Tuonnin tulokset
              </h2>

              {results.length === 0 ? (
                <p className="mt-5 rounded-xl border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-400">
                  Tulokset näkyvät tässä käsittelyn jälkeen.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {results.map((result) => (
                    <div
                      key={`${result.fileName}-${result.success}`}
                      className={`rounded-xl border p-4 ${
                        result.success
                          ? "border-green-900/50 bg-green-950/20"
                          : "border-red-900/50 bg-red-950/20"
                      }`}
                    >
                      <p
                        className={
                          result.success
                            ? "text-green-300"
                            : "text-red-300"
                        }
                      >
                        {result.success ? "✓" : "✕"}{" "}
                        {result.fileName}
                      </p>

                      <p className="mt-2 text-sm text-neutral-400">
                        {result.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">
        {label}
      </span>
      {children}
    </label>
  )
}

async function uploadKnowledgeFile(file, settings) {
  const formData = new FormData()

  formData.append("file", file)
  formData.append("title", file.name)
  formData.append("topic", settings.topic || "Yleinen")
  formData.append("tags", settings.tags || "")

  const uploadResponse = await fetch(
    `${API_URL}/knowledge/upload`,
    {
      method: "POST",
      body: formData,
    },
  )

  const uploadData = await uploadResponse.json()

  if (!uploadResponse.ok) {
    throw new Error(
      uploadData.error ||
        "Tiedoston lataaminen epäonnistui",
    )
  }

  const documentId =
    uploadData.document?.id ||
    uploadData.documentId

  if (documentId) {
    const metadataResponse = await fetch(
      `${API_URL}/knowledge/${documentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folder: settings.folder,
          topic: settings.topic || "Yleinen",
          tags: settings.tags || null,
          author: settings.author || null,
          priority: Number(settings.priority),
          confidence: Number(settings.confidence),
          alwaysUse: Boolean(settings.alwaysUse),
        }),
      },
    )

    const metadataData = await metadataResponse.json()

    if (!metadataResponse.ok) {
      throw new Error(
        metadataData.error ||
          "Metatietojen tallentaminen epäonnistui",
      )
    }

    uploadData.document = metadataData
  }

  return uploadData
}

function isSupportedFile(file) {
  const name = String(file?.name || "").toLowerCase()
  return allowedExtensions.some((extension) =>
    name.endsWith(extension),
  )
}

function createFileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} kt`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mt`
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default AIBrain
