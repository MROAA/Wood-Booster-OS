import { useEffect, useState } from "react"


const API_URL =
  "http://localhost:3001/api"



function ConversationList({
  activeConversation = null,
  onSelect = () => {},
  onNew = () => {},
  refreshKey = 0,
}) {

  const [conversations, setConversations] =
    useState([])


  const [loading, setLoading] =
    useState(false)





  async function loadConversations() {

    setLoading(true)

    try {

      const response =
        await fetch(
          `${API_URL}/conversations`,
        )


      const data =
        await response.json()


      if (
        Array.isArray(data)
      ) {

        setConversations(data)

      }


    } catch (error) {

      console.error(
        "Keskustelujen lataus epäonnistui:",
        error,
      )


    } finally {

      setLoading(false)

    }

  }





  async function createNewConversation() {

    try {

      const response =
        await fetch(
          `${API_URL}/conversations`,
          {
            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },


            body: JSON.stringify({

              title:
                "Uusi keskustelu",

            }),

          },
        )


      const conversation =
        await response.json()



      if (
        conversation?.id
      ) {

        onSelect(
          conversation.id,
        )


        await loadConversations()

      }


      if (onNew) {

        onNew()

      }


    } catch (error) {

      console.error(
        "Uuden keskustelun luonti epäonnistui:",
        error,
      )

    }

  }





  useEffect(() => {

    loadConversations()

  }, [refreshKey])







  return (

    <aside
      className="
        flex
        w-72
        flex-col
        border-r
        border-neutral-800
        bg-neutral-950
        p-4
      "
    >


      <button

        onClick={
          createNewConversation
        }


        className="
          mb-4
          rounded-xl
          bg-amber-500
          px-4
          py-3
          font-bold
          text-black
          hover:bg-amber-400
        "

      >

        + Uusi keskustelu

      </button>





      <div
        className="
          flex-1
          space-y-2
          overflow-y-auto
        "
      >


        {loading && (

          <p className="
            p-3
            text-sm
            text-neutral-500
          ">

            Ladataan...

          </p>

        )}






        {!loading &&
          conversations.length === 0 && (

          <p className="
            rounded-xl
            bg-neutral-900
            p-3
            text-sm
            text-neutral-500
          ">

            Ei keskusteluja.

          </p>

        )}






        {conversations.map(
          (conversation) => (

            <button

              key={
                conversation.id
              }


              onClick={() =>
                onSelect(
                  conversation.id,
                )
              }


              className={

                activeConversation === conversation.id

                  ?

                  `
                    w-full
                    rounded-xl
                    bg-neutral-800
                    p-3
                    text-left
                    text-white
                  `


                  :

                  `
                    w-full
                    rounded-xl
                    p-3
                    text-left
                    text-neutral-400
                    hover:bg-neutral-900
                    hover:text-white
                  `

              }

            >

              <p className="
                truncate
                font-medium
              ">

                {conversation.title ||
                  "Nimetön keskustelu"}

              </p>



              <p className="
                mt-1
                text-xs
                text-neutral-500
              ">

                {new Date(
                  conversation.createdAt,
                ).toLocaleString(
                  "fi-FI",
                )}

              </p>


            </button>

          )

        )}


      </div>


    </aside>

  )

}



export default ConversationList