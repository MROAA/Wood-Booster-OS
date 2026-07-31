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
        border-neutral-800
        bg-neutral-900
        p-5
      "
    >

      <h2 className="
        text-xl
        font-bold
      ">

        📚 Conversations

      </h2>



      <p className="
        mt-2
        text-sm
        text-neutral-400
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
                  border-neutral-800
                  bg-neutral-950
                  p-4
                  text-left
                  hover:bg-neutral-800
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
                  text-neutral-500
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
