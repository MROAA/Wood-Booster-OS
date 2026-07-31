import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"




function KnowledgePanel() {


  const [
    documents,
    setDocuments,
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
    folder,
    setFolder,
  ] = useState("all")







  async function loadKnowledge() {


    try {


      setError("")


      const response =
        await fetch(
          `${API_URL}/knowledge`
        )


      const data =
        await response.json()



      setDocuments(
        Array.isArray(data)
          ? data
          : []
      )


    }

    catch(error) {


      console.error(
        "Knowledge loading error:",
        error
      )


      setError(
        "Tietopankin lataaminen epäonnistui."
      )


    }

    finally {


      setLoading(false)


    }


  }







  useEffect(() => {


    loadKnowledge()


  }, [])







  const folders = [

    "all",

    ...new Set(
      documents
        .map(
          document =>
            document.folder
        )
        .filter(Boolean)
    ),

  ]







  const filteredDocuments =

    documents.filter(
      document => {


        const text =

          `
          ${document.title}
          ${document.content}
          ${document.topic}
          ${document.tags}
          `
            .toLowerCase()



        const matchesSearch =

          text.includes(
            search.toLowerCase()
          )



        const matchesFolder =

          folder === "all"

          ||

          document.folder === folder



        return (
          matchesSearch &&
          matchesFolder
        )


      }
    )







  const approvedCount =

    documents.filter(
      document =>
        document.status === "Hyväksytty"
    ).length



  const alwaysUseCount =

    documents.filter(
      document =>
        document.alwaysUse
    ).length



  const chunkCount =

    documents.reduce(

      (
        total,
        document
      ) =>

        total +
        (
          document._count?.chunks || 0
        ),

      0

    )







  if(loading) {


    return (

      <div className="panel p-6">

        Ladataan Knowledge Layeria...

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

          Knowledge Layer

        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >

          📚 Knowledge Center

        </h2>


        <p
          className="
            mt-2
            text-sm
            text-[var(--wb-text-muted)]
          "
        >

          Spacemonkeyn tietopohja,
          lähteet ja opittu tieto.

        </p>



        <div
          className="
            mt-6
            flex
            flex-col
            gap-4
            md:flex-row
          "
        >

          <input

            value={search}

            onChange={
              event =>
                setSearch(
                  event.target.value
                )
            }

            placeholder="Hae tietopankista..."

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

            value={folder}

            onChange={
              event =>
                setFolder(
                  event.target.value
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
              folders.map(
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


      </section>







      <section
        className="
          grid
          grid-cols-2
          lg:grid-cols-5
          gap-4
        "
      >

        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">
            Documents
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {documents.length}
          </p>

        </div>



        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">
            Visible
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {filteredDocuments.length}
          </p>

        </div>



        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">
            Approved
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {approvedCount}
          </p>

        </div>



        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">
            Chunks
          </p>

          <p className="mt-3 text-3xl font-semibold">
            {chunkCount}
          </p>

        </div>



        <div className="card">

          <p className="text-sm text-[var(--wb-text-muted)]">
            Always Use
          </p>

          <p className="mt-3 text-3xl font-semibold text-[var(--wb-copper)]">
            {alwaysUseCount}
          </p>

        </div>


      </section>







      <section
        className="
          space-y-4
        "
      >


        {
          filteredDocuments.map(

            document => (

              <article

                key={
                  document.id
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

                  <h3 className="font-semibold">

                    {document.title}

                  </h3>


                  {
                    document.alwaysUse && (

                      <span
                        className="
                          text-xs
                          text-[var(--wb-copper)]
                        "
                      >

                        CORE

                      </span>

                    )
                  }


                </div>



                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    gap-3
                    text-xs
                    text-[var(--wb-text-muted)]
                  "
                >

                  <span>
                    📁 {document.folder}
                  </span>

                  <span>
                    Status: {document.status}
                  </span>

                  <span>
                    Priority: {document.priority}
                  </span>

                  <span>
                    Confidence: {document.confidence}%
                  </span>

                  <span>
                    Chunks: {document._count?.chunks || 0}
                  </span>

                </div>



                <p
                  className="
                    mt-4
                    text-sm
                    leading-6
                  "
                >

                  {
                    document.content.slice(
                      0,
                      300
                    )
                  }

                  {
                    document.content.length > 300 &&
                    "..."
                  }

                </p>


              </article>

            )

          )

        }


      </section>


    </div>

  )

}


export default KnowledgePanel
