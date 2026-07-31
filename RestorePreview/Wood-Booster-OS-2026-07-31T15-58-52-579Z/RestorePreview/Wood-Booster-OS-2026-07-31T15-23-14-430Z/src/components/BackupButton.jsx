import { useState } from "react"



export default function BackupButton(){


  const [loading,setLoading] =
    useState(false)


  const [message,setMessage] =
    useState("")



  async function createSnapshot(){


    if(loading){

      return

    }



    setLoading(true)

    setMessage("Luodaan snapshot...")



    try{


      const response =
        await fetch(
          "http://localhost:3001/api/backup",
          {
            method:"POST"
          }
        )



      const data =
        await response.json()



      if(data.success){


        setMessage(

          "Snapshot luotu:\n" +
          data.file

        )


      }
      else{


        setMessage(

          "Backup epäonnistui:\n" +
          data.error

        )


      }


    }
    catch(error){


      console.error(error)


      setMessage(
        "Backup-palvelin ei vastaa"
      )


    }
    finally{


      setLoading(false)


    }


  }



  return (

    <div className="space-y-3">


      <button

        onClick={createSnapshot}

        disabled={loading}

        className="
        px-4
        py-2
        rounded-xl
        bg-black
        text-white
        border
        border-neutral-700
        hover:bg-neutral-800
        disabled:opacity-50
        "

      >

        {
          loading
            ? "Luodaan..."
            : "Luo snapshot"
        }


      </button>



      {
        message && (

          <div
            className="
            rounded-xl
            bg-neutral-900
            border
            border-neutral-800
            p-3
            text-sm
            text-neutral-300
            whitespace-pre-wrap
            break-all
            "
          >

            {message}

          </div>

        )
      }


    </div>

  )


}
