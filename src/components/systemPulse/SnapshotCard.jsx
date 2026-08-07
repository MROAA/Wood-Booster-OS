import {
  useState
} from "react"

import {
  apiPost,
} from "../../api/client"





function SnapshotCard() {


  const [
    status,
    setStatus
  ] = useState("idle")



  const [
    snapshot,
    setSnapshot
  ] = useState(null)





  async function createSnapshot(){


    try {


      setStatus(
        "creating"
      )



      const data =
        await apiPost(
          "/system-pulse/snapshot",
          {}
        )



      if(
        data.success
      ){

        setSnapshot(
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





  const glowStyle =
    status === "success"
      ?
      "border-green-500 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.7)]"
      :
      status === "creating"
        ?
        "border-yellow-500 text-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.7)]"
        :
        status === "error"
          ?
          "border-red-500 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)]"
          :
          "border-[var(--wood-border)]"





  return (

    <section
      className={`
        card
        p-6
        wood-hover
        transition-all
        duration-500
        ${glowStyle}
      `}
    >

      <h2>
        System Snapshot
      </h2>



      <p
        className="
          mt-2
          text-sm
          text-[var(--wood-muted)]
        "
      >
        Luo Wood-Booster OS palautuspiste
      </p>



      <button
        onClick={createSnapshot}
        disabled={
          status === "creating"
        }
        className="
          mt-5
          rounded-xl
          border
          border-[var(--wood-accent)]
          px-5
          py-2
          transition
          hover:scale-105
        "
      >

        {
          status === "creating"
            ?
            "Creating..."
            :
            "Create Snapshot"
        }

      </button>





      {
        status === "success" &&
        snapshot &&
        (

          <div
            className="
              mt-5
              space-y-2
              text-sm
            "
          >

            <p
              className="
                text-green-400
              "
            >
              ● Snapshot created
            </p>


            <p>
              {snapshot.snapshot}
            </p>


            <p
              className="
                text-[var(--wood-muted)]
              "
            >
              {snapshot.path}
            </p>


          </div>

        )
      }





      {
        status === "error" &&
        (

          <p
            className="
              mt-5
              text-red-400
            "
          >
            Snapshot failed
          </p>

        )
      }


    </section>

  )

}



export default SnapshotCard
