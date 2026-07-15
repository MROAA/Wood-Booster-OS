import { useState } from "react"

import AIBrainTabs from "../components/ai/AIBrainTabs"

import ChatPanel from "../components/ai/ChatPanel"
import KnowledgePanel from "../components/ai/KnowledgePanel"
import MemoryPanel from "../components/ai/MemoryPanel"
import AgentsPanel from "../components/ai/AgentsPanel"
import ToolsPanel from "../components/ai/ToolsPanel"


function AIBrain() {
  const [activeTab, setActiveTab] = useState("chat")


  function renderPanel() {
    switch (activeTab) {
      case "knowledge":
        return <KnowledgePanel />

      case "memory":
        return <MemoryPanel />

      case "agents":
        return <AgentsPanel />

      case "tools":
        return <ToolsPanel />

      case "chat":
      default:
        return <ChatPanel />
    }
  }


  return (
    <main>
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
          Wood-Booster AI Brain
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Henkilökohtainen AI-avustaja
        </h1>

        <p className="mt-4 max-w-3xl text-neutral-400">
          Keskitetty käyttöliittymä tekoälylle,
          muistille, tiedolle ja agenteille.
        </p>
      </header>


      <div className="mt-8">
        <AIBrainTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>


      <div className="mt-6">
        {renderPanel()}
      </div>
    </main>
  )
}


export default AIBrain
