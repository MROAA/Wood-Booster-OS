import { useState } from "react"



function AIChat() {


  const [message, setMessage] =
    useState("")


  const [messages, setMessages] =
    useState([])



  const [loading, setLoading] =
    useState(false)





  async function sendMessage(){


    if (!message.trim()) {

      return

    }



    const userMessage = {

      role:"user",

      content:message

    }



    setMessages(
      previous => [
        ...previous,
        userMessage
      ]
    )



    setMessage("")

    setLoading(true)



    try {


      const response =
        await fetch(
          "http://localhost:3001/api/ai-brain/chat",
          {

            method:"POST",

            headers:{

              "Content-Type":
                "application/json"

            },

            body:JSON.stringify({

              message:
                userMessage.content

            })

          }
        )



      const data =
        await response.json()



      setMessages(
        previous => [

          ...previous,

          {

            role:"assistant",

            content:
              data.answer ||
              data.response ||
              "Ei vastausta"

          }

        ]
      )



    }

    catch(error){


      setMessages(
        previous => [

          ...previous,

          {

            role:"assistant",

            content:
              "Yhteys AI Brainiin epäonnistui."

          }

        ]
      )


    }


    setLoading(false)

  }








  return (

    <div className="flex flex-col h-full">


      <div className="flex-1 overflow-y-auto space-y-4 p-6">


        {
          messages.map(
            (msg,index)=>(


              <div

                key={index}

                className={`
                  rounded-xl
                  p-4
                  max-w-3xl

                  ${
                    msg.role === "user"
                    ?
                    "ml-auto bg-amber-600"
                    :
                    "bg-neutral-800"
                  }

                `}

              >

                {msg.content}

              </div>


            )

          )

        }



        {
          loading && (

            <div className="bg-neutral-800 rounded-xl p-4">

              AI ajattelee...

            </div>

          )
        }


      </div>






      <div className="border-t border-neutral-800 p-4 flex gap-3">


        <input

          value={message}

          onChange={
            e =>
            setMessage(e.target.value)
          }

          onKeyDown={
            e => {

              if(e.key==="Enter"){

                sendMessage()

              }

            }
          }


          placeholder="Kysy Wood-Booster AI:lta..."

          className="
            flex-1
            rounded-xl
            bg-neutral-900
            border
            border-neutral-700
            px-4
            py-3
          "

        />



        <button

          onClick={sendMessage}

          className="
            rounded-xl
            bg-amber-600
            px-6
          "

        >

          Lähetä

        </button>


      </div>


    </div>

  )

}



export default AIChat