import { useEffect, useMemo, useRef, useState } from "react"

const API_URL = "http://localhost:3001/api"

const emptyForm = {
  title: "",
  topic: "Yleinen",
  tags: "",
  content: "",
}

function Knowledge() {
  const fileInputRef = useRef(null)

  const [documents, setDocuments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingText, setSavingText] = useState(false)
  const [uploadingFile, setUploadingFile] =
    useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/knowledge`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tietopankin lataaminen epäonnistui",
        )
      }

      setDocuments(Array.isArray(data) ? data : [])
    } catch (loadError) {
      console.error(loadError)
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return documents
    }

    return documents.filter((document) =>
      [
        document.title,
        document.topic,
        document.tags,
        document.content,
        document.sourceUrl,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      ),
    )
  }, [documents, search])

  const topicCount = useMemo(() => {
    return new Set(
      documents
        .map((document) => document.topic)
        .filter(Boolean),
    ).size
  }, [documents])

  const totalCharacters = useMemo(() => {
    return documents.reduce(
      (sum, document) =>
        sum +
        String(document.content || "").length,
      0,
    )
  }, [documents])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError("")
    setSuccess("")
  }

  async function handleTextSubmit(event) {
    event.preventDefault()

    const title = form.title.trim()
    const content = form.content.trim()

    if (!title) {
      setError("Anna tiedolle otsikko.")
      return
    }

    if (!content) {
      setError("Kirjoita AI Brainiin tallennettava tieto.")
      return
    }

    try {
      setSavingText(true)
      setError("")
      setSuccess("")

      const response = await fetch(
        `${API_URL}/knowledge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
            sourceType: "text",
            topic: form.topic.trim() || "Yleinen",
            tags: form.tags.trim() || null,
            status: "Hyväksytty",
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tiedon tallentaminen epäonnistui",
        )
      }

      setDocuments((current) => [
        data,
        ...current,
      ])

      setForm(emptyForm)
      setSuccess(
        "Tieto lisättiin AI Brainiin ja on heti chatbotin käytettävissä.",
      )
    } catch (saveError) {
      console.error(saveError)
      setError(saveError.message)
    } finally {
      setSavingText(false)
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedExtensions = [
      ".txt",
      ".md",
      ".pdf",
      ".docx",
    ]

    const lowerName = file.name.toLowerCase()

    if (
      !allowedExtensions.some((extension) =>
        lowerName.endsWith(extension),
      )
    ) {
      setError(
        "Tuettuja tiedostoja ovat TXT, MD, PDF ja DOCX.",
      )
      event.target.value = ""
      return
    }

    try {
      setUploadingFile(true)
      setError("")
      setSuccess("")

      const formData = new FormData()

      formData.append("file", file)
      formData.append(
        "title",
        form.title.trim() || file.name,
      )
      formData.append(
        "topic",
        form.topic.trim() || "Yleinen",
      )
      formData.append(
        "tags",
        form.tags.trim(),
      )

      const response = await fetch(
        `${API_URL}/knowledge/upload`,
        {
          method: "POST",
          body: formData,
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tiedoston lisääminen epäonnistui",
        )
      }

      const document =
        data.document ||
        (data.documentId
          ? await loadOneDocument(data.documentId)
          : null)

      if (document) {
        setDocuments((current) => [
          document,
          ...current.filter(
            (item) => item.id !== document.id,
          ),
        ])
      } else {
        await loadDocuments()
      }

      setForm(emptyForm)
      setSuccess(
        `Tiedosto "${file.name}" lisättiin AI Brainiin${
          data.chunkCount
            ? ` (${data.chunkCount} tietopalaa)`
            : ""
        }.`,
      )
    } catch (uploadError) {
      console.error(uploadError)
      setError(uploadError.message)
    } finally {
      setUploadingFile(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function loadOneDocument(documentId) {
    const response = await fetch(
      `${API_URL}/knowledge/${documentId}`,
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Dokumentin lataaminen epäonnistui",
      )
    }

    return data
  }

  async function handleDelete(document) {
    const shouldDelete = window.confirm(
      `Poistetaanko "${document.title}" AI Brainista?`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setError("")
      setSuccess("")

      const response = await fetch(
        `${API_URL}/knowledge/${document.id}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Dokumentin poistaminen epäonnistui",
        )
      }

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id,
        ),
      )

      setSuccess("Tieto poistettiin AI Brainista.")
    } catch (deleteError) {
      console.error(deleteError)
      setError(deleteError.message)
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
            Knowledge Manager
          </h1>

          <p className="mt-4 max-w-3xl text-neutral-400">
            Kirjoita tietoa tai lisää tiedostoja
            chatbotin aivoille. Tallennettu tieto on
            heti Wood-Booster AI:n käytettävissä.
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-900/60 bg-green-950/30 px-4 py-3 text-green-300">
            {success}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            label="Tietolähteet"
            value={documents.length}
            detail="AI Brainiin tallennetut dokumentit"
          />

          <SummaryCard
            label="Aihealueet"
            value={topicCount}
            detail="Tietopankissa olevat eri aiheet"
          />

          <SummaryCard
            label="Tekstimäärä"
            value={formatCharacterCount(
              totalCharacters,
            )}
            detail="Tallennetun tiedon kokonaismäärä"
            highlight
          />
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Add knowledge
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Lisää tietoa AI Brainiin
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Voit kirjoittaa tiedon itse tai käyttää
              samoja aihe- ja tagitietoja ladattavalle
              tiedostolle.
            </p>

            <form
              onSubmit={handleTextSubmit}
              className="mt-6 space-y-5"
            >
              <FormField label="Otsikko">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Esimerkiksi Wood-Boosterin kirjoitustyyli"
                  className={inputClasses}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Aihe">
                  <input
                    name="topic"
                    value={form.topic}
                    onChange={handleChange}
                    placeholder="Brändi, puutyöt, markkinointi..."
                    className={inputClasses}
                  />
                </FormField>

                <FormField label="Tagit">
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    placeholder="puu, brändi, ohje"
                    className={inputClasses}
                  />
                </FormField>
              </div>

              <FormField label="Tieto chatbotille">
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={10}
                  placeholder="Kirjoita tähän tieto, jonka haluat Wood-Booster AI:n muistavan ja käyttävän..."
                  className={`${inputClasses} resize-y`}
                />
              </FormField>

              <button
                type="submit"
                disabled={
                  savingText || uploadingFile
                }
                className="w-full rounded-xl bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingText
                  ? "Tallennetaan..."
                  : "🧠 Tallenna tieto AI Brainiin"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-800" />

              <span className="text-xs uppercase tracking-wider text-neutral-600">
                tai
              </span>

              <div className="h-px flex-1 bg-neutral-800" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploadingFile || savingText
              }
              className="w-full rounded-xl border border-amber-500 px-5 py-4 font-semibold text-amber-400 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingFile
                ? "Tiedostoa käsitellään..."
                : "📄 Lisää tiedosto AI:n aivoille"}
            </button>

            <p className="mt-3 text-center text-xs text-neutral-600">
              TXT, MD, PDF tai DOCX · enintään 20 Mt
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  AI memory
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  AI Brainin tietopankki
                </h2>
              </div>

              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-400">
                {documents.length} dokumenttia
              </span>
            </div>

            <label className="mt-6 block">
              <span className="text-sm text-neutral-300">
                Hae tietopankista
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Hae otsikolla, aiheella, tagilla tai sisällöllä..."
                className={inputClasses}
              />
            </label>

            {loading ? (
              <p className="mt-6 text-neutral-400">
                Ladataan AI Brainia...
              </p>
            ) : filteredDocuments.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-neutral-700 p-10 text-center">
                <p className="text-5xl">🧠</p>

                <h3 className="mt-4 text-lg font-semibold">
                  {documents.length === 0
                    ? "AI Brain on vielä tyhjä"
                    : "Hakuehdoilla ei löytynyt tietoa"}
                </h3>

                <p className="mt-2 text-neutral-400">
                  {documents.length === 0
                    ? "Kirjoita ensimmäinen tieto tai lisää tiedosto vasemmalta."
                    : "Kokeile toista hakusanaa."}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredDocuments.map(
                  (document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onDelete={handleDelete}
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function DocumentCard({
  document,
  onDelete,
}) {
  const isFile =
    document.sourceType === "file"

  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl">
              {isFile ? "📄" : "🧠"}
            </span>

            <h3 className="text-lg font-semibold">
              {document.title}
            </h3>

            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
              {document.status || "Hyväksytty"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
              {document.topic || "Yleinen"}
            </span>

            {splitTags(document.tags).map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-500"
                >
                  #{tag}
                </span>
              ),
            )}
          </div>

          <p className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-neutral-400">
            {document.content}
          </p>

          <p className="mt-4 text-xs text-neutral-600">
            Päivitetty{" "}
            {formatDate(
              document.updatedAt ||
                document.createdAt,
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(document)}
          className="shrink-0 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          Poista
        </button>
      </div>
    </article>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  highlight = false,
}) {
  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm text-neutral-400">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold ${
          highlight
            ? "text-amber-400"
            : "text-neutral-100"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm text-neutral-500">
        {detail}
      </p>
    </article>
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

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function formatCharacterCount(value) {
  const number = Number(value) || 0

  if (number < 1000) {
    return `${number} merkkiä`
  }

  return `${new Intl.NumberFormat("fi-FI", {
    maximumFractionDigits: 1,
  }).format(number / 1000)} t. merkkiä`
}

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Ei tiedossa"
  }

  return new Intl.DateTimeFormat("fi-FI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

const inputClasses =
  "mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"

export default Knowledge
