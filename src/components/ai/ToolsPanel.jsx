import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"




function ToolsPanel() {


  const [
    tools,
    setTools,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState("")







  async function loadTools() {


    try {


      setError("")


      const response =
        await fetch(
          `${API_URL}/tools`
        )


      const data =
        await response.json()



      setTools(
        data.tools || []
      )


    }

    catch(error) {


      console.error(
        "Tool loading error:",
        error
      )


      setError(
        "Työkalujen lataaminen epäonnistui."
      )


    }

    finally {


      setLoading(false)


    }


  }







  useEffect(() => {


    loadTools()


  }, [])







  const readyTools =
    tools.filter(
      tool =>
        tool.status === "Ready"
    )







  if(loading) {


    return (

      <div className="panel p-6">

        Ladataan työkaluja...

      </div>

    )

  }







  return (

    <div
      className="
        space-y-6
      "
    >



      {
        error && (

          <div
            className="
              panel
              p-5
              text-red-400
            "
          >

            {error}

          </div>

        )
      }







      <section
        className="
          panel
          p-6
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-[var(--wb-text-muted)]
          "
        >

          Capability Layer

        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >

          ▨ Tools

        </h2>


        <p
          className="
            mt-2
            text-sm
            text-[var(--wb-text-muted)]
          "
        >

          Spacemonkeyn kyvykkyydet
          Tool Registry -järjestelmästä.

        </p>


      </section>







      <section
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        "
      >

        <div className="card">

          <p className="
            text-sm
            text-[var(--wb-text-muted)]
          ">

            Total Tools

          </p>


          <p className="
            mt-3
            text-3xl
            font-semibold
          ">

            {tools.length}

          </p>

        </div>




        <div className="card">

          <p className="
            text-sm
            text-[var(--wb-text-muted)]
          ">

            Ready

          </p>


          <p className="
            mt-3
            text-3xl
            font-semibold
            text-[var(--wb-copper)]
          ">

            {readyTools.length}

          </p>

        </div>


      </section>







      <section
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-4
        "
      >


        {
          tools.map(

            tool => (

              <article

                key={
                  tool.id
                }

                className="
                  card
                  p-5
                "

              >

                <div
                  className="
                    flex
                    justify-between
                    gap-4
                  "
                >

                  <h3 className="
                    font-semibold
                    flex
                    gap-2
                    items-center
                  ">

                    <span>

                      {tool.icon}

                    </span>


                    {tool.name}

                  </h3>


                  <span
                    className="
                      rounded-full
                      border
                      border-[var(--wb-grey-dark)]
                      px-3
                      py-1
                      text-xs
                      text-[var(--wb-copper)]
                    "
                  >

                    {tool.status}

                  </span>


                </div>





                <p className="
                  mt-3
                  text-sm
                  text-[var(--wb-text-muted)]
                ">

                  {tool.description}

                </p>





                <div className="
                  mt-4
                  space-y-2
                  text-sm
                ">


                  <p>

                    Version:
                    {" "}
                    {tool.version}

                  </p>


                  <p>

                    Layer:
                    {" "}
                    {tool.layer}

                  </p>


                  <p>

                    Capability:
                    {" "}
                    {tool.capability}

                  </p>


                </div>


              </article>

            )

          )

        }


      </section>


    </div>

  )

}


export default ToolsPanel
