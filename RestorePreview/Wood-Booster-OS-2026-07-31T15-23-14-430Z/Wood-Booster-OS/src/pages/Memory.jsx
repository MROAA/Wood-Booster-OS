import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





function Memory(){


  const [
    proposals,
    setProposals,
  ] = useState([])



  const [
    memories,
    setMemories,
  ] = useState([])



  async function loadMemory(){


    try{


      const proposalResponse =
        await fetch(
          `${API_URL}/memory/proposals`
        )


      const proposalData =
        await proposalResponse.json()



      setProposals(
        proposalData.proposals || []
      )





      const memoryResponse =
        await fetch(
          `${API_URL}/memory`
        )


      const memoryData =
        await memoryResponse.json()



      setMemories(
        memoryData.memories || []
      )


    }


    catch(error){


      console.error(
        "Memory loading error:",
        error
      )


    }


  }






  useEffect(()=>{


    loadMemory()


  },[])








  async function approve(id){


    await fetch(

      `${API_URL}/memory/proposals/${id}/approve`,

      {
        method:"POST",
      }

    )


    loadMemory()

  }








  async function reject(id){


    await fetch(

      `${API_URL}/memory/proposals/${id}/reject`,

      {
        method:"POST",
      }

    )


    loadMemory()

  }








  return (

    <div
      className="
        space-y-8
      "
    >


      <header>

        <p
          className="
            text-sm
            uppercase
            tracking-widest
            text-amber-500
          "
        >

          AI Memory System

        </p>


        <h1
          className="
            mt-2
            text-4xl
            font-bold
          "
        >

          🧠 Memory

        </h1>


        <p
          className="
            mt-3
            text-neutral-400
          "
        >

          Spacemonkeyn pitkäaikainen muisti.

        </p>


      </header>







      <section>

        <h2
          className="
            mb-4
            text-2xl
            font-bold
          "
        >

          Pending Proposals

        </h2>




        <div
          className="
            space-y-4
          "
        >


          {
            proposals.length === 0 && (

              <p
                className="
                  text-neutral-500
                "
              >

                Ei odottavia muistiehdotuksia.

              </p>

            )
          }






          {
            proposals.map(

              proposal => (

                <article

                  key={proposal.id}

                  className="
                    rounded-2xl
                    border
                    border-neutral-800
                    bg-neutral-900
                    p-5
                  "

                >

                  <p
                    className="
                      text-white
                    "
                  >

                    {proposal.content}

                  </p>



                  <div
                    className="
                      mt-4
                      flex
                      gap-3
                    "
                  >


                    <button

                      onClick={() =>
                        approve(
                          proposal.id
                        )
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
                        reject(
                          proposal.id
                        )
                      }

                      className="
                        rounded-xl
                        border
                        border-red-500
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









      <section>


        <h2
          className="
            mb-4
            text-2xl
            font-bold
          "
        >

          Approved Memories

        </h2>



        <div
          className="
            space-y-4
          "
        >


          {
            memories.map(

              memory => (

                <article

                  key={memory.id}

                  className="
                    rounded-2xl
                    border
                    border-neutral-800
                    bg-neutral-900
                    p-5
                  "

                >

                  <p>

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




export default Memory
