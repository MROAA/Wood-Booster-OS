import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





export default function SpacemonkeyPanel(){


  const [
    core,
    setCore,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)





  async function loadCore(){


    try{


      const response =
        await fetch(
          `${API_URL}/spacemonkey/core`
        )



      const data =
        await response.json()



      setCore(
        data
      )


    }
    catch(error){


      console.error(
        "Spacemonkey core error",
        error
      )


    }
    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadCore()


  },[])







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">


      <h2 className="
        text-2xl
        font-bold
      ">

        🐒 Spacemonkey Core

      </h2>



      <p className="
        mt-2
        text-neutral-400
      ">

        Wood-Booster AI OS operaattori.

      </p>





      {
        loading && (

          <p className="
            mt-5
            text-neutral-500
          ">

            Loading Spacemonkey...

          </p>

        )
      }







      {
        !loading && core && (

          <div className="
            mt-5
            space-y-3
          ">


            <div className="
              rounded-xl
              border
              border-neutral-800
              bg-black
              p-4
            ">

              <p className="
                text-green-400
                font-bold
              ">

                🟢 ONLINE

              </p>


              <p className="
                mt-2
                text-neutral-400
              ">

                Core connected

              </p>


            </div>





            <div className="
              rounded-xl
              border
              border-neutral-800
              bg-black
              p-4
            ">

              <p className="
                font-bold
              ">

                Runtime

              </p>


              <p className="
                mt-2
                text-neutral-400
              ">

                Spacemonkey System Layer

              </p>


            </div>



          </div>

        )
      }


    </section>

  )

}
