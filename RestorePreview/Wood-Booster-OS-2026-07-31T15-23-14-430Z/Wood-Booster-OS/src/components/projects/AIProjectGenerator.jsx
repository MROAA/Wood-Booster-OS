import { useState } from "react"
import { apiPost } from "../../api/client"


function AIProjectGenerator({ onCreated }){

  const [projectName,setProjectName] = useState("")
  const [description,setDescription] = useState("")
  const [woodType,setWoodType] = useState("Tammi")
  const [style,setStyle] = useState("Skandinaavinen")

  const [loading,setLoading] = useState(false)
  const [message,setMessage] = useState("")



  async function createProject(){

    if(!projectName.trim()) return

    if(!description.trim()){

      setMessage(
        "Anna projektin kuvaus."
      )

      return

    }



    setLoading(true)
    setMessage("")



    try{


      const data = await apiPost(
        "/ai/generate-project",
        {
          projectName,
          description,
          woodType,
          style
        }
      )


      setMessage(
        "Projektin luonti onnistui."
      )


      setProjectName("")
      setDescription("")


      if(onCreated){

        onCreated(data)

      }


    }

    catch(error){

      console.error(
        "Project generation error:",
        error
      )


      setMessage(
        "Projektin luonti epäonnistui."
      )


    }

    finally{

      setLoading(false)

    }

  }



  return (

    <div className="
    rounded-2xl
    border
    border-neutral-800
    bg-neutral-900
    p-6
    space-y-5
    ">


      <h2 className="
      text-xl
      font-bold
      ">

        🤖 AI Project Generator

      </h2>



      <p className="
      text-neutral-400
      ">

        Luo projekti AI:n avulla.

      </p>



      <input

        value={projectName}

        onChange={
          e=>setProjectName(e.target.value)
        }

        placeholder="Projektin nimi"

        className="
        w-full
        rounded-xl
        bg-neutral-800
        px-4
        py-3
        outline-none
        "

      />



      <textarea

        value={description}

        onChange={
          e=>setDescription(e.target.value)
        }

        placeholder="Projektin kuvaus esimerkiksi: massiivipuinen jokipöytä asiakkaalle"

        rows="4"

        className="
        w-full
        rounded-xl
        bg-neutral-800
        px-4
        py-3
        outline-none
        "

      />



      <div className="
      grid
      grid-cols-1
      md:grid-cols-2
      gap-4
      ">


        <input

          value={woodType}

          onChange={
            e=>setWoodType(e.target.value)
          }

          placeholder="Puulaji"

          className="
          rounded-xl
          bg-neutral-800
          px-4
          py-3
          outline-none
          "

        />



        <input

          value={style}

          onChange={
            e=>setStyle(e.target.value)
          }

          placeholder="Tyyli"

          className="
          rounded-xl
          bg-neutral-800
          px-4
          py-3
          outline-none
          "

        />


      </div>




      <button

        onClick={createProject}

        disabled={loading}

        className="
        rounded-xl
        bg-amber-500
        px-6
        py-3
        font-bold
        text-black
        "

      >

        {
          loading
          ?
          "Luodaan..."
          :
          "Luo AI projekti"
        }


      </button>




      {
        message &&

        <p className="
        text-sm
        text-green-400
        ">

          {message}

        </p>

      }


    </div>

  )

}


export default AIProjectGenerator
