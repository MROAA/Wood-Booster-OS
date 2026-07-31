import {
  useState,
} from "react"





const API_URL =
  "http://localhost:3001/api"





const commands = [

  {
    id:
      "status",

    name:
      "System Health Check",

    description:
      "Tarkistaa Spacemonkey järjestelmän tilan.",

    command:
      null,

    safe:
      true,

  },


  {
    id:
      "snapshot",

    name:
      "Create Snapshot",

    description:
      "Luo uuden järjestelmän palautuspisteen.",

    command:
      null,

    safe:
      true,

  },


  {
    id:
      "restart-core",

    name:
      "Restart Core",

    description:
      "Käynnistää Spacemonkey coren uudelleen.",

    command:
      "restart-core",

    safe:
      false,

  },

]







function SpacemonkeyCommandCenter(){


  const [
    message,
    setMessage,
  ] = useState("")



  const [
    running,
    setRunning,
  ] = useState(null)







  async function createEvent(
    command,
    status,
  ){


    await fetch(

      `${API_URL}/spacemonkey/events`,

      {

        method:
          "POST",

        headers:{

          "Content-Type":
            "application/json",

        },


        body:

          JSON.stringify({

            event:
              "COMMAND_EXECUTED",


            payload:{

              command:
                command.name,


              commandId:
                command.id,


              status,


              source:
                "Spacemonkey Command Center",

            },

          }),

      }

    )


  }







  async function runCommand(item){


    setRunning(
      item.id
    )



    try{


      if(item.command === null){


        const result =
          `${item.name}: READY`



        setMessage(
          result
        )



        await createEvent(
          item,
          "READY"
        )



        return

      }







      const response =
        await fetch(

          `${API_URL}/spacemonkey/command`,

          {

            method:
              "POST",

            headers:{

              "Content-Type":
                "application/json",

            },


            body:

              JSON.stringify({

                command:
                  item.command,

              }),

          }

        )





      const data =
        await response.json()



      setMessage(

        data.message ||
        "Command completed"

      )



      await createEvent(
        item,
        "COMPLETED"
      )


    }


    catch(error){


      setMessage(
        error.message
      )


      await createEvent(
        item,
        "FAILED"
      )


    }


    finally{


      setRunning(
        null
      )


    }


  }







  return (

    <section className="
      rounded-2xl
      border
      border-neutral-800
      bg-neutral-900
      p-6
    ">


      <header>


        <h2 className="
          text-xl
          font-bold
          text-white
        ">

          Command Center

        </h2>



        <p className="
          mt-2
          text-sm
          text-neutral-400
        ">

          Spacemonkey turvalliset järjestelmätoiminnot.

        </p>


      </header>







      <div className="
        mt-6
        grid
        grid-cols-1
        gap-4
        md:grid-cols-3
      ">


        {
          commands.map(

            command => (

              <CommandCard

                key={
                  command.id
                }

                command={
                  command
                }

                running={
                  running === command.id
                }

                onRun={
                  runCommand
                }

              />

            )

          )
        }


      </div>







      {
        message && (

          <div className="
            mt-6
            rounded-xl
            border
            border-neutral-800
            bg-black/30
            p-4
            text-sm
            text-green-400
          ">

            {message}

          </div>

        )
      }


    </section>

  )

}







function CommandCard({
  command,
  onRun,
  running,
}){


  return (

    <article className="
      rounded-xl
      border
      border-neutral-800
      bg-black/30
      p-5
      transition
      duration-300
      hover:border-neutral-700
      hover:-translate-y-1
    ">


      <h3 className="
        font-semibold
        text-white
      ">

        {command.name}

      </h3>



      <p className="
        mt-3
        text-sm
        text-neutral-400
      ">

        {command.description}

      </p>







      <button

        disabled={
          running
        }

        onClick={()=>onRun(command)}

        className="
          mt-5
          rounded-lg
          border
          border-neutral-700
          px-4
          py-2
          text-sm
          text-neutral-200
          transition
          hover:bg-neutral-800
          disabled:opacity-50
        "

      >

        {
          running
          ? "Running..."
          : "Execute"
        }


      </button>


    </article>

  )

}







export default SpacemonkeyCommandCenter
