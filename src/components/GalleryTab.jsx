import { useRef, useState } from "react"

function GalleryTab({ projectId }) {
  const fileInputRef = useRef(null)

  const [images, setImages] = useState(() => {
    const projects = readProjects()

    const project = projects.find(
      (item) => item.id === projectId,
    )

    return Array.isArray(project?.gallery)
      ? project.gallery
      : []
  })

  function saveImages(updatedImages) {
    setImages(updatedImages)

    const projects = readProjects()

    const updatedProjects = projects.map((project) => {
      if (project.id !== projectId) {
        return project
      }

      return {
        ...project,
        gallery: updatedImages,
      }
    })

    localStorage.setItem(
      "woodBoosterProjects",
      JSON.stringify(updatedProjects),
    )
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFiles(event) {
    const selectedFiles = Array.from(
      event.target.files || [],
    )

    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/"),
    )

    if (imageFiles.length === 0) {
      return
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onload = () => {
        const newImage = {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: reader.result,
          createdAt: new Date().toISOString(),
        }

        setImages((currentImages) => {
          const updatedImages = [
            ...currentImages,
            newImage,
          ]

          saveImagesToProject(
            projectId,
            updatedImages,
          )

          return updatedImages
        })
      }

      reader.readAsDataURL(file)
    })

    event.target.value = ""
  }

  function deleteImage(imageId) {
    const shouldDelete = window.confirm(
      "Poistetaanko tämä kuva?",
    )

    if (!shouldDelete) {
      return
    }

    const updatedImages = images.filter(
      (image) => image.id !== imageId,
    )

    saveImages(updatedImages)
  }

  return (
    <div>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Gallery
        </p>

        <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold">
              Projektin kuvat
            </h3>

            <p className="mt-2 text-neutral-400">
              Lisää työkuvia, luonnoksia ja valmiin tuotteen kuvia.
            </p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            + Lisää kuvia
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />

        <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-5">
          <p className="text-sm text-neutral-400">
            Kuvat tallennetaan tällä hetkellä selaimen
            paikalliseen muistiin.
          </p>

          <p className="mt-2 text-xs text-neutral-600">
            Käytä aluksi pieniä kuvia. Lisäämme myöhemmin
            oikean tiedostopalvelimen.
          </p>
        </div>
      </section>

      <section className="mt-6">
        {images.length === 0 ? (
          <EmptyGallery onAdd={openFilePicker} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onDelete={() =>
                  deleteImage(image.id)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ImageCard({ image, onDelete }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="aspect-[4/3] bg-neutral-950">
        <img
          src={image.dataUrl}
          alt={image.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-200">
            {image.name}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {formatDate(image.createdAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          Poista
        </button>
      </div>
    </article>
  )
}

function EmptyGallery({ onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-700 p-12 text-center">
      <p className="text-5xl">
        🖼️
      </p>

      <h3 className="mt-5 text-xl font-semibold">
        Ei kuvia vielä
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-neutral-400">
        Lisää ensimmäinen kuva projektista,
        materiaalista tai suunnitelmasta.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-6 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-400"
      >
        + Lisää ensimmäinen kuva
      </button>
    </div>
  )
}

function saveImagesToProject(
  projectId,
  updatedImages,
) {
  const projects = readProjects()

  const updatedProjects = projects.map((project) => {
    if (project.id !== projectId) {
      return project
    }

    return {
      ...project,
      gallery: updatedImages,
    }
  })

  localStorage.setItem(
    "woodBoosterProjects",
    JSON.stringify(updatedProjects),
  )
}

function readProjects() {
  try {
    const savedProjects = localStorage.getItem(
      "woodBoosterProjects",
    )

    const projects = savedProjects
      ? JSON.parse(savedProjects)
      : []

    return Array.isArray(projects)
      ? projects
      : []
  } catch {
    return []
  }
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

export default GalleryTab