import {
  useEffect,
  useState
} from "react"


import ConfirmRestoreButton from "./ConfirmRestoreButton"





function RestorePreviewHistoryCard() {


  const [
    previews,
    setPreviews
  ] = useState([])



  const [
    loading,
    setLoading
  ] = useState(true)





  async function loadPreviews(){


    try {


      const response =
        await fetch(
          "http://localhost:3001/api/system-pulse/restore-previews"
        )



      const data =
        await response.json()



      if(
        data.success
      ){

        setPreviews(
          data.previews
        )

      }


    }
    catch(error){

      console.error(
        error
      )

    }
    finally {

      setLoading(
        false
      )

    }

  }





  useEffect(()=>{


    loadPreviews()


  },[])







  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Restore Preview History
      </h2>



      <p
        className="
          mt-2
          text-sm
          text-[var(--wood-muted)]
        "
      >
        Valmistellut palautukset
      </p>





      <div
        className="
          mt-5
          space-y-5
        "
      >

        {
          loading
            ?

            (
              <p>
                Loading restore previews...
              </p>
            )

            :

            previews.length === 0

              ?

              (
                <p>
                  No restore previews
                </p>
              )

              :

              previews.map(
                preview => (

                  <div
                    key={preview.name}
                    className="
                      border-l
                      border-green-500
                      pl-4
                    "
                  >

                    <p
                      className="
                        text-green-400
                      "
                    >
                      🟢 {preview.name}
                    </p>


                    <p
                      className="
                        mt-2
                        text-xs
                        text-[var(--wood-muted)]
                      "
                    >
                      Restore Preview valmis
                    </p>


                    <ConfirmRestoreButton
                      snapshot={
                        preview.name
                      }
                    />


                  </div>

                )
              )

        }


      </div>


    </section>

  )

}



export default RestorePreviewHistoryCard
