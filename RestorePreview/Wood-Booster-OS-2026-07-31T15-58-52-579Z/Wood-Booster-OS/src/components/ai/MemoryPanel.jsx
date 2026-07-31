import {
  useCallback,
  useEffect,
  useState,
} from "react"


const API_URL =
  "http://localhost:3001/api"


function formatDate(value) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat(
    "fi-FI",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  )
}


function MemoryPanel() {
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
    actionId,
    setActionId,
  ] = useState(null)

  const [
    error,
    setError,
  ] = useState("")

  const [
    message,
    setMessage,
  ] = useState("")


  const loadMemoryData =
    useCallback(async () => {
      setLoading(true)
      setError("")

      try {
        const [
          proposalResponse,
          memoryResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/memory/proposals`,
          ),

          fetch(
            `${API_URL}/memory`,
          ),
        ])

        const proposalData =
          await proposalResponse.json()

        const memoryData =
          await memoryResponse.json()

        if (!proposalResponse.ok) {
          throw new Error(
            proposalData.error ||
            "Muistiehdotusten hakeminen epäonnistui.",
          )
        }

        if (!memoryResponse.ok) {
          throw new Error(
            memoryData.error ||
            "Muistien hakeminen epäonnistui.",
          )
        }

        setProposals(
          Array.isArray(
            proposalData.proposals,
          )
            ? proposalData.proposals
            : [],
        )

        setMemories(
          Array.isArray(
            memoryData.memories,
          )
            ? memoryData.memories
            : [],
        )
      }

      catch (loadError) {
        setError(
          loadError.message ||
          "Muistitietojen hakeminen epäonnistui.",
        )
      }

      finally {
        setLoading(false)
      }
    }, [])


  useEffect(() => {
    loadMemoryData()
  }, [
    loadMemoryData,
  ])


  async function handleProposalAction(
    proposalId,
    action,
  ) {
    setActionId(proposalId)
    setError("")
    setMessage("")

    try {
      const response =
        await fetch(
          `${API_URL}/memory/proposals/${proposalId}/${action}`,
          {
            method: "POST",
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Muistiehdotuksen käsittely epäonnistui.",
        )
      }

      if (action === "approve") {
        setMessage(
          "Muistiehdotus hyväksyttiin ja tallennettiin muistiin.",
        )
      }

      else {
        setMessage(
          "Muistiehdotus hylättiin.",
        )
      }

      await loadMemoryData()
    }

    catch (actionError) {
      setError(
        actionError.message ||
        "Muistiehdotuksen käsittely epäonnistui.",
      )
    }

    finally {
      setActionId(null)
    }
  }


  async function handleDeleteMemory(
    memoryId,
  ) {
    const confirmed =
      window.confirm(
        "Poistetaanko tämä muisti pysyvästi?",
      )

    if (!confirmed) {
      return
    }

    setActionId(
      `memory-${memoryId}`,
    )

    setError("")
    setMessage("")

    try {
      const response =
        await fetch(
          `${API_URL}/memory/${memoryId}`,
          {
            method: "DELETE",
          },
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Muistin poistaminen epäonnistui.",
        )
      }

      setMessage(
        "Muisti poistettiin.",
      )

      await loadMemoryData()
    }

    catch (deleteError) {
      setError(
        deleteError.message ||
        "Muistin poistaminen epäonnistui.",
      )
    }

    finally {
      setActionId(null)
    }
  }


  return (
    <div className="space-y-6">
      <section
        className="
          rounded-2xl
          border
          border-neutral-800
          bg-neutral-900
          p-6
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-start
            justify-between
            gap-4
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              🧠 Memory Manager
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                text-neutral-400
              "
            >
              Tarkista AI Brainin ehdottamat
              muistot ennen niiden hyväksymistä.
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadMemoryData
            }
            disabled={
              loading
            }
            className="
              rounded-xl
              border
              border-neutral-700
              bg-neutral-800
              px-4
              py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-neutral-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading
              ? "Ladataan..."
              : "Päivitä"}
          </button>
        </div>

        {error && (
          <div
            className="
              mt-5
              rounded-xl
              border
              border-red-900
              bg-red-950/40
              px-4
              py-3
              text-sm
              text-red-300
            "
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="
              mt-5
              rounded-xl
              border
              border-emerald-900
              bg-emerald-950/40
              px-4
              py-3
              text-sm
              text-emerald-300
            "
          >
            {message}
          </div>
        )}
      </section>

      <section
        className="
          rounded-2xl
          border
          border-neutral-800
          bg-neutral-900
          p-6
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >
              Odottavat muistiehdotukset
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-neutral-500
              "
            >
              Näitä ei ole vielä tallennettu
              pysyvään muistiin.
            </p>
          </div>

          <span
            className="
              rounded-full
              bg-amber-500/10
              px-3
              py-1
              text-sm
              font-medium
              text-amber-400
            "
          >
            {proposals.length}
          </span>
        </div>

        {loading ? (
          <p
            className="
              mt-6
              text-sm
              text-neutral-400
            "
          >
            Haetaan muistiehdotuksia...
          </p>
        ) : proposals.length === 0 ? (
          <div
            className="
              mt-6
              rounded-xl
              border
              border-dashed
              border-neutral-700
              p-5
              text-sm
              text-neutral-500
            "
          >
            Ei odottavia muistiehdotuksia.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {proposals.map(
              (proposal) => {
                const processing =
                  actionId ===
                  proposal.id

                return (
                  <article
                    key={
                      proposal.id
                    }
                    className="
                      rounded-xl
                      border
                      border-neutral-800
                      bg-neutral-950
                      p-5
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-blue-500/10
                              px-2.5
                              py-1
                              text-xs
                              font-medium
                              text-blue-300
                            "
                          >
                            {proposal.category}
                          </span>

                          <span
                            className="
                              rounded-full
                              bg-neutral-800
                              px-2.5
                              py-1
                              text-xs
                              text-neutral-300
                            "
                          >
                            Tärkeys:
                            {" "}
                            {proposal.importance}
                          </span>
                        </div>

                        <h4
                          className="
                            mt-4
                            font-semibold
                            text-white
                          "
                        >
                          {proposal.key}
                        </h4>

                        <p
                          className="
                            mt-2
                            whitespace-pre-wrap
                            text-sm
                            leading-6
                            text-neutral-300
                          "
                        >
                          {proposal.content}
                        </p>

                        <p
                          className="
                            mt-4
                            text-xs
                            text-neutral-600
                          "
                        >
                          Luotu:
                          {" "}
                          {formatDate(
                            proposal.createdAt,
                          )}
                        </p>
                      </div>

                      <div
                        className="
                          flex
                          shrink-0
                          flex-wrap
                          gap-2
                        "
                      >
                        <button
                          type="button"
                          disabled={
                            processing
                          }
                          onClick={() =>
                            handleProposalAction(
                              proposal.id,
                              "approve",
                            )
                          }
                          className="
                            rounded-xl
                            bg-emerald-600
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-emerald-500
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {processing
                            ? "Käsitellään..."
                            : "Hyväksy"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            processing
                          }
                          onClick={() =>
                            handleProposalAction(
                              proposal.id,
                              "reject",
                            )
                          }
                          className="
                            rounded-xl
                            border
                            border-red-900
                            bg-red-950/30
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-red-300
                            transition
                            hover:bg-red-950/60
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          Hylkää
                        </button>
                      </div>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </section>

      <section
        className="
          rounded-2xl
          border
          border-neutral-800
          bg-neutral-900
          p-6
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >
              Hyväksytyt muistot
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-neutral-500
              "
            >
              AI Brain voi käyttää näitä
              keskustelujen yhteydessä.
            </p>
          </div>

          <span
            className="
              rounded-full
              bg-emerald-500/10
              px-3
              py-1
              text-sm
              font-medium
              text-emerald-400
            "
          >
            {memories.length}
          </span>
        </div>

        {loading ? (
          <p
            className="
              mt-6
              text-sm
              text-neutral-400
            "
          >
            Haetaan hyväksyttyjä muistoja...
          </p>
        ) : memories.length === 0 ? (
          <div
            className="
              mt-6
              rounded-xl
              border
              border-dashed
              border-neutral-700
              p-5
              text-sm
              text-neutral-500
            "
          >
            Hyväksyttyjä muistoja ei vielä ole.
          </div>
        ) : (
          <div
            className="
              mt-6
              grid
              gap-4
              xl:grid-cols-2
            "
          >
            {memories.map(
              (memory) => {
                const deleting =
                  actionId ===
                  `memory-${memory.id}`

                return (
                  <article
                    key={
                      memory.id
                    }
                    className="
                      rounded-xl
                      border
                      border-neutral-800
                      bg-neutral-950
                      p-5
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
                      <div className="min-w-0">
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-emerald-500/10
                              px-2.5
                              py-1
                              text-xs
                              font-medium
                              text-emerald-300
                            "
                          >
                            {memory.category}
                          </span>

                          <span
                            className="
                              text-xs
                              text-neutral-600
                            "
                          >
                            Tärkeys:
                            {" "}
                            {memory.importance}
                          </span>
                        </div>

                        <h4
                          className="
                            mt-4
                            font-semibold
                            text-white
                          "
                        >
                          {memory.key}
                        </h4>

                        <p
                          className="
                            mt-2
                            whitespace-pre-wrap
                            text-sm
                            leading-6
                            text-neutral-300
                          "
                        >
                          {memory.content}
                        </p>

                        <p
                          className="
                            mt-4
                            text-xs
                            text-neutral-600
                          "
                        >
                          Päivitetty:
                          {" "}
                          {formatDate(
                            memory.updatedAt,
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          deleting
                        }
                        onClick={() =>
                          handleDeleteMemory(
                            memory.id,
                          )
                        }
                        className="
                          shrink-0
                          rounded-lg
                          border
                          border-neutral-800
                          px-3
                          py-2
                          text-xs
                          text-neutral-400
                          transition
                          hover:border-red-900
                          hover:text-red-300
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {deleting
                          ? "Poistetaan..."
                          : "Poista"}
                      </button>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </section>
    </div>
  )
}


export default MemoryPanel
