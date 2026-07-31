import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"



const ChatContext =
  createContext(null)





function loadMessages(){


  try {


    const saved =
      localStorage.getItem(
        "woodBoosterChatHistory"
      )


    if(saved){

      return JSON.parse(saved)

    }


  }

  catch(error){

    console.error(
      "Chat history load error:",
      error
    )

  }



  return []

}





function loadConversationId(){


  try {


    return localStorage.getItem(
      "woodBoosterConversationId"
    )


  }

  catch(error){


    return null


  }


}







export function ChatProvider({

  children

}){


  const [
    messages,
    setMessages,
  ] = useState(
    loadMessages
  )



  const [
    conversationId,
    setConversationId,
  ] = useState(
    loadConversationId
  )







  useEffect(()=>{


    localStorage.setItem(

      "woodBoosterChatHistory",

      JSON.stringify(messages)

    )


  },[
    messages
  ])







  useEffect(()=>{


    if(conversationId){

      localStorage.setItem(

        "woodBoosterConversationId",

        conversationId

      )

    }

    else{

      localStorage.removeItem(

        "woodBoosterConversationId"

      )

    }


  },[
    conversationId
  ])








  function addMessage(message){


    setMessages(

      current => [

        ...current,

        message

      ]

    )


  }







  function clearChat(){


    setMessages([])


    setConversationId(null)



    localStorage.removeItem(

      "woodBoosterChatHistory"

    )


    localStorage.removeItem(

      "woodBoosterConversationId"

    )


  }







  return (

    <ChatContext.Provider

      value={{

        messages,

        addMessage,

        clearChat,

        conversationId,

        setConversationId,

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

      "useChat must be used inside ChatProvider"

    )


  }


  return context


}
