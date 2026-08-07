import {
  useEffect,
  useState
} from "react"





function RestoreResultCard() {


  const [
    result,
    setResult
  ] = useState(null)





  useEffect(()=>{


    const saved =
      localStorage.getItem(
        "systemPulseRestoreResult"
      )



    if(saved){

      setResult(
        JSON.parse(saved)
      )

    }


  },[])





  if(
    !result
  ){

    return null

  }





  return (

    <section
      className="
        card
        p-6
        wood-hover
      "
    >

      <h2>
        Restore Result
      </h2>



      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p
          className="
            text-green-400
          "
        >
          ✓ {result.status}
        </p>



        <p>
          Snapshot:
          {" "}
          {result.snapshot}
        </p>



        <p>
          Files restored:
          {" "}
          {result.restoredFiles}
        </p>



        <p>
          Duration:
          {" "}
          {result.duration}
          ms
        </p>



        {
          result.gitCheckpoint &&

          (

            <p>

              Git checkpoint:
              {" "}

              {
                result.gitCheckpoint.success

                ?

                "Created"

                :

                "Failed"

              }

            </p>

          )

        }


      </div>


    </section>

  )

}



export default RestoreResultCard
