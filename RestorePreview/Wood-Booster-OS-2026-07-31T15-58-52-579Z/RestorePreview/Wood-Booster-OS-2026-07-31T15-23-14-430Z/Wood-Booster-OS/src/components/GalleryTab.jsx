import { useEffect, useRef, useState } from "react"

function GalleryTab({ projectId }) {
  const fileInputRef = useRef(null)

  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    setImages(readImages(projectId))
    setSelectedImage(null)
    setErrorMessage("")
  }, [projectId])

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function handleFilesSelected(event) {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) {
      return
    }

    setErrorMessage("")

    try {
      const newImages = []

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue
        }

        const dataUrl = await resizeImage(file)

        newImages.push({
          id: createId(),
          name: file.name,
          dataUrl,
          createdAt: new Date().toISOString(),
        })
      }

      if (newImages.length === 0) {
        setErrorMessage("Valitse vähintään yksi kuvatiedosto.")
        return
      }

      const updatedImages = [...newImages, ...images]

      saveImages(projectId, updatedImages)
      setImages(updatedImages)
    } catch (error) {
      console.error(error)

      setErrorMessage(
        "Kuvien tallennus epäonnistui. Kokeile pienempää kuvaa tai poista vanhoja kuvia.",
      )
    } finally {
      event.target.value = ""
    }
  }

  function deleteImage(imageId) {
    const shouldDelete = window.confirm(
      "Poistetaanko tämä kuva projektista?",
    )

    if (!shouldDelete) {
      return
    }

    const updatedImages = images.filter(
      (image) => image.id !== imageId,
    )

    saveImages(projectId, updatedImages)
    setImages(updatedImages)

    if (selectedImage?.id === imageId) {
      setSelectedImage(null)
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Media
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
              Projektin kuvat
            </h3>

            <p className="mt-2 text-neutral-400">
              Tallenna työvaiheet, luonnokset ja valmiin tuotteen kuvat.
            </p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            + Lisää kuvia
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {images.length === 0 ? (
          <button
            type="button"
            onClick={openFilePicker}
            className="mt-6 w-full rounded-2xl border border-dashed border-neutral-700 p-12 text-center transition hover:border-amber-500/60 hover:bg-neutral-950"
          >
            <span className="text-5xl">📷</span>

            <span className="mt-5 block text-xl font-semibold">
              Ei kuvia vielä
            </span>

            <span className="mx-auto mt-2 block max-w-lg text-neutral-400">
              Lisää ensimmäinen kuva projektin valmistuksesta.
            </span>
          </button>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((image) => (
              <article
                key={image.id}
                className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950"
              >
                <button
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className="block w-full"
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name || "Projektin kuva"}
                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>

                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-200">
                      {image.name || "Nimetön kuva"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {formatDate(image.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteImage(image.id)}
                    className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    Poista
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <div className="flex items-center justify-between gap-4 border-b border-neutral-800 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-100">
                  {selectedImage.name || "Projektin kuva"}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {formatDate(selectedImage.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-neutral-300 transition hover:bg-neutral-800"
              >
                Sulje
              </button>
            </div>

            <div className="flex max-h-[78vh] items-center justify-center overflow-auto bg-black p-4">
              <img
                src={selectedImage.dataUrl}
                alt={selectedImage.name || "Projektin kuva"}
                className="max-h-[72vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function readImages(projectId) {
  try {
    const savedImages = localStorage.getItem(
      getStorageKey(projectId),
    )

    const parsedImages = savedImages
      ? JSON.parse(savedImages)
      : []

    return Array.isArray(parsedImages)
      ? parsedImages
      : []
  } catch {
    return []
  }
}

function saveImages(projectId, images) {
  localStorage.setItem(
    getStorageKey(projectId),
    JSON.stringify(images),
  )
}

function getStorageKey(projectId) {
  return `woodBoosterGallery:${projectId}`
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error("Kuvan lukeminen epäonnistui."))
    }

    reader.onload = () => {
      const image = new Image()

      image.onerror = () => {
        reject(new Error("Kuvan avaaminen epäonnistui."))
      }

      image.onload = () => {
        const maximumSize = 1600
        const scale = Math.min(
          1,
          maximumSize / image.width,
          maximumSize / image.height,
        )

        const width = Math.max(
          1,
          Math.round(image.width * scale),
        )

        const height = Math.max(
          1,
          Math.round(image.height * scale),
        )

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        if (!context) {
          reject(new Error("Kuvan käsittely epäonnistui."))
          return
        }

        canvas.width = width
        canvas.height = height

        context.drawImage(image, 0, 0, width, height)

        resolve(
          canvas.toDataURL("image/jpeg", 0.82),
        )
      }

      image.src = String(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

function formatDate(dateValue) {
  if (!dateValue) {
    return ""
  }

  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue))
}

function createId() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

export default GalleryTab
