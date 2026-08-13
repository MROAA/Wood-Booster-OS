import {
  useState,
} from "react"

import {
  apiPost,
} from "../../api/client"



function RecoveryCard({
  recovery,
}) {


  const [
    restoring,
    setRestoring,
  ] = useState(false)



  const [
    result,
    setResult,
  ] = useState(null)



  if (!recovery) {

    return (

      <section
        className="
          p-6
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-panel)]
        "
      >

        <h2
          className="
            text-lg
            text-[var(--wood-text)]
          "
        >
          Recovery
        </h2>


        <p
          className="
            mt-3
            text-sm
            text-gray-400
          "
        >
          Recovery data unavailable
        </p>


      </section>

    )

  }



  async function restoreLatest(){

    if (!recovery.latestSnapshot) {

      return

    }



    const confirmed =
      window.confirm(
        "Palautetaanko viimeisin System Snapshot? Nykyinen tila varmistetaan ennen palautusta."
      )



    if (!confirmed) {

      return

    }



    try {

      setRestoring(true)

      setResult(null)



      const response =
        await apiPost(
          "/system/restore",
          {
            file:
              recovery.latestSnapshot.file,

            confirm:
              true,
          },
        )



      setResult(
        response
      )


    }
    catch(error){

      setResult({

        success:false,

        error:
          error.message,

      })


    }
    finally {

      setRestoring(false)

    }

  }



  const latest =
    recovery.latestSnapshot



  return (

    <section
      className="
        p-6
        rounded-xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
      "
    >

      <h2
        className="
          text-lg
          text-[var(--wood-text)]
        "
      >
        Recovery
      </h2>



      <div
        className="
          mt-4
          space-y-3
          text-sm
        "
      >

        <div>
          Status:
          {" "}
          {recovery.status}
        </div>


        <div>
          Snapshots:
          {" "}
          {recovery.snapshotCount}
        </div>


        <div>
          Restore:

          {" "}

          {
            recovery.canRestore
              ? "Available"
              : "Unavailable"
          }

        </div>



        {
          latest && (

            <div
              className="
                mt-4
                p-3
                rounded-lg
                bg-black/10
              "
            >

              <div>
                Latest snapshot
              </div>


              <div>
                {latest.file}
              </div>


              <div>
                {latest.size}
              </div>


            </div>

          )
        }



        <button
          onClick={
            restoreLatest
          }

          disabled={
            restoring ||
            !recovery.canRestore
          }

          className="
            mt-4
            px-4
            py-2
            rounded-lg
            border
            border-[var(--wood-border)]
            text-sm
          "
        >

          {
            restoring
              ? "Restoring..."
              : "Restore Latest Snapshot"
          }

        </button>



        {
          result && (

            <div
              className="
                mt-4
                p-3
                rounded-lg
                text-sm
              "
            >

              {
                result.success
                  ? "Restore completed"
                  : `Restore failed: ${result.error}`
              }

            </div>

          )
        }


      </div>


    </section>

  )

}


export default RecoveryCard
