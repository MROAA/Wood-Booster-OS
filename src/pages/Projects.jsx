import {
  useEffect,
  useState,
} from "react"

import {
  Link,
  useNavigate,
} from "react-router-dom"

import {
  apiGet,
  apiPost,
} from "../api/client"



const emptyProject = {
  name: "",
  status: "Suunnittelu",
  notes: "",
}



function Projects() {


  const navigate =
    useNavigate()


  const [
    projects,
    setProjects,
  ] = useState([])


  const [
    form,
    setForm,
  ] = useState(emptyProject)


  const [
    showForm,
    setShowForm,
  ] = useState(false)


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState(null)



  async function loadProjects() {

    try {

      setLoading(true)

      const data =
        await apiGet("/projects")


      setProjects(data)


    } catch (error) {

      setError(
        error.message
      )

    } finally {

      setLoading(false)

    }

  }



  useEffect(() => {

    loadProjects()

  }, [])



  async function createProject() {

    if(
      !form.name.trim()
    ) {

      return

    }


    try {

      const response =
        await apiPost(
          "/projects",
          {
            name:
              form.name,

            status:
              form.status,

            notes:
              form.notes,
          }
        )


      setProjects(
        previous => [
          response.project,
          ...previous,
        ]
      )


      setForm(emptyProject)

      setShowForm(false)


    } catch(error) {

      setError(
        error.message
      )

    }

  }



  function updateField(
    field,
    value
  ) {

    setForm(
      previous => ({
        ...previous,
        [field]:
          value,
      })
    )

  }



  function shortText(text) {

    if(!text) {

      return ""

    }


    const clean =
      text
        .replace(
          /\s+/g,
          " "
        )
        .trim()


    if(clean.length > 180) {

      return (
        clean.slice(0,180) +
        "..."
      )

    }


    return clean

  }




  return (

    <div
      className="
        space-y-8
      "
    >


      <section
        className="
          flex
          items-start
          justify-between
        "
      >

        <div>

          <h1
            className="
              page-title
            "
          >
            Projektit
          </h1>


          <p
            className="
              page-description
            "
          >
            Wood-Booster OS:n projektityötila.
          </p>


        </div>



        <button

          className="
            wb-button
          "

          onClick={() =>
            setShowForm(
              !showForm
            )
          }

        >
          + Uusi projekti

        </button>


      </section>





      {
        showForm && (

          <section
            className="
              panel
              max-w-xl
              space-y-4
            "
          >

            <h2
              className="
                text-lg
                font-semibold
              "
            >
              Luo projekti
            </h2>


            <input

              className="
                wb-input
              "

              placeholder="Projektin nimi"

              value={
                form.name
              }

              onChange={
                e =>
                  updateField(
                    "name",
                    e.target.value
                  )
              }

            />


            <textarea

              className="
                wb-input
              "

              placeholder="Muistiinpanot"

              rows="4"

              value={
                form.notes
              }

              onChange={
                e =>
                  updateField(
                    "notes",
                    e.target.value
                  )
              }

            />


            <button

              className="
                wb-button
              "

              onClick={
                createProject
              }

            >
              Tallenna

            </button>


          </section>

        )

      }






      {
        error && (

          <div
            className="
              panel
              text-red-400
            "
          >
            {error}

          </div>

        )

      }






      <section>


        <h2
          className="
            mb-4
            text-lg
            font-semibold
          "
        >
          Projektit
        </h2>





        {
          loading

          ?

          <div className="panel">
            Ladataan projekteja...
          </div>


          :


          projects.length === 0

          ?

          <div className="panel">
            Ei vielä projekteja.
          </div>


          :


          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              xl:grid-cols-3
              gap-5
            "
          >

            {
              projects.map(
                project => (

                  <Link
                    key={
                      project.id
                    }

                    to={
                      `/projects/${project.id}`
                    }

                    className="
                      block
                    "
                  >

                    <article

                      className="
                        card
                        p-6
                        min-h-[220px]
                        transition
                        hover:border-[var(--wood-accent)]
                      "

                    >

                      <div
                        className="
                          flex
                          justify-between
                          gap-4
                        "
                      >

                        <h3
                          className="
                            text-xl
                            font-semibold
                          "
                        >
                          {project.name}
                        </h3>


                        <span
                          className="
                            text-sm
                            text-[var(--wood-accent)]
                          "
                        >
                          {project.status}
                        </span>


                      </div>





                      <div
                        className="
                          mt-6
                          space-y-4
                        "
                      >

                        <div>

                          <p
                            className="
                              text-xs
                              text-[var(--wood-muted)]
                            "
                          >
                            ASIAKAS
                          </p>

                          <p>
                            {
                              project.customer
                              ?
                              (

                                <span

                                  role="link"

                                  tabIndex={0}

                                  onClick={
                                    event => {

                                      event.preventDefault()
                                      event.stopPropagation()

                                      navigate(
                                        `/customers/${project.customer.id}`
                                      )

                                    }
                                  }

                                  className="
                                    text-[var(--wood-accent)]
                                    hover:opacity-80
                                  "

                                >

                                  {project.customer.name}

                                </span>

                              )
                              :
                              "-"
                            }
                          </p>

                        </div>




                        {
                          project.notes && (

                            <div>

                              <p
                                className="
                                  text-xs
                                  text-[var(--wood-muted)]
                                "
                              >
                                MUISTIINPANO
                              </p>


                              <p
                                className="
                                  mt-1
                                  text-sm
                                  leading-6
                                "
                              >
                                {
                                  shortText(
                                    project.notes
                                  )
                                }

                              </p>


                            </div>

                          )

                        }


                      </div>


                    </article>

                  </Link>

                )
              )
            }


          </div>


        }


      </section>


    </div>

  )

}


export default Projects
