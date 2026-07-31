import { useState } from "react"



function AIChat() {


  const [messages, setMessages] =
    useState([])


  const [input, setInput] =
    useState("")


  const [loading, setLoading] =
    useState(false)



  async function sendMessage() {


    const text =
      input.trim()


    if (!text) {

      return

    }



    const userMessage = {

      role: "user",

      content: text

    }



    setMessages(
      previous => [
        ...previous,
        userMessage
      ]
    )


    setInput("")

    setLoading(true)





    try {


      const response =
        await fetch(

          "http://localhost:3001/api/ai-brain/chat",

          {

            method: "POST",


            headers: {

              "Content-Type":
                "application/json"

            },


            body: JSON.stringify({

              message: text

            })

          }

        )





      const data =
        await response.json()





      if (!response.ok) {


        throw new Error(

          data.error ||
          "AI Brain error"

        )

      }






      const aiMessage = {


        role: "assistant",


        content:
          data.answer ||
          "AI ei palauttanut vastausta."

      }





      setMessages(

        previous => [

          ...previous,

          aiMessage

        ]

      )





    } catch(error) {


      setMessages(

        previous => [

          ...previous,

          {

            role:"assistant",

            content:
              `Virhe: ${error.message}`

          }

        ]

      )


    } finally {


      setLoading(false)


    }


  }







  function handleKeyDown(event) {


    if (

      event.key === "Enter"

      &&

      !event.shiftKey

    ) {


      event.preventDefault()

      sendMessage()


    }


  }








  return (

    <div className="flex flex-col h-full bg-neutral-950">



      <div className="
        flex-1
        overflow-y-auto
        p-6
        space-y-4
      ">



        {
          messages.length === 0 && (

            <div className="
              text-neutral-500
              text-center
              mt-20
            ">


              <p className="text-xl">

                🧠 Wood-Booster AI Brain

              </p>


              <p className="mt-2">

                Kysy mitä tahansa Wood-Boosterista,
                suunnittelusta tai järjestelmästä.

              </p>


            </div>

          )
        }







        {
          messages.map(

            (message,index)=>(


              <div

                key={index}

                className={`
                  max-w-3xl
                  rounded-2xl
                  p-4

                  ${
                    message.role === "user"

                    ?

                    "ml-auto bg-amber-600 text-white"

                    :

                    "mr-auto bg-neutral-800 text-neutral-100"

                  }

                `}

              >


                <div className="
                  text-xs
                  opacity-60
                  mb-2
                ">


                  {
                    message.role === "user"

                    ?

                    "Sinä"

                    :

                    "Wood-Booster AI"

                  }


                </div>



                <p className="whitespace-pre-wrap">

                  {message.content}

                </p>


              </div>


            )

          )
        }







        {
          loading && (

            <div className="
              bg-neutral-800
              rounded-2xl
              p-4
              max-w-3xl
            ">


              Wood-Booster AI ajattelee...


            </div>

          )
        }



      </div>







      <div className="
        border-t
        border-neutral-800
        p-4
        flex
        gap-3
      ">



        <textarea

          value={input}


          onChange={
            event =>
              setInput(
                event.target.value
              )
          }


          onKeyDown={handleKeyDown}


          placeholder="
          Kirjoita viesti Wood-Booster AI:lle...
          "


          rows="2"


          className="
            flex-1
            resize-none
            rounded-xl
            bg-neutral-900
            border
            border-neutral-700
            p-4
            text-white
            outline-none
          "

        />






        <button

          onClick={sendMessage}


          disabled={loading}


          className="
            rounded-xl
            bg-amber-600
            px-6
            hover:bg-amber-500
            disabled:opacity-50
          "

        >


          Lähetä


        </button>




      </div>


    </div>

  )

}



export default AIChat