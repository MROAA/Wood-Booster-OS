import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
  apiDelete,
} from "../api/client"





function NotesTab({
  projectId,
}) {


  const [
    notes,
    setNotes,
  ] = useState([])



  const [
    showForm,
    setShowForm,
  ] = useState(false)



  const [
    form,
    setForm,
  ] = useState({

    title:
      "",

    content:
      "",

  })








  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState("")



  useEffect(() => {

    if(!projectId) {

      return

    }


    let cancelled = false


    setLoading(true)


    apiGet(`/projects/${projectId}/notes`)
      .then(data => {

        if(cancelled) {

          return

        }


        setNotes(
          data.notes || []
        )

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message
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

  },[
    projectId,
  ])







  function handleChange(
    event
  ) {


    const {
      name,
      value,
    } =
      event.target



    setForm(
      current => ({

        ...current,

        [name]:
          value,

      })
    )


  }







  // saveNotes removed: replaced by direct API calls in addNote/deleteNote







  async function addNote(
    event
  ) {


    event.preventDefault()



    const title =
      form.title.trim()



    const content =
      form.content.trim()



    if(
      !title &&
      !content
    ) {

      return

    }







    let data







    try {

      data =
        await apiPost(
          `/projects/${projectId}/notes`,
          {

            title:
              title ||
              "Muistiinpano",

            content,

          }
        )

    } catch(addError) {

      console.error(
        "Muistiinpanon lisays epaonnistui:",
        addError,
      )


      setError(
        addError.message
      )


      return

    }


    setNotes(
      current => [
        data.note,
        ...current,
      ]
    )







    setForm({

      title:
        "",

      content:
        "",

    })



    setShowForm(false)


  }







  async function deleteNote(
    noteId
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko tämä muistiinpano?"
      )



    if(
      !shouldDelete
    ) {

      return

    }



    try {

      await apiDelete(
        `/projects/${projectId}/notes/${noteId}`
      )


      setNotes(
        current =>
          current.filter(
            note =>
              note.id !== noteId
          )
      )

    } catch(deleteError) {

      console.error(
        "Muistiinpanon poisto epaonnistui:",
        deleteError,
      )


      setError(
        deleteError.message
      )

    }


  }







  return (

    <div
      className="
        space-y-6
      "
    >



      <section
        className="
          panel
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >

          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-wider
                text-[var(--wood-muted)]
              "
            >
              Notes
            </p>


            <h2
              className="
                mt-2
                text-2xl
                font-semibold
              "
            >
              Projektin muistiinpanot
            </h2>


            <p
              className="
                mt-2
                text-[var(--wood-muted)]
              "
            >
              Asiakkaan toiveet, materiaalit,
              ideat ja työn eteneminen.
            </p>

          </div>





          <button

            type="button"

            onClick={() =>
              setShowForm(true)
            }

            className="
              wb-button
            "

          >

            + Uusi muistiinpano

          </button>


        </div>
        {
          showForm && (

            <form
              onSubmit={
                addNote
              }

              className="
                mt-6
                rounded-2xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-bg)]
                p-5
              "
            >

              <label
                className="
                  block
                "
              >

                <span
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >
                  Otsikko
                </span>


                <input

                  type="text"

                  name="title"

                  value={
                    form.title
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="Esimerkiksi asiakkaan toiveet"

                  className="
                    wb-input
                    mt-2
                  "

                />

              </label>





              <label
                className="
                  mt-4
                  block
                "
              >

                <span
                  className="
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >
                  Muistiinpano
                </span>


                <textarea

                  name="content"

                  value={
                    form.content
                  }

                  onChange={
                    handleChange
                  }

                  rows="7"

                  placeholder="Kirjoita muistiinpano..."

                  className="
                    wb-input
                    mt-2
                    resize-y
                  "

                />


              </label>





              <div
                className="
                  mt-5
                  flex
                  justify-end
                  gap-3
                "
              >

                <button

                  type="button"

                  onClick={() => {

                    setShowForm(false)

                    setForm({

                      title:
                        "",

                      content:
                        "",

                    })

                  }}

                  className="
                    rounded-xl
                    border
                    border-[var(--wood-border)]
                    px-5
                    py-3
                    text-[var(--wood-muted)]
                  "

                >

                  Peruuta

                </button>




                <button

                  type="submit"

                  className="
                    wb-button
                  "

                >

                  Tallenna muistiinpano

                </button>


              </div>


            </form>

          )
        }


      </section>







      {
        error && (

          <div
            className="
              card
              border-red-900/60
              bg-red-950/30
              p-3
              text-sm
              text-red-300
            "
          >
            {error}
          </div>

        )
      }



      <section>

        {
          loading

          ?

          (

            <div
              className="
                panel
                p-6
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ladataan muistiinpanoja...

            </div>

          )

          :

          notes.length === 0

          ?

          (

            <EmptyNotes

              onCreate={() =>
                setShowForm(true)
              }

            />

          )


          :


          (

            <div
              className="
                grid
                gap-4
                lg:grid-cols-2
              "
            >

              {
                notes.map(

                  note => (

                    <NoteCard

                      key={
                        note.id
                      }

                      note={
                        note
                      }

                      onDelete={() =>
                        deleteNote(
                          note.id
                        )
                      }

                    />

                  )

                )
              }


            </div>

          )

        }


      </section>


    </div>

  )

}







function NoteCard({
  note,
  onDelete,
}) {


  return (

    <article
      className="
        card
        p-6
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <h3
            className="
              text-xl
              font-semibold
            "
          >

            {note.title}

          </h3>


          <p
            className="
              mt-2
              text-xs
              text-[var(--wood-muted)]
            "
          >

            {formatDate(note.createdAt)}

          </p>


        </div>





        <button

          type="button"

          onClick={
            onDelete
          }

          className="
            rounded-lg
            px-3
            py-2
            text-sm
            text-red-400
          "

        >

          Poista

        </button>


      </div>





      <p
        className="
          mt-5
          whitespace-pre-wrap
          leading-7
          text-[var(--wood-text)]
        "
      >

        {
          note.content ||
          "Ei sisältöä."
        }

      </p>


    </article>

  )

}







function EmptyNotes({
  onCreate,
}) {


  return (

    <div
      className="
        panel
        p-12
        text-center
      "
    >

      <p
        className="
          text-5xl
        "
      >
        📝
      </p>


      <h3
        className="
          mt-5
          text-xl
          font-semibold
        "
      >
        Ei muistiinpanoja vielä
      </h3>


      <p
        className="
          mx-auto
          mt-2
          max-w-lg
          text-[var(--wood-muted)]
        "
      >
        Lisää ensimmäinen muistiinpano projektiin.
      </p>




      <button

        type="button"

        onClick={
          onCreate
        }

        className="
          wb-button
          mt-6
        "

      >

        + Luo ensimmäinen muistiinpano

      </button>


    </div>

  )

}















function formatDate(
  dateValue
) {

  if(!dateValue) {

    return ""

  }



  return new Intl.DateTimeFormat(
    "fi-FI",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  )
  .format(
    new Date(dateValue)
  )

}







export default NotesTab
