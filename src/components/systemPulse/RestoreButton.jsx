import {
  useState
} from "react"





function RestoreButton({
  snapshot
}) {


  const [
    status,
    setStatus
  ] = useState("idle")



  const [
    result,
    setResult
  ] = useState(null)





  async function restoreSnapshot(){


    try {


      setStatus(
        "creating"
      )



      const response =
        await fetch(
          "http://localhost:3001/api/system-pulse/restore",
          {
            method:
              "POST",

            headers:{
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                snapshot
              })

          }
        )



      const data =
        await response.json()



      if(
        data.success
      ){

        setResult(
          data
        )


        setStatus(
          "success"
        )

      }
      else {

        setStatus(
          "error"
        )

      }


    }
    catch(error){


      console.error(
        error
      )


      setStatus(
        "error"
      )

    }

  }





  return (

    <div
      className="
        mt-3
      "
    >

      <button
        onClick={
          restoreSnapshot
        }
        disabled={
          status === "creating"
        }
        className="
          rounded-lg
          border
          border-[var(--wood-accent)]
          px-3
          py-1
          text-sm
          transition
          hover:scale-105
        "
      >

        {
          status === "creating"
            ?
            "Preparing..."
            :
            "Restore Preview"
        }

      </button>





      {
        status === "success" &&
        result &&
        (

          <div
            className="
              mt-3
              text-xs
              text-green-400
            "
          >

            <p>
              ● Restore preview created
            </p>


            <p
              className="
                mt-1
                break-all
                text-[var(--wood-muted)]
              "
            >
              {result.restorePreview}
            </p>

          </div>

        )
      }





      {
        status === "error" &&
        (

          <p
            className="
              mt-3
              text-xs
              text-red-400
            "
          >
            Restore failed
          </p>

        )
      }


    </div>

  )

}



export default RestoreButton
