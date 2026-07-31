import {
  useEffect,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"





function SpacemonkeyPanel(){


  const [
    data,
    setData,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    error,
    setError,
  ] = useState(null)







  async function loadSpacemonkey(){


    try{


      const [
        identity,
        safety,
        system,
        snapshot,
        catalog,
      ] =
      await Promise.all([

        fetch(
          `${API_URL}/spacemonkey/identity`
        )
        .then(
          res=>res.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/safety`
        )
        .then(
          res=>res.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/system`
        )
        .then(
          res=>res.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/snapshot-v3`
        )
        .then(
          res=>res.json()
        ),


        fetch(
          `${API_URL}/spacemonkey/api-catalog`
        )
        .then(
          res=>res.json()
        ),

      ])



      setData({

        identity,

        safety,

        system,

        snapshot,

        catalog,

      })


    }
    catch(error){


      console.error(
        "Spacemonkey error",
        error
      )


      setError(
        error.message
      )


    }
    finally{


      setLoading(false)


    }


  }







  useEffect(()=>{


    loadSpacemonkey()


  },[])







  if(loading){


    return (

      <Panel>

        Loading Spacemonkey Core...

      </Panel>

    )

  }







  if(error){


    return (

      <Panel>

        <p className="text-red-400">

          Spacemonkey error:
          {" "}
          {error}

        </p>

      </Panel>

    )

  }







  const identity =
    data?.identity?.data?.identity



  const safety =
    data?.safety?.data



  const system =
    data?.system?.snapshot



  const catalog =
    data?.catalog?.catalog



  return (

    <Panel>


      <h2 className="
        text-2xl
        font-bold
      ">

        🐒 Spacemonkey Control

      </h2>


      <p className="
        mt-2
        text-neutral-400
      ">

        Wood-Booster AI OS:n operaattori,
        turvallisuuskerros ja järjestelmävalvoja.

      </p>





      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        xl:grid-cols-3
      ">


        <Card

          title="Identity"

        >

          <p>
            Name:
            {" "}
            {identity?.name || "Unknown"}
          </p>


          <p>
            Creator:
            {" "}
            {identity?.creator || "Unknown"}
          </p>


          <p className="text-green-400">

            🟢 Active

          </p>


        </Card>





        <Card

          title="System Snapshot"

        >

          <p>

            Core:
            {" "}
            {system?.core?.status}

          </p>


          <p>

            Modules:
            {" "}
            {system?.modules?.length}

          </p>


          <p className="text-green-400">

            🟢 {system?.health?.status}

          </p>


        </Card>





        <Card

          title="Safety"

        >

          <p>

            Snapshots:
            {" "}
            {safety?.snapshots?.count}

          </p>


          <p>

            Recovery:
            {" "}
            {safety?.recovery?.available
              ? "AVAILABLE"
              : "OFF"}

          </p>


          <p className="text-green-400">

            🛡 Protected

          </p>


        </Card>


      </div>





      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-2
      ">


        <Card

          title="API Catalog"

        >

          {
            catalog?.apis?.map(
              api=>(
                <div
                  key={api.id}
                  className="
                    border-b
                    border-neutral-800
                    py-2
                  "
                >

                  <p className="font-bold">

                    {api.name || api.id}

                  </p>


                  <p className="text-sm text-neutral-400">

                    {api.path}

                  </p>


                  <p className="text-green-400">

                    {api.status}

                  </p>


                </div>
              )
            )
          }


        </Card>





        <Card

          title="Snapshot V3"

        >

          <p>

            Version:
            {" "}
            {data?.snapshot?.version}

          </p>


          <p>

            Status:
            {" "}
            {data?.snapshot?.snapshot?.status || "ACTIVE"}

          </p>


          <p className="text-green-400">

            🟢 Loaded

          </p>


        </Card>


      </div>


    </Panel>

  )

}







function Panel({
  children,
}){


  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">

      {children}

    </section>

  )

}







function Card({
  title,
  children,
}){


  return (

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black
      p-5
    ">


      <h3 className="
        mb-3
        font-bold
      ">

        {title}

      </h3>


      <div className="
        space-y-2
        text-sm
        text-neutral-300
      ">

        {children}

      </div>


    </article>

  )

}







export default SpacemonkeyPanel
