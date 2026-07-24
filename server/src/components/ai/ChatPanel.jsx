import { useEffect, useState } from "react"


const API_URL =
  "http://localhost:3001/api"



function ChatPanel({
  conversationId,
  setConversationId,
}) {


  const [message, setMessage] =
    useState("")


  const [messages, setMessages] =
    useState([])


  const [loading, setLoading] =
    useState(false)





  /*
    Lataa valittu keskustelu
  */

  useEffect(() => {

    async function loadConversation() {

      if (!conversationId) {

        setMessages([])

        return

      }


      try {

        const response =
          await fetch(
            `${API_URL}/conversations/${conversationId}`,
          )


        const conversation =
          await response.json()



        if (
          conversation?.messages
        ) {

          setMessages(

            conversation.messages.map(
              (item) => ({

                role:
                  item.role,

                content:
                  item.content,

              }),
            ),

          )

        }


      } catch (error) {

        console.error(
          "Keskustelun lataus epäonnistui:",
          error,
        )


        setMessages([])

      }

    }



    loadConversation()


  }, [conversationId])







  async function sendMessage() {


    if (
      !message.trim() ||
      loading
    ) {

      return

    }



    const userText =
      message.trim()



    const userMessage = {

      role:
        "user",

      content:
        userText,

    }




    const history =
      messages.map(
        (item) => ({

          role:
            item.role,

          content:
            item.content,

        }),
      )




    setMessages(
      (current) => [

        ...current,

        userMessage,

      ],
    )



    setMessage("")

    setLoading(true)





    try {


      const response =
        await fetch(

          `${API_URL}/ai/brain-chat`,

          {

            method:
              "POST",


            headers: {

              "Content-Type":
                "application/json",

            },


            body: JSON.stringify({

              message:
                userText,


              history,


              conversationId,

            }),

          },

        )





      const data =
        await response.json()



      if (
        !response.ok
      ) {

        throw new Error(
          data.error ||
          "AI Brain virhe",
        )

      }





      if (
        data.conversationId
      ) {

        setConversationId(
          data.conversationId,
        )

      }






      setMessages(
        (current) => [

          ...current,

          {

            role:
              "assistant",

            content:
              data.answer ||
              "Ei vastausta",

          },

        ],
      )




    } catch (error) {


      setMessages(
        (current) => [

          ...current,

          {

            role:
              "assistant",

            content:
              `Virhe: ${error.message}`,

          },

        ],
      )



    } finally {

      setLoading(false)

    }

  }





  function clearChat() {

    setMessages([])

    if (setConversationId) {

      setConversationId(null)

    }

  }







  return (

    <section
      className="
        flex
        h-full
        flex-col
        rounded-2xl
        border
        border-neutral-800
        bg-neutral-900
      "
    >


      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-neutral-800
          p-4
        "
      >

        <div>

          <h2 className="text-xl font-bold">

            🧠 AI Brain

          </h2>


          <p className="text-sm text-neutral-400">

            Wood-Booster henkilökohtainen avustaja

          </p>

        </div>




        <button

          onClick={clearChat}

          className="
            rounded-xl
            border
            border-neutral-700
            px-4
            py-2
            text-sm
            text-neutral-300
            hover:bg-neutral-800
          "

        >

          Tyhjennä

        </button>


      </div>






      <div
        className="
          flex-1
          min-h-[500px]
          space-y-4
          overflow-y-auto
          p-6
        "
      >



        {messages.length === 0 && (

          <div
            className="
              rounded-xl
              bg-neutral-950
              p-5
              text-neutral-400
            "
          >

            <p className="font-semibold text-white">

              Tervetuloa AI Brainiin.

            </p>


            <p className="mt-2">

              Kysy Wood-Boosterista,
              projekteista tai kehityksestä.

            </p>


          </div>

        )}






        {messages.map(
          (item, index) => (

            <div

              key={index}

              className={

                item.role === "user"

                ?

                "ml-auto max-w-2xl rounded-xl bg-amber-500 p-4 text-black"

                :

                "max-w-2xl rounded-xl bg-neutral-800 p-4 text-white"

              }

            >

              <p className="mb-1 text-xs opacity-60">

                {
                  item.role === "user"
                  ? "Sinä"
                  : "AI Brain"
                }

              </p>


              <p className="whitespace-pre-wrap">

                {item.content}

              </p>


            </div>

          )

        )}






        {loading && (

          <div
            className="
              max-w-2xl
              rounded-xl
              bg-neutral-800
              p-4
              text-neutral-400
            "
          >

            AI Brain ajattelee...

          </div>

        )}



      </div>







      <div
        className="
          border-t
          border-neutral-800
          p-4
        "
      >


        <textarea

          value={message}


          onChange={(event) =>
            setMessage(
              event.target.value,
            )
          }



          onKeyDown={(event) => {

            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {

              event.preventDefault()

              sendMessage()

            }

          }}



          placeholder="Kirjoita viesti AI Brainille..."

          rows="2"



          className="
            w-full
            resize-none
            rounded-xl
            border
            border-neutral-700
            bg-neutral-950
            p-4
            text-white
            outline-none
            focus:border-amber-500
          "

        />




        <button

          onClick={sendMessage}

          disabled={loading}


          className="
            mt-3
            w-full
            rounded-xl
            bg-amber-500
            py-3
            font-bold
            text-black
            hover:bg-amber-400
            disabled:opacity-50
          "

        >

          {loading
            ? "AI käsittelee..."
            : "Lähetä"}

        </button>


      </div>


    </section>

  )

}



export default ChatPanel