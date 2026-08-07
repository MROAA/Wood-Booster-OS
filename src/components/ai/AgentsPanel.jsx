import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"




function AgentsPanel() {


  const [
    agents,
    setAgents,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState("")







  async function loadAgents() {

    try {

      setError("")


      const response =
        await fetch(
          `${API_URL}/agents`
        )


      const data =
        await response.json()



      setAgents(
        data.agents || []
      )


    }

    catch(error) {


      console.error(
        "Agent loading error:",
        error
      )


      setError(
        "Agenttien lataaminen epäonnistui."
      )


    }

    finally {

      setLoading(false)

    }

  }







  useEffect(() => {

    loadAgents()

  }, [])







  const activeAgents =
    agents.filter(
      agent =>
        agent.status === "Active"
    )







  if(loading) {

    return (

      <div className="panel p-6">

        Ladataan agentteja...

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
              text-red-400
              p-5
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

          Agent System

        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >

          ⬢ Agents

        </h2>


        <p
          className="
            mt-2
            text-sm
            text-[var(--wb-text-muted)]
          "
        >

          Spacemonkeyn aktiiviset agentit
          Agent Registry -järjestelmästä.

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

            Total Agents

          </p>


          <p className="
            mt-3
            text-3xl
            font-semibold
          ">

            {agents.length}

          </p>

        </div>



        <div className="card">

          <p className="
            text-sm
            text-[var(--wb-text-muted)]
          ">

            Active

          </p>


          <p className="
            mt-3
            text-3xl
            font-semibold
            text-[var(--wb-copper)]
          ">

            {activeAgents.length}

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
          agents.map(

            agent => (

              <article

                key={
                  agent.id
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

                  <div>


                    <h3 className="
                      font-semibold
                      flex
                      items-center
                      gap-2
                    ">

                      <span>

                        {agent.icon}

                      </span>


                      {agent.name}

                    </h3>


                    <p className="
                      mt-2
                      text-sm
                      text-[var(--wb-text-muted)]
                    ">

                      {agent.description}

                    </p>


                  </div>



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

                    {agent.status}

                  </span>


                </div>







                <div
                  className="
                    mt-5
                    space-y-2
                    text-sm
                  "
                >

                  <p>

                    Version:
                    {" "}
                    {agent.version}

                  </p>


                  <p>

                    Capability:
                    {" "}
                    {agent.capability}

                  </p>


                </div>







                <div className="mt-5">


                  <p className="
                    text-sm
                    text-[var(--wb-text-muted)]
                  ">

                    Capabilities

                  </p>


                  <div
                    className="
                      mt-2
                      flex
                      flex-wrap
                      gap-2
                    "
                  >

                    {
                      agent.capabilities?.map(
                        item => (

                          <span

                            key={item}

                            className="
                              rounded-lg
                              border
                              border-[var(--wb-grey-dark)]
                              px-2
                              py-1
                              text-xs
                            "

                          >

                            {item}

                          </span>

                        )

                      )
                    }

                  </div>


                </div>







                <div className="mt-5">


                  <p className="
                    text-sm
                    text-[var(--wb-text-muted)]
                  ">

                    Truth Sources

                  </p>


                  <div
                    className="
                      mt-2
                      space-y-1
                      text-sm
                    "
                  >

                    {
                      agent.truthSources?.map(
                        source => (

                          <p key={source}>

                            • {source}

                          </p>

                        )
                      )
                    }

                  </div>


                </div>


              </article>

            )

          )

        }


      </section>



    </div>

  )

}


export default AgentsPanel
