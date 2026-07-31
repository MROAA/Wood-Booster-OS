import {
  useState,
} from "react"



import SecurityGuard from "./SecurityGuard"



const API_URL =
  "http://localhost:3001/api"







function SpacemonkeyChat(){



  const [messages,setMessages] =
    useState([

      {

        role:"assistant",

        content:
          "Systems normal. Spacemonkey operator online."

      }

    ])



  const [input,setInput] =
    useState("")



  const [loading,setLoading] =
    useState(false)



  const [error,setError] =
    useState("")







  async function sendMessage(){



    const validation =
      SecurityGuard.validateChatInput(
        input
      )





    if(
      !validation.valid
    ){

      setError(
        validation.message
      )

      return

    }







    const userMessage = {

      role:"user",

      content:
        validation.message

    }






    setMessages(
      current => [
        ...current,
        userMessage,
      ]
    )



    setInput("")

    setError("")

    setLoading(true)







    try{


      const response =
        await fetch(
          `${API_URL}/agents/chat`,
          {

            method:"POST",

            headers:{

              "Content-Type":
                "application/json",

            },


            body:JSON.stringify({

              message:
                validation.message

            })

          }
        )







      const data =
        await response.json()







      if(
        !response.ok
      ){

        throw new Error(
          data.error ||
          "AI Brain request failed"
        )

      }







      setMessages(
        current => [

          ...current,

          {

            role:"assistant",

            content:
              data.answer ||
              "No response received."

          }

        ]
      )



    }


    catch(error){


      setError(
        error.message
      )


    }


    finally{


      setLoading(false)


    }


  }







  function handleKeyDown(event){


    if(
      event.key === "Enter"
    ){

      sendMessage()

    }


  }









  return (

    <section

      className="
        flex
        h-full
        flex-col
        rounded-3xl
        border
        border-neutral-800
        bg-neutral-950
        p-6
      "

    >



      <div
        className="
          mb-5
        "
      >

        <p

          className="
            text-xs
            uppercase
            tracking-[0.3em]
            text-green-400
          "

        >

          Spacemonkey Channel

        </p>



        <h2

          className="
            mt-2
            text-xl
            font-bold
            text-white
          "

        >

          Operator Communication

        </h2>


      </div>








      <div

        className="
          flex-1
          space-y-4
          overflow-y-auto
          rounded-2xl
          border
          border-neutral-800
          bg-black
          p-5
        "

      >


        {
          messages.map(
            (
              message,
              index
            )=>(


              <div

                key={index}

                className={`

                  max-w-[85%]

                  rounded-2xl

                  p-4

                  text-sm


                  ${
                    message.role === "user"

                    ?

                    "ml-auto bg-green-500 text-black"

                    :

                    "bg-neutral-800 text-white"

                  }

                `}

              >

                {message.content}

              </div>


            )
          )
        }



        {
          loading && (

            <div

              className="
                rounded-2xl
                bg-neutral-800
                p-4
                text-sm
                text-neutral-400
              "

            >

              Processing request...

            </div>

          )
        }



      </div>








      {
        error && (

          <div

            className="
              mt-4
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-3
              text-sm
              text-red-300
            "

          >

            {error}

          </div>

        )

      }








      <div

        className="
          mt-5
          flex
          gap-3
        "

      >



        <input


          value={
            input
          }


          onChange={
            (event)=>
              setInput(
                event.target.value
              )
          }


          onKeyDown={
            handleKeyDown
          }



          placeholder="Send command to Spacemonkey"



          className="
            flex-1
            rounded-2xl
            border
            border-neutral-700
            bg-neutral-900
            px-5
            py-3
            text-white
            outline-none
            focus:border-green-400
          "


        />





        <button


          type="button"


          onClick={
            sendMessage
          }


          disabled={
            loading
          }



          className="
            rounded-2xl
            bg-green-500
            px-6
            py-3
            font-bold
            text-black
            disabled:opacity-50
          "


        >

          SEND

        </button>



      </div>




    </section>

  )

}





export default SpacemonkeyChat
