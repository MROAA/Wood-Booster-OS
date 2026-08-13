import {
  Link,
  useParams,
  useNavigate,
} from "react-router-dom"

import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPut,
  apiDelete,
} from "../api/client"



const statusOptions = [

  "Luonnos",
  "Tarkistettava",
  "Hyväksytty",
  "Arkistoitu",

]



function KnowledgeDocumentDetails() {


  const { id } = useParams()

  const navigate = useNavigate()


  const [
    document_,
    setDocument,
  ] = useState(null)


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState("")


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    saved,
    setSaved,
  ] = useState(false)


  const [
    form,
    setForm,
  ] = useState({

    title: "",
    topic: "",
    folder: "",
    tags: "",
    author: "",
    status: "Luonnos",
    priority: "3",
    confidence: "100",
    alwaysUse: false,
    content: "",

  })




  useEffect(() => {

    let cancelled = false


    setLoading(true)

    setError("")


    apiGet(`/knowledge/${id}`)
      .then(data => {

        if(cancelled) {

          return

        }


        setDocument(data)

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message ||
          "Dokumentin lataaminen epäonnistui."
        )

      })
      .finally(() => {

        if(!cancelled) {

          setLoading(false)

        }

      })


    return () => {

      cancelled = true

    }

  }, [id])




  useEffect(() => {

    if(!document_) {

      return

    }


    setForm({

      title:
        document_.title || "",

      topic:
        document_.topic || "",

      folder:
        document_.folder || "",

      tags:
        document_.tags || "",

      author:
        document_.author || "",

      status:
        document_.status || "Luonnos",

      priority:
        String(document_.priority ?? "3"),

      confidence:
        String(document_.confidence ?? "100"),

      alwaysUse:
        Boolean(document_.alwaysUse),

      content:
        document_.content || "",

    })


    setSaved(false)

  }, [document_?.id])




  function handleChange(
    event
  ) {

    const {
      name,
      value,
      type,
      checked,
    } = event.target


    setForm(
      current => ({

        ...current,

        [name]:
          type === "checkbox"
            ? checked
            : value,

      })
    )


    setSaved(false)

  }




  async function handleSubmit(
    event
  ) {

    event.preventDefault()


    if(!form.title.trim()) {

      setError(
        "Dokumentin otsikko puuttuu."
      )

      return

    }


    if(!form.content.trim()) {

      setError(
        "Dokumentin sisältö puuttuu."
      )

      return

    }


    try {

      setSaving(true)

      setError("")


      const updated =
        await apiPut(
          `/knowledge/${id}`,
          {

            title:
              form.title,

            topic:
              form.topic,

            folder:
              form.folder,

            tags:
              form.tags,

            author:
              form.author,

            status:
              form.status,

            priority:
              Number(form.priority) || 3,

            confidence:
              Number(form.confidence) || 100,

            alwaysUse:
              form.alwaysUse,

            content:
              form.content,

          }
        )


      setDocument(updated)

      setSaved(true)

    } catch(saveError) {

      setError(
        saveError.message ||
        "Dokumentin päivittäminen epäonnistui."
      )

    } finally {

      setSaving(false)

    }

  }




  async function handleDelete() {

    const shouldDelete =
      window.confirm(
        "Poistetaanko dokumentti?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      await apiDelete(
        `/knowledge/${id}`
      )


      navigate("/knowledge")

    } catch(deleteError) {

      setError(
        deleteError.message ||
        "Dokumentin poistaminen epäonnistui."
      )

    }

  }




  if(loading) {

    return (

      <div className="panel p-6">
        Ladataan dokumenttia...
      </div>

    )

  }




  if(error && !document_) {

    return (

      <div className="space-y-5">

        <Link
          to="/knowledge"
          className="text-[var(--wood-accent)]"
        >
          ← Knowledge Center
        </Link>


        <div className="panel p-6">
          {error}
        </div>

      </div>

    )

  }




  if(!document_) {

    return (

      <div className="panel p-6">
        Dokumenttia ei löytynyt.
      </div>

    )

  }




  return (

    <div className="space-y-8">


      <Link
        to="/knowledge"
        className="text-[var(--wood-accent)]"
      >
        ← Knowledge Center
      </Link>




      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >

        <div>

          <p className="text-sm uppercase tracking-widest text-[var(--wood-muted)]">
            Dokumentti
          </p>


          <h1 className="mt-3 text-4xl font-semibold">
            {document_.title}
          </h1>


          <p className="mt-2 text-sm text-[var(--wood-muted)]">
            {
              document_.chunks?.length || 0
            }
            {" "}
            katkelmaa
          </p>

        </div>



        <button

          type="button"

          onClick={handleDelete}

          className="wb-button shrink-0"

        >
          Poista dokumentti
        </button>


      </div>




      {
        error && (

          <div className="card border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">
            {error}
          </div>

        )
      }




      <section className="panel p-6">

        <h2 className="text-lg font-semibold">
          Dokumentin tiedot
        </h2>


        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >

          <label className="block">

            <span className="text-sm text-[var(--wood-muted)]">
              Otsikko
            </span>


            <input

              type="text"

              name="title"

              value={form.title}

              onChange={handleChange}

              required

              className="mt-2 wb-input"

            />

          </label>



          <div className="grid gap-4 md:grid-cols-2">

            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Aihe
              </span>


              <input

                type="text"

                name="topic"

                value={form.topic}

                onChange={handleChange}

                className="mt-2 wb-input"

              />

            </label>



            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Kansio
              </span>


              <input

                type="text"

                name="folder"

                value={form.folder}

                onChange={handleChange}

                className="mt-2 wb-input"

              />

            </label>



            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Tunnisteet
              </span>


              <input

                type="text"

                name="tags"

                value={form.tags}

                onChange={handleChange}

                className="mt-2 wb-input"

              />

            </label>



            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Tekijä
              </span>


              <input

                type="text"

                name="author"

                value={form.author}

                onChange={handleChange}

                className="mt-2 wb-input"

              />

            </label>



            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Tila
              </span>


              <select

                name="status"

                value={form.status}

                onChange={handleChange}

                className="mt-2 wb-input"

              >

                {
                  statusOptions.map(
                    option => (

                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>

                    )
                  )
                }

              </select>

            </label>



            <label className="flex items-center gap-3">

              <input

                type="checkbox"

                name="alwaysUse"

                checked={form.alwaysUse}

                onChange={handleChange}

              />


              <span className="text-sm text-[var(--wood-muted)]">
                Aina käytössä (CORE)
              </span>

            </label>



            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Prioriteetti
              </span>


              <input

                type="number"

                name="priority"

                value={form.priority}

                onChange={handleChange}

                className="mt-2 wb-input"

              />

            </label>



            <label>

              <span className="text-sm text-[var(--wood-muted)]">
                Luottamus (%)
              </span>


              <input

                type="number"

                name="confidence"

                value={form.confidence}

                onChange={handleChange}

                className="mt-2 wb-input"

              />

            </label>


          </div>



          <label className="block">

            <span className="text-sm text-[var(--wood-muted)]">
              Sisältö
            </span>


            <textarea

              name="content"

              rows={16}

              value={form.content}

              onChange={handleChange}

              className="mt-2 wb-input resize-y"

            />

          </label>



          <div className="flex flex-wrap items-center gap-4">

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
                "Tallenna muutokset"
              }

            </button>



            {
              saved && (

                <span className="text-sm font-medium text-green-400">
                  ✓ Muutokset tallennettu
                </span>

              )
            }


          </div>


        </form>


      </section>


    </div>

  )

}




export default KnowledgeDocumentDetails
