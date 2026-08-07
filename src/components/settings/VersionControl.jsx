import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"



function VersionControl(){


  const [
    snapshots,
    setSnapshots,
  ] = useState([])



  const [
    version,
  ] = useState(
    "v0.1.0-mvp"
  )



  const [
    loading,
    setLoading,
  ] = useState(false)



  const [
    restoreLoading,
    setRestoreLoading,
  ] = useState(false)



  const [
    restorePreview,
    setRestorePreview,
  ] = useState(null)



  const [
    newestSnapshot,
    setNewestSnapshot,
  ] = useState(null)



  const [
    message,
    setMessage,
  ] = useState("")





  async function loadSnapshots(){


    try{


      const response =
        await fetch(
          `${API_URL}/backups`
        )



      const data =
        await response.json()



      if(data.success){


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


  }





  useEffect(()=>{


    loadSnapshots()


  },[])







  async function createSnapshot(){


    if(loading){

      return

    }



    setLoading(true)



    setMessage(
      "◒ Creating Snapshot..."
    )



    try{


      const response =
        await fetch(
          `${API_URL}/backup`,
          {
            method:"POST"
          }
        )



      const data =
        await response.json()



      if(data.success){


        setNewestSnapshot(
          data.metadata.file
        )


        setMessage(
          "● New Snapshot Created"
        )


        await loadSnapshots()



        setTimeout(()=>{


          setNewestSnapshot(
            null
          )


          setMessage(
            ""
          )


        },5000)


      }


    }
    catch(error){


      console.error(
        error
      )


      setMessage(
        "◆ Snapshot failed"
      )


    }
    finally{


      setLoading(false)


    }


  }







  async function restoreSnapshot(snapshot){


    setRestoreLoading(true)



    try{


      const response =
        await fetch(
          `${API_URL}/system/restore`,
          {

            method:"POST",

            headers:{

              "Content-Type":
                "application/json"

            },

            body:JSON.stringify({

              file:
                snapshot.file

            })

          }
        )



      const data =
        await response.json()



      if(data.success){


        setRestorePreview(
          data
        )


      }


    }
    catch(error){


      console.error(
        error
      )


    }
    finally{


      setRestoreLoading(false)


    }


  }







  function formatDate(date){


    if(!date){

      return "-"

    }



    return new Date(
      date
    )
      .toLocaleString(
        "fi-FI"
      )


  }







  return (

    <section>


      <div className="
        mb-4
        flex
        items-center
        justify-between
      ">


        <div>

          <h2 className="
            text-2xl
            font-bold
          ">

            ▩ Version Control

          </h2>


          <p className="
            text-neutral-400
          ">

            Järjestelmän palautuspisteet.

          </p>


        </div>




        <button

          onClick={createSnapshot}

          disabled={loading}

          className={`
            rounded-xl
            px-4
            py-3
            font-bold
            text-black
            transition
            ${
              loading
                ? "bg-yellow-400 animate-pulse"
                : "bg-amber-500 hover:bg-amber-400"
            }
          `}

        >

          {
            loading
              ? "Creating Snapshot..."
              : "Create Snapshot"
          }


        </button>


      </div>







      {
        message && (

          <div className="
            mb-4
            rounded-xl
            border
            border-neutral-700
            bg-neutral-900
            p-3
          ">

            {message}

          </div>

        )

      }







      <div className="
        mb-5
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
        p-5
      ">

        <p className="
          text-sm
          text-neutral-500
        ">

          Current Version

        </p>


        <p className="
          mt-2
          text-3xl
          font-bold
        ">

          {version}

        </p>


      </div>







      {
        restorePreview && (

          <div className="
            mb-5
            rounded-2xl
            border
            border-green-900
            bg-neutral-900
            p-5
          ">

            <h3 className="
              font-bold
              text-green-400
            ">

              ● Restore Validation Successful

            </h3>


            {
              restorePreview.preview?.map(
                item => (

                  <p
                    key={item}
                    className="
                      text-xs
                      text-neutral-400
                    "
                  >

                    {item}

                  </p>

                )
              )
            }


          </div>

        )

      }







      <div className="space-y-4">


        {
          snapshots.map(

            snapshot => (


              <article

                key={snapshot.id}

                className={`
                  rounded-2xl
                  border
                  bg-neutral-900
                  p-5
                  transition
                  ${
                    newestSnapshot === snapshot.file
                      ? "border-green-500 animate-pulse"
                      : "border-neutral-800"
                  }
                `}

              >


                <div className="
                  flex
                  justify-between
                  gap-4
                ">


                  <div>


                    <h3 className="font-bold">


                      {snapshot.name}



                      {
                        newestSnapshot === snapshot.file && (

                          <span className="
                            ml-2
                            text-green-400
                          ">

                            ⭐ NEW

                          </span>

                        )

                      }


                    </h3>



                    <div className="
                      mt-3
                      space-y-1
                      text-sm
                      text-neutral-400
                    ">


                      <p>

                        Version:
                        {" "}
                        {snapshot.version || "-"}

                      </p>


                      <p>

                        Created:
                        {" "}
                        {formatDate(snapshot.created)}

                      </p>


                      <p>

                        Type:
                        {" "}
                        {snapshot.type || "-"}

                      </p>


                      <p>

                        Size:
                        {" "}
                        {snapshot.size || "-"}

                      </p>


                      <p>

                        File:
                        {" "}
                        {snapshot.file}

                      </p>


                    </div>


                  </div>




                  <span className="
                    text-green-400
                  ">

                    ● {snapshot.status}

                  </span>


                </div>





                <button

                  onClick={() =>
                    restoreSnapshot(snapshot)
                  }

                  disabled={restoreLoading}

                  className="
                    mt-4
                    rounded-xl
                    border
                    border-neutral-700
                    px-4
                    py-2
                  "

                >

                  {
                    restoreLoading
                      ? "Checking..."
                      : "Restore Preview"
                  }


                </button>


              </article>


            )

          )


        }


      </div>


    </section>

  )

}



export default VersionControl
