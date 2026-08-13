import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
} from "../api/client"



function ProjectMemory() {


  const [
    proposals,
    setProposals,
  ] = useState([])


  const [
    memories,
    setMemories,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(true)







  async function loadMemory() {

    try {

      const proposalData =
        await apiGet(
          "/memory/proposals"
        )


      const memoryData =
        await apiGet(
          "/memory"
        )


      setProposals(
        proposalData.proposals || []
      )


      setMemories(
        memoryData.memories || []
      )


    } catch(error) {

      console.error(
        "Memory loading error:",
        error
      )

    } finally {

      setLoading(false)

    }

  }







  useEffect(() => {

    loadMemory()

  }, [])







  async function approve(id) {

    await apiPost(
      `/memory/proposals/${id}/approve`,
      {}
    )

    loadMemory()

  }







  async function reject(id) {

    await apiPost(
      `/memory/proposals/${id}/reject`,
      {}
    )

    loadMemory()

  }







  if(loading) {

    return (

      <div className="panel p-6">

        Ladataan muistia...

      </div>

    )

  }







  return (

    <div className="space-y-8">


      <section
        className="
          panel
          p-6
        "
      >

        <p className="text-xs uppercase tracking-wider text-[var(--wood-muted)]">

          Memory Layer

        </p>


        <h2 className="mt-2 text-2xl font-semibold">

          ⬢ Memory Proposals

        </h2>


        <p className="mt-2 text-[var(--wood-muted)]">

          Hyväksy tai hylkää Spacemonkeyn muistiehdotuksia.

        </p>





        <div className="mt-6 space-y-4">


          {
            proposals.length === 0

            ?

            <p className="text-[var(--wood-muted)]">

              Ei odottavia muistiehdotuksia.

            </p>


            :

            proposals.map(
              item => (

                <article

                  key={item.id}

                  className="
                    card
                    p-5
                  "

                >

                  <h3 className="font-semibold">

                    {item.key || "Muistiehdotus"}

                  </h3>


                  <p className="mt-3 text-sm leading-6">

                    {item.content}

                  </p>


                  <div className="mt-5 flex gap-3">


                    <button

                      onClick={() =>
                        approve(item.id)
                      }

                      className="wb-button"

                    >

                      Hyväksy

                    </button>


                    <button

                      onClick={() =>
                        reject(item.id)
                      }

                      className="
                        rounded-xl
                        border
                        border-red-900
                        px-4
                        py-2
                        text-red-400
                      "

                    >

                      Hylkää

                    </button>


                  </div>


                </article>

              )

            )

          }


        </div>


      </section>







      <section
        className="
          panel
          p-6
        "
      >

        <h2 className="text-2xl font-semibold">

          ⬢ Saved Memory

        </h2>


        <p className="mt-2 text-[var(--wood-muted)]">

          Spacemonkeyn hyväksytyt muistot.

        </p>





        <div className="mt-6 space-y-4">


          {
            memories.length === 0

            ?

            <p className="text-[var(--wood-muted)]">

              Ei tallennettua muistia.

            </p>


            :

            memories.map(
              memory => (

                <article

                  key={memory.id}

                  className="
                    card
                    p-5
                  "

                >

                  <div className="flex justify-between gap-4">

                    <span className="text-sm text-[var(--wood-muted)]">

                      {memory.category || "general"}

                    </span>


                    <span className="text-sm text-[var(--wood-muted)]">

                      Tärkeys:
                      {" "}
                      {memory.importance || 0}

                    </span>


                  </div>


                  <h3 className="mt-3 font-semibold">

                    {memory.key}

                  </h3>


                  <p className="mt-3 text-sm leading-6">

                    {memory.content}

                  </p>


                </article>

              )

            )

          }


        </div>


      </section>


    </div>

  )

}



export default ProjectMemory
