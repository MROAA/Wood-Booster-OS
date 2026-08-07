import {
  useEffect,
  useState,
} from "react"


import {
  useChat,
} from "../../context/ChatContext"



const API_URL =
  "http://localhost:3001/api"





function ConversationList(){


  const [
    conversations,
    setConversations,
  ] = useState([])



  const chat =
    useChat()



  const setConversationId =
    chat?.setConversationId







  async function loadConversations(){


    try {


      const response =
        await fetch(
          `${API_URL}/conversations`
        )


      const data =
        await response.json()



      setConversations(data)


    }

    catch(error){


      console.error(
        "Conversation loading error:",
        error
      )


    }


  }







  useEffect(()=>{


    loadConversations()


  },[])








  return (

    <section
      className="
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        p-5
      "
    >

      <h2 className="
        text-xl
        font-bold
      ">

        ◌ Conversations

      </h2>



      <p className="
        mt-2
        text-sm
        text-[var(--wood-muted)]
      ">

        Tallennetut AI Brain keskustelut

      </p>





      <div className="
        mt-5
        space-y-3
      ">


        {
          conversations.map(

            conversation => (

              <button

                key={
                  conversation.id
                }


                onClick={()=>{


                  if(
                    typeof setConversationId ===
                    "function"
                  ){

                    setConversationId(
                      conversation.id
                    )

                  }
                  else{

                    console.error(
                      "setConversationId puuttuu ChatContextista"
                    )

                  }


                }}


                className="
                  w-full
                  rounded-xl
                  border
                  border-[var(--wood-border)]
                  bg-[var(--wood-bg)]
                  p-4
                  text-left
                  hover:bg-[var(--wood-card)]
                "

              >

                <p className="
                  font-semibold
                ">

                  {conversation.title}

                </p>


                <p className="
                  mt-1
                  text-xs
                  text-[var(--wood-muted)]
                ">

                  {
                    new Date(
                      conversation.updatedAt
                    )
                    .toLocaleString(
                      "fi-FI"
                    )
                  }

                </p>


              </button>

            )

          )
        }


      </div>


    </section>

  )

}


export default ConversationList
