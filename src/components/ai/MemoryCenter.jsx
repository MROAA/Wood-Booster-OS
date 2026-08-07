import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
  apiPost,
} from "../../api/client"



const PAGE_SIZE = 12




function MemoryCenter() {


  const [
    proposals,
    setProposals,
  ] = useState([])



  const [
    memories,
    setMemories,
  ] = useState([])



  const [
    search,
    setSearch,
  ] = useState("")



  const [
    category,
    setCategory,
  ] = useState("all")



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState("")



  const [
    visibleCount,
    setVisibleCount,
  ] = useState(PAGE_SIZE)







  async function loadMemory() {


    try {


      setError("")


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


    }

    catch(error) {


      console.error(
        "Memory error:",
        error
      )


      setError(
        "Muistin lataaminen epäonnistui."
      )


    }

    finally {


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







  async function deleteMemory(id) {


    const confirmed =
      window.confirm(
        "Poistetaanko tämä muisto?"
      )


    if(!confirmed) {

      return

    }



    await fetch(
      `http://localhost:3001/api/memory/${id}`,
      {
        method:
          "DELETE",
      }
    )


    loadMemory()


  }







  const categories = [

    "all",

    ...new Set(
      memories
        .map(
          memory =>
            memory.category
        )
        .filter(Boolean)
    ),

  ]







  const filteredMemories =

    memories.filter(
      memory => {


        const text =

          `
          ${memory.key}
          ${memory.content}
          `
            .toLowerCase()



        const matchesSearch =

          text.includes(
            search.toLowerCase()
          )



        const matchesCategory =

          category === "all"

          ||

          memory.category === category



        return (
          matchesSearch &&
          matchesCategory
        )


      }
    )



  useEffect(() => {

    setVisibleCount(PAGE_SIZE)

  }, [search, category])



  const visibleMemories =

    filteredMemories.slice(
      0,
      visibleCount,
    )







  const averageImportance =

    memories.length

    ?

    Math.round(

      memories.reduce(
        (
          sum,
          memory
        ) =>
          sum + Number(
            memory.importance || 0
          ),

        0

      )

      /

      memories.length

    )

    :

    0







  if(loading) {


    return (

      <div className="panel p-6">

        Ladataan Memory Layeria...

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

          <div className="
            panel
            p-5
            text-red-400
          ">

            {error}

          </div>

        )
      }







      <section className="
        panel
        p-6
      ">


        <p className="
          text-xs
          uppercase
          tracking-wider
          text-[var(--wb-text-muted)]
        ">

          Memory Layer

        </p>


        <h2 className="
          mt-2
          text-2xl
          font-semibold
        ">

          ⬢ Memory Center

        </h2>


        <p className="
          mt-2
          text-sm
          text-[var(--wb-text-muted)]
        ">

          Spacemonkeyn pitkäkestoinen
          muisti ja käyttäjän hyväksymä tieto.

        </p>


      </section>







      <section className="
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-4
      ">


        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">

            Memories

          </p>

          <p className="mt-3 text-3xl font-semibold">

            {memories.length}

          </p>

        </div>




        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">

            Proposals

          </p>

          <p className="mt-3 text-3xl font-semibold">

            {proposals.length}

          </p>

        </div>




        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">

            Categories

          </p>

          <p className="mt-3 text-3xl font-semibold">

            {categories.length - 1}

          </p>

        </div>




        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">

            Importance

          </p>

          <p className="
            mt-3
            text-3xl
            font-semibold
            text-[var(--wb-copper)]
          ">

            {averageImportance}

          </p>

        </div>


      </section>







      <section className="
        panel
        p-6
      ">


        <h3 className="text-xl font-semibold">

          Memory Proposals

        </h3>



        <div className="mt-5 space-y-4">


          {
            proposals.length === 0

            ?

            <p className="text-[var(--wb-text-muted)]">

              Ei odottavia muistiehdotuksia.

            </p>

            :

            proposals.map(
              proposal => (

                <article
                  key={proposal.id}
                  className="card p-5"
                >

                  <h4 className="font-semibold">

                    {proposal.key}

                  </h4>


                  <p className="mt-3 text-sm">

                    {proposal.content}

                  </p>


                  <div className="mt-4 flex gap-3">


                    <button
                      onClick={() =>
                        approve(
                          proposal.id
                        )
                      }
                      className="wb-button"
                    >

                      Hyväksy

                    </button>


                    <button
                      onClick={() =>
                        reject(
                          proposal.id
                        )
                      }
                      className="
                        rounded-xl
                        border
                        px-4
                        py-2
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







      <section className="
        panel
        p-6
      ">


        <div className="
          flex
          gap-4
          flex-col
          md:flex-row
        ">


          <input

            value={search}

            onChange={
              e =>
                setSearch(
                  e.target.value
                )
            }

            placeholder="Hae muistista..."

            className="
              w-full
              rounded-xl
              border
              border-neutral-700
              bg-neutral-950
              px-4
              py-3
            "

          />



          <select

            value={category}

            onChange={
              e =>
                setCategory(
                  e.target.value
                )
            }

            className="
              rounded-xl
              border
              border-neutral-700
              bg-neutral-950
              px-4
            "

          >

            {
              categories.map(
                item => (

                  <option
                    key={item}
                  >

                    {item}

                  </option>

                )
              )
            }

          </select>


        </div>







        <div className="mt-6 space-y-4">


          {
            visibleMemories.map(
              memory => (

                <article

                  key={
                    memory.id
                  }

                  className="
                    card
                    p-5
                  "

                >

                  <div className="
                    flex
                    justify-between
                  ">


                    <h3 className="font-semibold">

                      {memory.key}

                    </h3>


                    <span>

                      ⭐ {memory.importance}

                    </span>


                  </div>



                  <p className="
                    mt-2
                    text-xs
                    text-[var(--wb-text-muted)]
                  ">

                    {memory.category}

                  </p>



                  <p className="
                    mt-3
                    line-clamp-3
                    text-sm
                  ">

                    {memory.content}

                  </p>



                  <button

                    onClick={() =>
                      deleteMemory(
                        memory.id
                      )
                    }

                    className="
                      mt-4
                      rounded-xl
                      border
                      border-red-900
                      px-4
                      py-2
                      text-red-400
                    "

                  >

                    ✕ Poista

                  </button>


                </article>

              )

            )

          }


        </div>



        {
          visibleCount < filteredMemories.length && (

            <div className="
              mt-6
              flex
              justify-center
            ">

              <button

                onClick={() =>
                  setVisibleCount(
                    count => count + PAGE_SIZE
                  )
                }

                className="wb-button"

              >

                Näytä lisää
                {" "}
                ({visibleMemories.length}
                {" / "}
                {filteredMemories.length})

              </button>

            </div>

          )
        }


      </section>


    </div>

  )

}


export default MemoryCenter
