import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../../api/client"





function SpacemonkeyMemoryCard(){


  const [
    proposals,
    setProposals
  ] = useState([])



  const [
    loading,
    setLoading
  ] = useState(true)



  const [
    processing,
    setProcessing
  ] = useState(null)







  async function loadProposals(){


    try{


      const data =
        await apiGet(
          "/memory/proposals"
        )


      setProposals(

        Array.isArray(data)
          ? data
          : data.proposals || []

      )


    }

    catch(error){


      console.error(
        "Memory proposal loading error",
        error
      )


      setProposals([])


    }


    finally{

      setLoading(false)

    }


  }








  async function approveProposal(id){


    setProcessing(id)


    try{


      await fetch(

        `http://localhost:3001/api/memory/proposals/${id}/approve`,

        {
          method:"POST"
        }

      )


      await loadProposals()


    }

    catch(error){


      console.error(
        "Approve memory error",
        error
      )


    }


    finally{


      setProcessing(null)


    }


  }








  async function rejectProposal(id){


    setProcessing(id)


    try{


      await fetch(

        `http://localhost:3001/api/memory/proposals/${id}/reject`,

        {
          method:"POST"
        }

      )


      await loadProposals()


    }

    catch(error){


      console.error(
        "Reject memory error",
        error
      )


    }


    finally{


      setProcessing(null)


    }


  }









  useEffect(()=>{


    loadProposals()


  },[])








  return (

    <section

      className="
        rounded-2xl
        p-5
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >





      <h3

        className="
          text-xl
          font-semibold
        "

      >

        🧠 Muisti

      </h3>





      <p

        className="
          mt-1
          text-sm
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        Spacemonkeyn muistiehdotukset

      </p>









      {
        loading && (

          <p

            className="
              mt-4
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Ladataan muistia...

          </p>

        )
      }









      {
        !loading &&
        proposals.length === 0 && (

          <p

            className="
              mt-4
              text-sm
            "

            style={{

              color:
                "var(--wood-muted)"

            }}

          >

            Ei avoimia muistiehdotuksia.

          </p>

        )
      }









      {
        proposals.length > 0 && (

          <div

            className="
              mt-5
              space-y-3
            "

          >

            {
              proposals.map(

                proposal => (

                  <div

                    key={
                      proposal.id
                    }

                    className="
                      rounded-xl
                      p-4
                    "

                    style={{

                      background:
                        "var(--wood-panel-dark)",


                      border:
                        "1px solid var(--wood-border)"

                    }}

                  >





                    <p

                      className="
                        text-xs
                        uppercase
                        tracking-wide
                      "

                      style={{

                        color:
                          "var(--wood-muted)"

                      }}

                    >

                      {proposal.category}

                    </p>







                    <p

                      className="
                        mt-2
                        text-sm
                      "

                    >

                      {proposal.content}

                    </p>







                    <p

                      className="
                        mt-2
                        text-sm
                      "

                      style={{

                        color:
                          "var(--wood-muted)"

                      }}

                    >

                      Tärkeys:
                      {" "}
                      {proposal.importance}

                    </p>








                    <div

                      className="
                        mt-4
                        flex
                        gap-2
                      "

                    >




                      <button

                        disabled={
                          processing === proposal.id
                        }

                        onClick={() =>
                          approveProposal(
                            proposal.id
                          )
                        }

                        className="
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          font-semibold
                        "

                        style={{

                          background:
                            "var(--wood-accent)",


                          color:
                            "var(--wood-background)"

                        }}

                      >

                        Hyväksy

                      </button>








                      <button

                        disabled={
                          processing === proposal.id
                        }

                        onClick={() =>
                          rejectProposal(
                            proposal.id
                          )
                        }

                        className="
                          rounded-lg
                          px-3
                          py-2
                          text-sm
                          font-semibold
                        "

                        style={{

                          background:
                            "var(--wood-panel)",


                          color:
                            "var(--wood-text)",


                          border:
                            "1px solid var(--wood-border)"

                        }}

                      >

                        Hylkää

                      </button>





                    </div>






                  </div>

                )

              )
            }


          </div>

        )
      }





    </section>

  )

}





export default SpacemonkeyMemoryCard
