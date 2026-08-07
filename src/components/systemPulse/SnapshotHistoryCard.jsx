import {
  useEffect,
  useState
} from "react"


import RestoreButton from "./RestoreButton"





function SnapshotHistoryCard() {


  const [
    snapshots,
    setSnapshots
  ] = useState([])



  const [
    loading,
    setLoading
  ] = useState(true)





  async function loadSnapshots(){


    try {


      const response =
        await fetch(
          "http://localhost:3001/api/system-pulse/snapshots"
        )


      const data =
        await response.json()



      if(
        data.success
      ){

        setSnapshots(
          data.snapshots
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

    loadSnapshots()

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
        Snapshot History
      </h2>



      <p
        className="
          mt-2
          text-sm
          text-[var(--wood-muted)]
        "
      >
        System Pulse palautuspisteet
      </p>





      <div
        className="
          mt-5
          space-y-4
        "
      >

        {
          loading
            ?

            (
              <p>
                Loading snapshots...
              </p>
            )

            :

            snapshots.length === 0

              ?

              (
                <p>
                  No snapshots found
                </p>
              )

              :

              snapshots.map(
                snapshot => (

                  <div
                    key={snapshot.name}
                    className="
                      border-l
                      border-[var(--wood-accent)]
                      pl-4
                    "
                  >

                    <p
                      className="
                        text-green-400
                      "
                    >
                      ● {snapshot.name}
                    </p>


                    <RestoreButton
                      snapshot={
                        snapshot.name
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



export default SnapshotHistoryCard
