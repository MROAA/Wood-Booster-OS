import {
  useState
} from "react"


import ChatPanel from "./ChatPanel"
import KnowledgePanel from "./KnowledgePanel"
import MemoryPanel from "./MemoryPanel"
import AgentsPanel from "./AgentsPanel"
import ToolsPanel from "./ToolsPanel"



const tabs = [

  {
    id: "chat",
    label: "Chat"
  },

  {
    id: "knowledge",
    label: "Knowledge"
  },

  {
    id: "memory",
    label: "Memory"
  },

  {
    id: "agents",
    label: "Agents"
  },

  {
    id: "tools",
    label: "Tools"
  }

]



function AIBrainTabs() {


  const [
    activeTab,
    setActiveTab
  ] = useState("chat")





  function renderTab() {


    switch(activeTab) {


      case "chat":

        return <ChatPanel />



      case "knowledge":

        return <KnowledgePanel />



      case "memory":

        return <MemoryPanel />



      case "agents":

        return <AgentsPanel />



      case "tools":

        return <ToolsPanel />



      default:

        return <ChatPanel />


    }


  }





  return (

    <div
      className="
        space-y-6
      "
    >



      <div
        className="
          flex
          flex-wrap
          gap-2
          rounded-2xl
          border
          border-[var(--wb-grey-dark)]
          bg-[var(--wb-surface)]
          p-2
        "
      >

        {
          tabs.map(

            tab => (

              <button

                key={tab.id}

                onClick={() =>
                  setActiveTab(tab.id)
                }

                className={

                  `
                  rounded-xl
                  px-4
                  py-2
                  text-sm
                  font-medium
                  transition-all

                  ${
                    activeTab === tab.id

                    ?

                    `
                    bg-[var(--wb-card)]
                    text-[var(--wb-copper)]
                    border
                    border-[var(--wb-grey-dark)]
                    `

                    :

                    `
                    text-[var(--wb-text-muted)]
                    hover:text-[var(--wb-text)]
                    hover:bg-[var(--wb-card)]
                    `
                  }

                  `

                }

              >

                {tab.label}

              </button>

            )

          )

        }


      </div>





      <div
        className="
          fade-in
        "
      >

        {renderTab()}

      </div>



    </div>

  )

}


export default AIBrainTabs
