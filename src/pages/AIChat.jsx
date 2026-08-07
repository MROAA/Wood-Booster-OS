import { useState } from "react"

import ConversationList from "../components/ai/ConversationList"
import ChatPanel from "../components/ai/ChatPanel"



function AIChat() {

  const [activeConversation, setActiveConversation] =
    useState(null)



  function handleSelectConversation(id) {

    setActiveConversation(id)

  }



  function handleNewConversation() {

    setActiveConversation(null)

  }



  return (

    <main
      className="
        flex
        h-[calc(100vh-120px)]
        overflow-hidden
        rounded-2xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-bg)]
      "
    >

      <ConversationList

        activeConversation={
          activeConversation
        }

        onSelect={
          handleSelectConversation
        }

        onNew={
          handleNewConversation
        }

      />



      <section
        className="
          flex-1
          overflow-hidden
          p-6
        "
      >

        <ChatPanel

          conversationId={
            activeConversation
          }

          setConversationId={
            setActiveConversation
          }

        />

      </section>


    </main>

  )

}



export default AIChat