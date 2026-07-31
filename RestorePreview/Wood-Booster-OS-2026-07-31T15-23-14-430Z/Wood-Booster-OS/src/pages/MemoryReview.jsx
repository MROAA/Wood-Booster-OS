import { useEffect, useState } from "react"



function MemoryReview() {


  const [proposals, setProposals] =
    useState([])



  async function loadProposals(){


    const response =
      await fetch(
        "http://localhost:3001/api/memory-proposals"
      )


    const data =
      await response.json()


    setProposals(data)

  }







  async function approve(id){


    await fetch(

      `http://localhost:3001/api/memory-proposals/${id}/approve`,

      {
        method:
          "POST"
      }

    )


    loadProposals()

  }







  async function reject(id){


    await fetch(

      `http://localhost:3001/api/memory-proposals/${id}/reject`,

      {
        method:
          "POST"
      }

    )


    loadProposals()

  }







  useEffect(()=>{

    loadProposals()

  },[])








  return (

    <main className="min-h-screen bg-neutral-950 text-white p-8">


      <h1 className="text-3xl font-bold">

        🧠 AI Memory Review

      </h1>



      <p className="text-neutral-400 mt-2">

        Tarkista mitä AI ehdottaa pysyväksi muistiksi.

      </p>





      <div className="mt-8 grid gap-4">


        {
          proposals.map(
            proposal => (


              <div

                key={proposal.id}

                className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"

              >


                <div className="flex justify-between">


                  <h2 className="text-xl font-semibold">

                    {proposal.key}

                  </h2>


                  <span className="text-amber-400">

                    {proposal.importance}/10

                  </span>


                </div>




                <p className="mt-4 text-neutral-300">

                  {proposal.content}

                </p>




                <p className="mt-3 text-sm text-neutral-500">

                  Category:
                  {" "}
                  {proposal.category}

                </p>




                <div className="mt-5 flex gap-3">


                  <button

                    onClick={() =>
                      approve(proposal.id)
                    }

                    className="rounded-lg bg-green-700 px-4 py-2"

                  >

                    Hyväksy

                  </button>




                  <button

                    onClick={() =>
                      reject(proposal.id)
                    }

                    className="rounded-lg bg-red-700 px-4 py-2"

                  >

                    Hylkää

                  </button>



                </div>



              </div>


            )

          )

        }



        {
          proposals.length === 0 && (

            <p className="text-neutral-500">

              Ei odottavia muistiehdotuksia.

            </p>

          )
        }


      </div>


    </main>

  )

}


export default MemoryReview