import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

import {
  apiGet,
  apiPost,
  apiUpload,
  apiDelete,
} from "../api/client"



const PAGE_SIZE = 12



const emptyTextForm = {

  title: "",
  content: "",
  topic: "",
  folder: "",
  tags: "",
  author: "",

}



const emptyFileForm = {

  title: "",
  topic: "",
  tags: "",

}



function Knowledge() {


  const [
    documents,
    setDocuments,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState("")


  const [
    search,
    setSearch,
  ] = useState("")


  const [
    folder,
    setFolder,
  ] = useState("all")


  const [
    visibleCount,
    setVisibleCount,
  ] = useState(PAGE_SIZE)


  const [
    showCreate,
    setShowCreate,
  ] = useState(false)


  const [
    createMode,
    setCreateMode,
  ] = useState("text")


  const [
    textForm,
    setTextForm,
  ] = useState(emptyTextForm)


  const [
    fileForm,
    setFileForm,
  ] = useState(emptyFileForm)


  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null)


  const [
    saving,
    setSaving,
  ] = useState(false)




  useEffect(() => {

    loadDocuments()

  }, [])




  async function loadDocuments() {

    try {

      setLoading(true)

      setError("")


      const data =
        await apiGet("/knowledge")


      setDocuments(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (loadError) {

      console.error(
        "Knowledge error:",
        loadError
      )

      setError(
        loadError.message ||
        "Knowledge Center yhteys epäonnistui."
      )

    } finally {

      setLoading(false)

    }

  }




  const folders =
    useMemo(
      () => [

        "all",

        ...new Set(
          documents
            .map(
              document =>
                document.folder
            )
            .filter(Boolean)
        ),

      ],
      [documents]
    )




  const filteredDocuments =
    useMemo(
      () =>

        documents.filter(
          document => {

            const query =
              search.trim().toLowerCase()


            const matchesSearch =

              !query ||

              [
                document.title,
                document.content,
                document.topic,
                document.tags,
                document.author,
              ]
                .join(" ")
                .toLowerCase()
                .includes(query)


            const matchesFolder =

              folder === "all" ||
              document.folder === folder


            return (
              matchesSearch &&
              matchesFolder
            )

          }
        ),

      [
        documents,
        search,
        folder,
      ]
    )




  useEffect(() => {

    setVisibleCount(PAGE_SIZE)

  }, [search, folder])




  const visibleDocuments =
    filteredDocuments.slice(
      0,
      visibleCount,
    )




  const stats =
    useMemo(
      () => {

        const approved =
          documents.filter(
            document =>
              document.status === "Hyväksytty"
          ).length


        const chunks =
          documents.reduce(
            (total, document) =>
              total +
              (document._count?.chunks || 0),
            0
          )


        const alwaysUse =
          documents.filter(
            document =>
              document.alwaysUse
          ).length


        return {

          total:
            documents.length,

          approved,

          chunks,

          alwaysUse,

        }

      },
      [documents]
    )




  function updateTextField(
    field,
    value,
  ) {

    setTextForm(
      current => ({

        ...current,

        [field]:
          value,

      })
    )

  }




  function updateFileField(
    field,
    value,
  ) {

    setFileForm(
      current => ({

        ...current,

        [field]:
          value,

      })
    )

  }




  async function createTextDocument(
    event
  ) {

    event.preventDefault()


    const cleanTitle =
      textForm.title.trim()

    const cleanContent =
      textForm.content.trim()


    if(!cleanTitle || !cleanContent) {

      setError(
        "Otsikko ja sisältö ovat pakollisia."
      )

      return

    }


    try {

      setSaving(true)

      setError("")


      const document =
        await apiPost(
          "/knowledge",
          {

            title:
              cleanTitle,

            content:
              cleanContent,

            topic:
              textForm.topic,

            folder:
              textForm.folder,

            tags:
              textForm.tags,

            author:
              textForm.author,

          }
        )


      setDocuments(
        current => [
          document,
          ...current,
        ]
      )


      setTextForm(emptyTextForm)

      setShowCreate(false)

    } catch(createError) {

      console.error(
        "Dokumentin luonti epäonnistui:",
        createError,
      )

      setError(
        createError.message
      )

    } finally {

      setSaving(false)

    }

  }




  async function uploadDocument(
    event
  ) {

    event.preventDefault()


    if(!selectedFile) {

      setError(
        "Valitse tiedosto."
      )

      return

    }


    try {

      setSaving(true)

      setError("")


      const formData =
        new FormData()

      formData.append(
        "file",
        selectedFile,
      )

      formData.append(
        "title",
        fileForm.title,
      )

      formData.append(
        "topic",
        fileForm.topic,
      )

      formData.append(
        "tags",
        fileForm.tags,
      )


      const result =
        await apiUpload(
          "/knowledge/upload",
          formData,
        )


      setDocuments(
        current => [
          result.document,
          ...current,
        ]
      )


      setFileForm(emptyFileForm)

      setSelectedFile(null)

      setShowCreate(false)

    } catch(uploadError) {

      console.error(
        "Tiedoston lataus epäonnistui:",
        uploadError,
      )

      setError(
        uploadError.message
      )

    } finally {

      setSaving(false)

    }

  }




  async function deleteDocument(
    event,
    documentId,
  ) {

    event.preventDefault()

    event.stopPropagation()


    const shouldDelete =
      window.confirm(
        "Poistetaanko dokumentti?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      await apiDelete(
        `/knowledge/${documentId}`
      )


      setDocuments(
        current =>
          current.filter(
            document =>
              document.id !== documentId
          )
      )

    } catch(deleteError) {

      console.error(
        "Dokumentin poisto epäonnistui:",
        deleteError,
      )

      setError(
        deleteError.message
      )

    }

  }




  return (

    <div className="space-y-8">


      <section
        className="
          flex
          flex-col
          gap-3
          md:flex-row
          md:items-start
          md:justify-between
        "
      >

        <div>

          <h1 className="page-title">
            ◌ Knowledge Center
          </h1>


          <p className="page-description">
            AI Brainin tietokeskus. Dokumentit toimivat
            agenttien ja Truth Layerin lähteenä.
          </p>

        </div>



        <button

          className="wb-button"

          onClick={() =>
            setShowCreate(
              !showCreate
            )
          }

        >
          + Uusi dokumentti
        </button>


      </section>




      <section
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
        "
      >

        <Stat
          label="Dokumentteja"
          value={stats.total}
        />

        <Stat
          label="Hyväksyttyjä"
          value={stats.approved}
        />

        <Stat
          label="Katkelmia"
          value={stats.chunks}
        />

        <Stat
          label="Aina käytössä"
          value={stats.alwaysUse}
        />

      </section>




      {
        showCreate && (

          <section className="panel p-6 space-y-5">

            <div className="flex gap-3">

              <button

                type="button"

                onClick={() =>
                  setCreateMode("text")
                }

                className={
                  createMode === "text"
                    ? "wb-button"
                    : "text-sm text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
                }

              >
                Kirjoita teksti
              </button>


              <button

                type="button"

                onClick={() =>
                  setCreateMode("file")
                }

                className={
                  createMode === "file"
                    ? "wb-button"
                    : "text-sm text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
                }

              >
                Lataa tiedosto
              </button>

            </div>



            {
              createMode === "text"

              ?

              (

                <form
                  onSubmit={createTextDocument}
                  className="space-y-3"
                >

                  <input
                    className="wb-input"
                    placeholder="Otsikko"
                    value={textForm.title}
                    onChange={
                      e =>
                        updateTextField(
                          "title",
                          e.target.value,
                        )
                    }
                  />


                  <textarea
                    className="wb-input"
                    placeholder="Sisältö"
                    rows="6"
                    value={textForm.content}
                    onChange={
                      e =>
                        updateTextField(
                          "content",
                          e.target.value,
                        )
                    }
                  />


                  <div className="grid gap-3 md:grid-cols-2">

                    <input
                      className="wb-input"
                      placeholder="Aihe"
                      value={textForm.topic}
                      onChange={
                        e =>
                          updateTextField(
                            "topic",
                            e.target.value,
                          )
                      }
                    />


                    <input
                      className="wb-input"
                      placeholder="Kansio"
                      value={textForm.folder}
                      onChange={
                        e =>
                          updateTextField(
                            "folder",
                            e.target.value,
                          )
                      }
                    />

                  </div>


                  <div className="grid gap-3 md:grid-cols-2">

                    <input
                      className="wb-input"
                      placeholder="Tunnisteet"
                      value={textForm.tags}
                      onChange={
                        e =>
                          updateTextField(
                            "tags",
                            e.target.value,
                          )
                      }
                    />


                    <input
                      className="wb-input"
                      placeholder="Tekijä"
                      value={textForm.author}
                      onChange={
                        e =>
                          updateTextField(
                            "author",
                            e.target.value,
                          )
                      }
                    />

                  </div>


                  <button

                    type="submit"

                    disabled={saving}

                    className="wb-button disabled:cursor-not-allowed disabled:opacity-50"

                  >

                    {
                      saving
                      ?
                      "Tallennetaan..."
                      :
                      "Tallenna dokumentti"
                    }

                  </button>

                </form>

              )

              :

              (

                <form
                  onSubmit={uploadDocument}
                  className="space-y-3"
                >

                  <input

                    type="file"

                    accept=".txt,.md,.pdf,.docx"

                    onChange={
                      e =>
                        setSelectedFile(
                          e.target.files?.[0] || null
                        )
                    }

                    className="wb-input"

                  />


                  <p className="text-xs text-[var(--wood-muted)]">
                    Tuetut muodot: TXT, MD, PDF, DOCX (enintään 20 Mt).
                  </p>


                  <div className="grid gap-3 md:grid-cols-3">

                    <input
                      className="wb-input"
                      placeholder="Otsikko (valinnainen)"
                      value={fileForm.title}
                      onChange={
                        e =>
                          updateFileField(
                            "title",
                            e.target.value,
                          )
                      }
                    />


                    <input
                      className="wb-input"
                      placeholder="Aihe (valinnainen)"
                      value={fileForm.topic}
                      onChange={
                        e =>
                          updateFileField(
                            "topic",
                            e.target.value,
                          )
                      }
                    />


                    <input
                      className="wb-input"
                      placeholder="Tunnisteet (valinnainen)"
                      value={fileForm.tags}
                      onChange={
                        e =>
                          updateFileField(
                            "tags",
                            e.target.value,
                          )
                      }
                    />

                  </div>


                  <button

                    type="submit"

                    disabled={saving}

                    className="wb-button disabled:cursor-not-allowed disabled:opacity-50"

                  >

                    {
                      saving
                      ?
                      "Ladataan..."
                      :
                      "Lataa tiedosto"
                    }

                  </button>

                </form>

              )

            }


          </section>

        )
      }




      {
        error && (

          <div className="panel text-red-400">
            {error}
          </div>

        )
      }




      <section
        className="
          flex
          flex-col
          gap-3
          md:flex-row
        "
      >

        <input

          className="wb-input"

          placeholder="Hae tietopankista..."

          value={search}

          onChange={
            e =>
              setSearch(e.target.value)
          }

        />


        <select

          className="wb-input md:w-64"

          value={folder}

          onChange={
            e =>
              setFolder(e.target.value)
          }

        >

          {
            folders.map(
              item => (

                <option
                  key={item}
                  value={item}
                >
                  {
                    item === "all"
                    ?
                    "Kaikki kansiot"
                    :
                    item
                  }
                </option>

              )
            )
          }

        </select>


      </section>




      {
        loading

        ?

        (

          <div className="panel p-6">
            Ladataan tietopankkia...
          </div>

        )

        :

        filteredDocuments.length === 0

        ?

        (

          <div className="panel p-6">
            Ei dokumentteja hakuehdoilla.
          </div>

        )

        :

        (

          <div
            className="
              grid
              grid-cols-1
              xl:grid-cols-2
              gap-5
            "
          >

            {
              visibleDocuments.map(
                document => (

                  <Link

                    key={document.id}

                    to={`/knowledge/${document.id}`}

                    className="
                      card
                      block
                      p-6
                      transition
                      hover:border-[var(--wood-accent)]
                    "

                  >

                    <div className="flex items-start justify-between gap-4">

                      <h2 className="text-xl font-semibold">
                        {document.title}
                      </h2>


                      <div className="flex shrink-0 items-center gap-3">

                        <StatusBadge status={document.status} />


                        <button

                          type="button"

                          onClick={
                            event =>
                              deleteDocument(
                                event,
                                document.id,
                              )
                          }

                          className="text-sm text-red-400 hover:text-red-300"

                        >
                          Poista
                        </button>

                      </div>

                    </div>



                    <p className="mt-3 text-sm text-[var(--wood-muted)]">
                      {document.topic || "Yleinen"}
                    </p>



                    <p className="mt-4 line-clamp-3 text-sm">
                      {document.content}
                    </p>



                    <div className="mt-5 flex flex-wrap items-center gap-2">

                      {
                        document.folder && (

                          <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                            ▣ {document.folder}
                          </span>

                        )
                      }


                      {
                        document.author && (

                          <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                            {document.author}
                          </span>

                        )
                      }


                      <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                        {document._count?.chunks || 0} katkelmaa
                      </span>


                      {
                        document.alwaysUse && (

                          <span className="rounded-full bg-[var(--wood-accent)]/10 px-3 py-1 text-xs text-[var(--wood-accent)]">
                            CORE
                          </span>

                        )
                      }

                    </div>


                  </Link>

                )
              )
            }


          </div>

        )

      }




      {
        !loading &&
        visibleCount < filteredDocuments.length && (

          <div className="flex justify-center">

            <button

              type="button"

              onClick={() =>
                setVisibleCount(
                  count => count + PAGE_SIZE
                )
              }

              className="wb-button"

            >
              Näytä lisää
              {" "}
              ({visibleDocuments.length}
              {" / "}
              {filteredDocuments.length})
            </button>

          </div>

        )
      }


    </div>

  )

}




function Stat({
  label,
  value,
}) {

  return (

    <div className="card p-5">

      <p className="text-sm text-[var(--wood-muted)]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold">
        {value}
      </p>

    </div>

  )

}




function StatusBadge({
  status,
}) {

  const classes = {

    Luonnos:
      "bg-[var(--wood-card)] text-[var(--wood-muted)]",

    Tarkistettava:
      "bg-[var(--wood-accent)]/10 text-[var(--wood-accent)]",

    Hyväksytty:
      "bg-green-500/10 text-green-400",

    Arkistoitu:
      "bg-[var(--wood-card)] text-[var(--wood-muted)]",

  }

  return (

    <span
      className={
        `rounded-full px-3 py-1 text-xs font-medium ${
          classes[status] ||
          "bg-[var(--wood-card)] text-[var(--wood-muted)]"
        }`
      }
    >
      {status || "Tuntematon"}
    </span>

  )

}




export default Knowledge
