import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"




function MemoryCenter(){


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





  async function loadMemory(){


    try{


      const proposalResponse =
        await fetch(
          `${API_URL}/memory/proposals`
        )


      const proposalData =
        await proposalResponse.json()



      const memoryResponse =
        await fetch(
          `${API_URL}/memory`
        )


      const memoryData =
        await memoryResponse.json()



      setProposals(
        proposalData.proposals || []
      )


      setMemories(
        memoryData.memories || []
      )


    }

    catch(error){

      console.error(
        "Memory load error:",
        error
      )

    }

    finally{

      setLoading(false)

    }


  }






  useEffect(()=>{

    loadMemory()

  },[])








  async function approve(id){


    await fetch(

      `${API_URL}/memory/proposals/${id}/approve`,

      {

        method:"POST"

      }

    )


    loadMemory()


  }







  async function reject(id){


    await fetch(

      `${API_URL}/memory/proposals/${id}/reject`,

      {

        method:"POST"

      }

    )


    loadMemory()


  }







  if(loading){

    return (

      <div className="text-neutral-400">

        Loading memory...

      </div>

    )

  }








  return (

    <div className="
      space-y-5
    ">



      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">


        <h2 className="
          text-xl
          font-bold
        ">

          🧠 Memory Proposals

        </h2>


        <p className="
          text-sm
          text-neutral-400
        ">

          AI:n ehdottamat muistot

        </p>





        {
          proposals.length === 0 && (

            <p className="
              mt-4
              text-neutral-500
            ">

              Ei odottavia muistiehdotuksia.

            </p>

          )
        }





        {
          proposals.map(
            proposal => (

              <div
                key={proposal.id}
                className="
                  mt-4
                  rounded-xl
                  border
                  border-neutral-800
                  bg-neutral-950
                  p-4
                "
              >

                <p className="font-bold">

                  {proposal.key}

                </p>


                <p className="
                  mt-2
                  text-sm
                  text-neutral-300
                ">

                  {proposal.content}

                </p>


                <div className="
                  mt-4
                  flex
                  gap-3
                ">


                  <button

                    onClick={() =>
                      approve(proposal.id)
                    }

                    className="
                      rounded-xl
                      bg-green-500
                      px-4
                      py-2
                      text-black
                    "

                  >

                    Hyväksy

                  </button>




                  <button

                    onClick={() =>
                      reject(proposal.id)
                    }

                    className="
                      rounded-xl
                      border
                      border-neutral-700
                      px-4
                      py-2
                    "

                  >

                    Hylkää

                  </button>


                </div>


              </div>

            )

          )
        }



      </section>







      <section className="
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">


        <h2 className="
          text-xl
          font-bold
        ">

          💾 Stored Memory

        </h2>



        {
          memories.map(
            memory => (

              <div
                key={memory.id}
                className="
                  mt-4
                  rounded-xl
                  bg-neutral-950
                  p-4
                "
              >

                <p className="font-bold">

                  {memory.key}

                </p>


                <p className="
                  text-sm
                  text-neutral-300
                ">

                  {memory.content}

                </p>


              </div>

            )
          )
        }


      </section>



    </div>

  )

}



export default MemoryCenter
