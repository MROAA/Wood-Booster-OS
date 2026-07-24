import ChatPanel from "../components/ai/ChatPanel"
import AgentsPanel from "../components/ai/AgentsPanel"
import SystemStatus from "../components/ai/SystemStatus"
import MemoryPanel from "../components/ai/MemoryPanel"


function AIBrain(){

return (

<div className="space-y-8">


<div>

<h1 className="text-4xl font-bold">
🧠 AI Brain
</h1>

<p className="mt-3 text-neutral-400">
Wood-Booster intelligence center
</p>

</div>



<SystemStatus />



<div className="
grid
grid-cols-1
xl:grid-cols-3
gap-6
">


<div>

<AgentsPanel />

</div>


<div className="
xl:col-span-2
">

<ChatPanel />

</div>


</div>



<MemoryPanel />


</div>

)

}


export default AIBrain
