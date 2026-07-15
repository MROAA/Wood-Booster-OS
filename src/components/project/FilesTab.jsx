import { useEffect, useMemo, useRef, useState } from "react"

const API_URL = "http://localhost:3001/api"
const FILE_URL = "http://localhost:3001/uploads"

const categories = [
  "Kuvat",
  "Tarjoukset",
  "CAD",
  "CNC",
  "Dokumentit",
  "Muut",
]

function FilesTab({ projectId }) {
  const fileInputRef = useRef(null)

  const [files, setFiles] = useState([])
  const [category, setCategory] = useState("Kuvat")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `${API_URL}/projects/${projectId}/files`,
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Tiedostojen lataaminen epäonnistui",
          )
        }

        setFiles(Array.isArray(data) ? data : [])
      } catch (loadError) {
        console.error(loadError)
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadFiles()
    }
  }, [projectId])

  const filesByCategory = useMemo(() => {
    return categories.map((categoryName) => ({
      category: categoryName,
      files: files.filter(
        (file) =>
          (file.category || "Muut") === categoryName,
      ),
    }))
  }, [files])

  async function uploadFiles(selectedFiles) {
    const fileList = Array.from(selectedFiles || [])

    if (fileList.length === 0) {
      return
    }

    try {
      setUploading(true)
      setError("")

      for (const file of fileList) {
        const formData = new FormData()

        formData.append("file", file)
        formData.append("category", category)

        const response = await fetch(
          `${API_URL}/projects/${projectId}/files`,
          {
            method: "POST",
            body: formData,
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Tiedoston "${file.name}" lataaminen epäonnistui`,
          )
        }

        setFiles((current) => [
          data,
          ...current,
        ])
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (uploadError) {
      console.error(uploadError)
      setError(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(event) {
    uploadFiles(event.target.files)
  }

  function handleDragOver(event) {
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)

    uploadFiles(event.dataTransfer.files)
  }

  async function handleDelete(file) {
    const shouldDelete = window.confirm(
      `Poistetaanko tiedosto "${file.originalName}"?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError("")

      const response = await fetch(
        `${API_URL}/files/${file.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tiedoston poistaminen epäonnistui",
        )
      }

      setFiles((current) =>
        current.filter(
          (item) => item.id !== file.id,
        ),
      )
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Project files
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Projektin tiedostot
        </h2>

        <p className="mt-2 text-neutral-400">
          Lisää kuvia, PDF-tiedostoja, CAD-piirustuksia
          ja muita projektiin liittyviä tiedostoja.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
          <label className="block">
            <span className="text-sm text-neutral-300">
              Kategoria
            </span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className={inputClasses}
            >
              {categories.map((categoryName) => (
                <option
                  key={categoryName}
                  value={categoryName}
                >
                  {categoryName}
                </option>
              ))}
            </select>
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragging
                ? "border-amber-500 bg-amber-500/10"
                : "border-neutral-700 bg-neutral-950"
            }`}
          >
            <p className="text-4xl">📁</p>

            <h3 className="mt-4 text-lg font-semibold">
              Pudota tiedostot tähän
            </h3>

            <p className="mt-2 text-sm text-neutral-400">
              tai valitse tiedostot tietokoneelta
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
              className="mt-5 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Ladataan..."
                : "+ Valitse tiedostot"}
            </button>

            <p className="mt-4 text-xs text-neutral-600">
              Suurin tiedostokoko 50 Mt
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </section>

      {loading ? (
        <p className="text-neutral-400">
          Ladataan tiedostoja...
        </p>
      ) : files.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-neutral-700 p-12 text-center">
          <p className="text-5xl">📂</p>

          <h2 className="mt-5 text-xl font-semibold">
            Ei tiedostoja vielä
          </h2>

          <p className="mt-2 text-neutral-400">
            Lisää ensimmäinen tiedosto yllä olevalla
            latausalueella.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {filesByCategory.map((group) => {
            if (group.files.length === 0) {
              return null
            }

            return (
              <section
                key={group.category}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    {getCategoryIcon(group.category)}{" "}
                    {group.category}
                  </h2>

                  <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                    {group.files.length}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      projectId={projectId}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FileCard({
  file,
  projectId,
  onDelete,
}) {
  const fileUrl =
    `${FILE_URL}/projects/${projectId}/${file.storedName}`

  const isImage =
    file.mimeType?.startsWith("image/")

  return (
    <article className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      {isImage ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <img
            src={fileUrl}
            alt={file.originalName}
            className="h-48 w-full object-cover"
          />
        </a>
      ) : (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-48 items-center justify-center bg-neutral-900 text-6xl"
        >
          {getFileIcon(file)}
        </a>
      )}

      <div className="p-4">
        <h3 className="truncate font-semibold">
          {file.originalName}
        </h3>

        <p className="mt-2 text-sm text-neutral-500">
          {formatFileSize(file.size)}
        </p>

        <p className="mt-1 text-xs text-neutral-600">
          {formatDate(file.createdAt)}
        </p>

        <div className="mt-4 flex gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-amber-500 px-3 py-2 text-center text-sm text-amber-400 transition hover:bg-amber-500/10"
          >
            Avaa
          </a>

          <button
            type="button"
            onClick={() => onDelete(file)}
            className="rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            Poista
          </button>
        </div>
      </div>
    </article>
  )
}

function getCategoryIcon(category) {
  const icons = {
    Kuvat: "📷",
    Tarjoukset: "📄",
    CAD: "📐",
    CNC: "🛠️",
    Dokumentit: "📋",
    Muut: "📦",
  }

  return icons[category] || "📁"
}

function getFileIcon(file) {
  const name = String(
    file.originalName || "",
  ).toLowerCase()

  if (file.mimeType === "application/pdf") {
    return "📄"
  }

  if (
    name.endsWith(".skp") ||
    name.endsWith(".dxf") ||
    name.endsWith(".dwg")
  ) {
    return "📐"
  }

  if (
    name.endsWith(".stl") ||
    name.endsWith(".step") ||
    name.endsWith(".stp")
  ) {
    return "🧊"
  }

  if (
    name.endsWith(".zip") ||
    name.endsWith(".rar")
  ) {
    return "🗜️"
  }

  return "📦"
}

function formatFileSize(bytes) {
  const size = Number(bytes)

  if (!Number.isFinite(size) || size <= 0) {
    return "0 kt"
  }

  if (size < 1024) {
    return `${size} tavua`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} kt`
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} Mt`
}

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-amber-500"

export default FilesTab