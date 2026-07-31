import {
  useState,
} from "react"


import ChatPanel from "../components/ai/ChatPanel"

import SpacemonkeyDashboard from "../components/spacemonkey/SpacemonkeyDashboard"

import ConversationList from "../components/ai/ConversationList"





function AIBrain(){


  const [
    activeTab,
    setActiveTab,
  ] = useState("chat")



  const [
    conversationId,
    setConversationId,
  ] = useState(null)





  return (

    <div
      className="
        h-[calc(100dvh-2rem)]
        min-h-0
        overflow-hidden
        flex
        flex-col
      "
    >



      <div
        className="
          flex
          gap-2
          mb-4
        "
      >



        <button

          onClick={() =>
            setActiveTab("chat")
          }

          className={`
            rounded-xl
            px-4
            py-2
            text-sm

            ${
              activeTab === "chat"
              ? "bg-white text-black"
              : "bg-neutral-900 text-neutral-400"
            }

          `}

        >

          💬 Chat

        </button>





        <button

          onClick={() =>
            setActiveTab("spacemonkey")
          }

          className={`
            rounded-xl
            px-4
            py-2
            text-sm

            ${
              activeTab === "spacemonkey"
              ? "bg-white text-black"
              : "bg-neutral-900 text-neutral-400"
            }

          `}

        >

          🛰️ Spacemonkey

        </button>



      </div>






      {
        activeTab === "chat" && (

          <div
            className="
              flex
              flex-1
              min-h-0
              gap-4
            "
          >


            <div
              className="
                w-80
                overflow-y-auto
              "
            >

              <ConversationList />

            </div>





            <div
              className="
                flex-1
                min-h-0
              "
            >

              <ChatPanel

                conversationId={
                  conversationId
                }


                setConversationId={
                  setConversationId
                }

              />

            </div>



          </div>

        )
      }





      {
        activeTab === "spacemonkey" && (

          <div
            className="
              flex-1
              min-h-0
              overflow-auto
            "
          >

            <SpacemonkeyDashboard />

          </div>

        )
      }



    </div>

  )

}



export default AIBrain
