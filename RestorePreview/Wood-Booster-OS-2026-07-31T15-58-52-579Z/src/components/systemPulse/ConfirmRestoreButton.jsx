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
    result,
    setResult
  ] = useState(null)





  async function confirmRestore(){


    try {


      setStatus(
        "running"
      )



      const response =
        await fetch(
          "http://localhost:3001/api/system-pulse/restore-confirm",
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

            <div
              className="
                space-y-3
              "
            >

              <p
                className="
                  text-sm
                  text-yellow-400
                "
              >
                ⚠️ Current system will be backed up first.
              </p>


              <button
                onClick={confirmRestore}
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
                    "Backing up..."
                    :
                    "Start Restore Backup"
                }

              </button>


            </div>

          )

      }





      {
        status === "success" &&
        result &&
        (

          <p
            className="
              mt-3
              text-xs
              text-green-400
            "
          >
            🟢 Backup created:
            {" "}
            {result.backupBeforeRestore}
          </p>

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
            Restore confirmation failed
          </p>

        )
      }


    </div>

  )

}



export default ConfirmRestore
