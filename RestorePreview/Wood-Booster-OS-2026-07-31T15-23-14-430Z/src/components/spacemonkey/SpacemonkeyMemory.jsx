import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





function SpacemonkeyMemory(){


  const [
    memories,
    setMemories,
  ] = useState([])



  const [
    proposals,
    setProposals,
  ] = useState([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)







  useEffect(()=>{


    async function loadMemory(){


      try{


        const [
          memoryResponse,
          proposalResponse,
        ] =
        await Promise.all([


          fetch(
            `${API_URL}/memory`
          )
          .then(
            response =>
              response.json()
          ),


          fetch(
            `${API_URL}/memory/proposals`
          )
          .then(
            response =>
              response.json()
          ),


        ])





        setMemories(

          memoryResponse.memories || []

        )



        setProposals(

          proposalResponse.proposals || []

        )


      }
      catch(error){


        setError(
          error.message
        )


      }
      finally{


        setLoading(false)


      }


    }



    loadMemory()


  },[])







  if(loading){


    return (

      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-6
      ">

        Loading Memory...

      </section>

    )

  }







  if(error){


    return (

      <section className="
        rounded-2xl
        border
        border-red-900
        bg-neutral-900
        p-6
      ">

        Memory error:
        {" "}
        {error}

      </section>

    )

  }







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">


      <h2 className="
        text-xl
        font-bold
      ">

        Memory

      </h2>



      <p className="
        mt-2
        text-neutral-400
      ">

        Spacemonkey memory subsystem.

      </p>







      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-3
      ">


        <MemoryCard

          title="Stored Memories"

          value={
            memories.length
          }

        />



        <MemoryCard

          title="Pending Proposals"

          value={
            proposals.length
          }

        />



        <MemoryCard

          title="Status"

          value="CONNECTED"

        />


      </div>







      {
        memories.length > 0 && (

          <div className="
            mt-6
            space-y-3
          ">


            {
              memories.map(

                memory => (

                  <article

                    key={
                      memory.id
                    }

                    className="
                      rounded-xl
                      border
                      border-neutral-800
                      bg-black
                      p-4
                    "

                  >

                    <p className="font-semibold">

                      {memory.title || "Memory"}

                    </p>


                    <p className="
                      mt-2
                      text-neutral-400
                    ">

                      {memory.content}

                    </p>


                  </article>

                )

              )
            }


          </div>

        )

      }


    </section>

  )

}







function MemoryCard({
  title,
  value,
}){


  return (

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black
      p-4
    ">


      <h3 className="font-semibold">

        {title}

      </h3>


      <p className="
        mt-2
        text-green-400
      ">

        🟢 {value}

      </p>


    </article>

  )

}







export default SpacemonkeyMemory
