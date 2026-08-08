import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  apiGet,
  apiPost,
  apiDelete,
} from "../api/client"
import { DataMemoryModule } from "../components/DataMemoryModule"


const PAGE_SIZE = 12



function Memory() {


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


  const [
    error,
    setError,
  ] = useState("")


  const [
    search,
    setSearch,
  ] = useState("")


  const [
    category,
    setCategory,
  ] = useState("all")


  const [
    visibleCount,
    setVisibleCount,
  ] = useState(PAGE_SIZE)




  async function loadMemory() {

    try {

      setLoading(true)

      setError("")


      const [
        proposalData,
        memoryData,
      ] =
        await Promise.all([
          apiGet("/memory/proposals"),
          apiGet("/memory"),
        ])


      setProposals(
        proposalData.proposals || []
      )


      setMemories(
        memoryData.memories || []
      )

    } catch(loadError) {

      console.error(
        "Memory loading error:",
        loadError
      )

      setError(
        loadError.message ||
        "Muistin lataaminen epäonnistui."
      )

    } finally {

      setLoading(false)

    }

  }




  useEffect(() => {

    loadMemory()

  }, [])




  async function approve(id) {

    try {

      setError("")

      await apiPost(
        `/memory/proposals/${id}/approve`,
        {}
      )

      await loadMemory()

    } catch(approveError) {

      console.error(
        "Memory approve error:",
        approveError
      )

      setError(
        approveError.message ||
        "Muistiehdotuksen hyväksyminen epäonnistui."
      )

    }

  }




  async function reject(id) {

    try {

      setError("")

      await apiPost(
        `/memory/proposals/${id}/reject`,
        {}
      )

      await loadMemory()

    } catch(rejectError) {

      console.error(
        "Memory reject error:",
        rejectError
      )

      setError(
        rejectError.message ||
        "Muistiehdotuksen hylkääminen epäonnistui."
      )

    }

  }




  async function deleteMemory(id) {

    const shouldDelete =
      window.confirm(
        "Poistetaanko tämä muisto?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      setError("")

      await apiDelete(
        `/memory/${id}`
      )


      setMemories(
        current =>
          current.filter(
            memory =>
              memory.id !== id
          )
      )

    } catch(deleteError) {

      console.error(
        "Memory delete error:",
        deleteError
      )

      setError(
        deleteError.message ||
        "Muiston poistaminen epäonnistui."
      )

    }

  }




  const categories =
    useMemo(
      () => [

        "all",

        ...new Set(
          memories
            .map(
              memory =>
                memory.category
            )
            .filter(Boolean)
        ),

      ],
      [memories]
    )




  const filteredMemories =
    useMemo(
      () =>

        memories.filter(
          memory => {

            const query =
              search.trim().toLowerCase()


            const matchesSearch =

              !query ||

              [
                memory.key,
                memory.content,
                memory.category,
              ]
                .join(" ")
                .toLowerCase()
                .includes(query)


            const matchesCategory =

              category === "all" ||
              memory.category === category


            return (
              matchesSearch &&
              matchesCategory
            )

          }
        ),

      [
        memories,
        search,
        category,
      ]
    )




  useEffect(() => {

    setVisibleCount(PAGE_SIZE)

  }, [search, category])




  const visibleMemories =
    filteredMemories.slice(
      0,
      visibleCount,
    )




  const stats =
    useMemo(
      () => {

        const averageImportance =
          memories.length > 0
            ?
            Math.round(
              (
                memories.reduce(
                  (total, memory) =>
                    total + (memory.importance || 0),
                  0
                ) /
                memories.length
              ) * 10
            ) / 10
            :
            0


        return {

          total:
            memories.length,

          pending:
            proposals.length,

          categories:
            categories.filter(
              item => item !== "all"
            ).length,

          averageImportance,

        }

      },
      [
        memories,
        proposals,
        categories,
      ]
    )




  return (

    <div className="space-y-8">


      <header>

        <h1 className="page-title">
          ⬢ Memory
        </h1>


        <p className="page-description">
          Tekoälyn pitkäaikainen muisti. Hyväksy tai hylkää
          ehdotukset, ja hallitse jo hyväksyttyjä muistoja.
        </p>

      </header>




      <section
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
        "
      >

        <Stat
          label="Muistoja"
          value={stats.total}
        />

        <Stat
          label="Odottavia ehdotuksia"
          value={stats.pending}
        />

        <Stat
          label="Kategorioita"
          value={stats.categories}
        />

        <Stat
          label="Keskimääräinen tärkeys"
          value={stats.averageImportance}
        />

      </section>




      {
        error && (

          <div className="panel text-red-400">
            {error}
          </div>

        )
      }




      <section>

        <h2 className="mb-4 text-lg font-semibold">
          Odottavat ehdotukset
        </h2>


        {
          loading

          ?

          (

            <div className="panel p-6">
              Ladataan...
            </div>

          )

          :

          proposals.length === 0

          ?

          (

            <div className="panel p-6 text-sm text-[var(--wood-muted)]">
              Ei odottavia muistiehdotuksia.
            </div>

          )

          :

          (

            <div className="space-y-4">

              {
                proposals.map(
                  proposal => (

                    <article
                      key={proposal.id}
                      className="card p-5"
                    >

                      <p>
                        {proposal.content}
                      </p>


                      <div className="mt-3 flex flex-wrap gap-2">

                        {
                          proposal.category && (

                            <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                              {proposal.category}
                            </span>

                          )
                        }


                        <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                          Tärkeys: {proposal.importance}
                        </span>

                      </div>



                      <div className="mt-4 flex gap-3">

                        <button

                          type="button"

                          onClick={() =>
                            approve(proposal.id)
                          }

                          className="wb-button"

                        >
                          Hyväksy
                        </button>


                        <button

                          type="button"

                          onClick={() =>
                            reject(proposal.id)
                          }

                          className="text-sm text-red-400 hover:text-red-300"

                        >
                          Hylkää
                        </button>


                      </div>


                    </article>

                  )
                )
              }

            </div>

          )

        }


      </section>




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

          placeholder="Hae muistoista..."

          value={search}

          onChange={
            e =>
              setSearch(e.target.value)
          }

        />


        <select

          className="wb-input md:w-64"

          value={category}

          onChange={
            e =>
              setCategory(e.target.value)
          }

        >

          {
            categories.map(
              item => (

                <option
                  key={item}
                  value={item}
                >
                  {
                    item === "all"
                    ?
                    "Kaikki kategoriat"
                    :
                    item
                  }
                </option>

              )
            )
          }

        </select>


      </section>




      <section>

        <h2 className="mb-4 text-lg font-semibold">
          Hyväksytyt muistot
        </h2>


        {
          loading

          ?

          (

            <div className="panel p-6">
              Ladataan...
            </div>

          )

          :

          filteredMemories.length === 0

          ?

          (

            <div className="panel p-6 text-sm text-[var(--wood-muted)]">
              Ei muistoja hakuehdoilla.
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
                visibleMemories.map(
                  memory => (

                    <article
                      key={memory.id}
                      className="card p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <p className="line-clamp-3 flex-1">
                          {memory.content}
                        </p>


                        <button

                          type="button"

                          onClick={() =>
                            deleteMemory(memory.id)
                          }

                          className="shrink-0 text-sm text-red-400 hover:text-red-300"

                        >
                          Poista
                        </button>

                      </div>



                      <div className="mt-3 flex flex-wrap items-center gap-2">

                        {
                          memory.category && (

                            <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                              {memory.category}
                            </span>

                          )
                        }


                        <span className="rounded-full bg-[var(--wood-card)] px-3 py-1 text-xs text-[var(--wood-muted)]">
                          Tärkeys: {memory.importance}
                        </span>


                        {
                          memory.key && (

                            <span className="text-xs text-[var(--wood-muted)]">
                              {memory.key}
                            </span>

                          )
                        }

                      </div>


                    </article>

                  )
                )
              }

            </div>

          )

        }




        {
          !loading &&
          visibleCount < filteredMemories.length && (

            <div className="mt-6 flex justify-center">

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
                ({visibleMemories.length}
                {" / "}
                {filteredMemories.length})
              </button>

            </div>

          )
        }


      </section>
<DataMemoryModule/>

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




export default Memory
