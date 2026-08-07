import {
  useEffect,
  useState,
} from "react"



import {
  apiGet,
} from "../../api/client"







function AIStatusBar({

  messages = [],

}) {


  const [
    backend,
    setBackend,
  ] = useState("CHECKING")



  const [
    spacemonkey,
    setSpacemonkey,
  ] = useState("CHECKING")







  useEffect(()=>{


    async function loadStatus(){


      try {


        const health =
          await apiGet(
            "/health"
          )



        if(
          health.status === "ok"
        ){

          setBackend(
            "ONLINE"
          )

        }


      }


      catch(error){


        setBackend(
          "OFFLINE"
        )


      }







      try {


        const runtime =
          await apiGet(
            "/spacemonkey/runtime"
          )



        if(
          runtime.state
        ){

          setSpacemonkey(
            "READY"
          )

        }


      }


      catch(error){


        setSpacemonkey(
          "OFFLINE"
        )


      }


    }





    loadStatus()



    const interval =
      setInterval(
        loadStatus,
        10000
      )



    return ()=>{

      clearInterval(
        interval
      )

    }



  },[])








  return (

    <div
      className="
        mt-4
        grid
        grid-cols-5
        gap-3
      "
    >


      <StatusCard

        title="Backend"

        value={backend}

        icon="⚡"

      />



      <StatusCard

        title="Agent"

        value="AI Brain"

        icon="⬢"

      />



      <StatusCard

        title="Memory"

        value="ACTIVE"

        icon="◈"

      />



      <StatusCard

        title="Spacemonkey"

        value={spacemonkey}

        icon="⬡"

      />



      <StatusCard

        title="Messages"

        value={messages.length}

        icon="◐"

      />


    </div>

  )

}







function StatusCard({

  title,

  value,

  icon,

}) {


  return (

    <div

      className="
        rounded-xl
        border
        border-neutral-800
        bg-neutral-950
        p-3
      "

    >

      <p
        className="
          text-xs
          text-neutral-500
        "
      >

        {icon} {title}

      </p>



      <p
        className="
          mt-1
          text-sm
          font-semibold
          text-green-400
        "
      >

        {value}

      </p>


    </div>

  )

}





export default AIStatusBar
