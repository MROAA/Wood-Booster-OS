import {
  useState
} from "react"





function ConfirmRestore({
  snapshot
}) {


  const [
    confirmed,
    setConfirmed
  ] = useState(false)



  const [
    status,
    setStatus
  ] = useState("idle")



  const [
    message,
    setMessage
  ] = useState(null)





  async function runRestore(){


    try {


      setStatus(
        "running"
      )





      const confirmResponse =
        await fetch(
          "http://localhost:3001/api/system-pulse/restore-confirm",
          {
            method:"POST",

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





      const confirmData =
        await confirmResponse.json()





      if(
        !confirmData.success
      ){

        throw new Error(
          "Restore confirmation failed"
        )

      }





      const restoreResponse =
        await fetch(
          "http://localhost:3001/api/system-pulse/restore-execute",
          {
            method:"POST",

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





      const restoreData =
        await restoreResponse.json()





      if(
        restoreData.success
      ){

        localStorage.setItem(
          "systemPulseRestoreResult",
          JSON.stringify(
            restoreData
          )
        )



        setMessage(
          "Restore completed successfully"
        )


        setStatus(
          "success"
        )


        window.location.reload()


      }
      else {

        throw new Error(
          "Restore failed"
        )

      }


    }
    catch(error){


      console.error(
        error
      )


      setMessage(
        error.message
      )


      setStatus(
        "error"
      )


    }

  }





  return (

    <div
      className="
        mt-4
      "
    >

      {
        !confirmed

        ?

        (

          <button
            onClick={() =>
              setConfirmed(true)
            }
            className="
              rounded-lg
              border
              border-red-500
              px-3
              py-1
              text-sm
              text-red-400
            "
          >
            Confirm Restore
          </button>

        )

        :

        (

          <button
            onClick={runRestore}
            disabled={
              status === "running"
            }
            className="
              rounded-lg
              border
              border-green-500
              px-3
              py-1
              text-sm
              text-green-400
            "
          >

            {
              status === "running"

              ?

              "Restoring..."

              :

              "Start Restore"

            }

          </button>

        )

      }





      {
        message &&

        (

          <p
            className={`
              mt-3
              text-xs
              ${
                status === "success"
                ?
                "text-green-400"
                :
                "text-red-400"
              }
            `}
          >
            {message}
          </p>

        )

      }


    </div>

  )

}



export default ConfirmRestore
