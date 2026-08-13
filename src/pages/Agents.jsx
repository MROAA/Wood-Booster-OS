import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
} from "../api/client"



function Agents() {


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




  useEffect(() => {

    let cancelled = false


    setLoading(true)

    setError("")


    apiGet("/agents")
      .then(data => {

        if(cancelled) {

          return

        }


        setAgents(
          data.agents || []
        )

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message ||
          "Agenttien lataaminen epäonnistui."
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

  }, [])




  const activeAgents =
    agents.filter(
      agent =>
        agent.status === "Active"
    )


  const truthSources =
    [
      ...new Set(
        agents.flatMap(
          agent =>
            agent.truthSources || []
        )
      ),
    ]




  return (

    <div className="space-y-8">


      <header>

        <h1 className="page-title">
          △ Agent Control Center
        </h1>


        <p className="page-description">
          Wood-Booster AI käyttää agenttireititystä valitakseen
          tehtävään parhaiten sopivan agentin. Agentit käyttävät
          Truth Layerin vahvistettua tietoa.
        </p>

      </header>




      <section
        className="
          grid
          grid-cols-1
          gap-4
          md:grid-cols-3
        "
      >

        <SummaryCard
          title="Active agents"
          value={activeAgents.length}
          description="Kaikki agentit käytettävissä"
        />

        <SummaryCard
          title="Routing"
          value="AUTO"
          description="Backend valitsee agentin"
        />

        <SummaryCard
          title="Truth Layer"
          value={truthSources.length}
          description="Vahvistettua tietolähdettä"
        />

      </section>




      {
        error && (

          <div className="panel text-red-400">
            {error}
          </div>

        )
      }




      {
        loading

        ?

        (

          <div className="panel p-6">
            Ladataan agentteja...
          </div>

        )

        :

        (

          <section
            className="
              grid
              grid-cols-1
              gap-6
              xl:grid-cols-2
            "
          >

            {
              agents.map(
                agent => (

                  <AgentCard
                    key={agent.id}
                    agent={agent}
                  />

                )
              )
            }

          </section>

        )

      }


    </div>

  )

}




function SummaryCard({
  title,
  value,
  description,
}) {

  return (

    <div className="card p-5">

      <p className="text-sm text-[var(--wood-muted)]">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-[var(--wood-muted)]">
        {description}
      </p>

    </div>

  )

}




function AgentCard({
  agent,
}) {

  const isActive =
    agent.status === "Active"


  return (

    <article className="card p-6">

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--wood-card)] text-2xl">
            {agent.icon}
          </div>


          <div>

            <h2 className="text-xl font-bold">
              {agent.name}
            </h2>


            <p
              className={
                isActive
                  ? "mt-1 text-sm text-green-400"
                  : "mt-1 text-sm text-[var(--wood-muted)]"
              }
            >
              ● {agent.status}
            </p>


            {
              agent.version && (

                <p className="mt-1 text-xs text-[var(--wood-muted)]">
                  v{agent.version}
                </p>

              )
            }

          </div>

        </div>


        <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
          {agent.id}
        </span>

      </div>



      {
        agent.capability && (

          <p className="mt-4 text-sm font-medium text-[var(--wood-accent)]">
            {agent.capability}
          </p>

        )
      }



      <p className="mt-3 leading-7 text-[var(--wood-muted)]">
        {agent.description}
      </p>



      <div className="mt-6">

        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
          Capabilities
        </h3>


        <div className="mt-3 space-y-2">

          {
            (agent.capabilities || []).map(
              capability => (

                <div
                  key={capability}
                  className="rounded-xl bg-[var(--wood-card)] px-4 py-3 text-sm"
                >
                  {capability}
                </div>

              )
            )
          }

        </div>

      </div>



      <div className="mt-6">

        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--wood-muted)]">
          Truth sources
        </h3>


        <div className="mt-3 flex flex-wrap gap-2">

          {
            (agent.truthSources || []).map(
              source => (

                <span
                  key={source}
                  className="rounded-full bg-[var(--wood-accent)]/10 px-3 py-1 text-sm text-[var(--wood-accent)]"
                >
                  {source}
                </span>

              )
            )
          }

        </div>

      </div>


    </article>

  )

}




export default Agents
