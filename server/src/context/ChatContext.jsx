import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"



const ChatContext =
  createContext(null)



const API_URL =
  "http://localhost:3001/api"





export function ChatProvider({
  children,
}) {


  const [
    messages,
    setMessages,
  ] = useState([
    {
      role:"assistant",
      content:
        "Hei Marc. Olen Spacemonkey AI.",
    },
  ])



  const [
    conversationId,
    setConversationId,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)








  async function loadConversation(){


    try {


      const response =
        await fetch(
          `${API_URL}/conversations`
        )



      const conversations =
        await response.json()



      if(
        conversations.length === 0
      ){

        setLoading(false)

        return

      }



      const latest =
        conversations[0]



      setConversationId(
        latest.id
      )



      const detailResponse =
        await fetch(
          `${API_URL}/conversations/${latest.id}`
        )



      const conversation =
        await detailResponse.json()



      if(
        conversation.messages
      ){

        setMessages(

          conversation.messages.map(
            message => ({

              role:
                message.role,

              content:
                message.content,

            })
          )

        )

      }


    }

    catch(error){


      console.error(
        "Conversation loading error:",
        error
      )


    }


    finally{


      setLoading(false)


    }


  }








  useEffect(()=>{


    loadConversation()


  },[])









  function addMessage(message){


    setMessages(

      current => [

        ...current,

        message,

      ]

    )


  }








  function clearChat(){


    setMessages([])


    setConversationId(null)


  }







  return (

    <ChatContext.Provider

      value={{

        messages,

        addMessage,

        clearChat,

        conversationId,

        setConversationId,

        loading,

      }}

    >

      {children}

    </ChatContext.Provider>

  )

}









export function useChat(){


  const context =
    useContext(
      ChatContext
    )



  if(!context){


    throw new Error(
      "useChat must be inside ChatProvider"
    )


  }



  return context


}
