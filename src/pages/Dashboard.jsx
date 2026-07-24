import { useEffect, useState } from "react"
import { apiGet } from "../api/client"


function Dashboard(){

const [backend,setBackend] = useState(
"CHECKING"
)


useEffect(()=>{


async function loadStatus(){

try{

const data = await apiGet("/health")


if(data.status==="ok"){

setBackend("ONLINE")

}else{

setBackend("UNKNOWN")

}


}

catch(error){

setBackend("OFFLINE")

}


}


loadStatus()


},[])



return (

<div className="space-y-8">


<header>

<p className="
text-sm
uppercase
tracking-[0.25em]
text-amber-500
">

Wood-Booster AI OS

</p>


<h1 className="
mt-2
text-4xl
font-bold
">

🪵 AI Command Center

</h1>


<p className="
mt-3
text-neutral-400
">

Personal AI workstation

</p>


</header>



<div className="
grid
grid-cols-1
md:grid-cols-4
gap-5
">


<Card
icon="⚡"
title="Backend"
value={backend}
/>


<Card
icon="🧠"
title="AI Brain"
value="READY"
/>


<Card
icon="🤖"
title="Agents"
value="5 ACTIVE"
/>


<Card
icon="📚"
title="Knowledge"
value="LOADED"
/>


</div>



</div>

)

}



function Card({
icon,
title,
value
}){

return (

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-6
">


<div className="text-3xl">
{icon}
</div>


<h2 className="
mt-4
text-neutral-400
">

{title}

</h2>


<p className="
mt-2
text-2xl
font-bold
">

{value}

</p>


</div>

)

}


export default Dashboard
