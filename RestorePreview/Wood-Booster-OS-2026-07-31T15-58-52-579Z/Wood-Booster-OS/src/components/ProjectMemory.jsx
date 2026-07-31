import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
  apiPost,
} from "../api/client"



function ProjectMemory(){

const [proposals,setProposals] =
useState([])


const [memories,setMemories] =
useState([])


const [loading,setLoading] =
useState(true)





async function loadMemory(){


try{


const proposalData =

await apiGet(
"/memory/proposals"
)



const memoryData =

await apiGet(
"/memory"
)



setProposals(

proposalData.proposals || []

)



setMemories(

memoryData.memories || []

)



}

catch(error){

console.error(
"Memory loading error:",
error
)

}

finally{

setLoading(false)

}


}





useEffect(()=>{

loadMemory()

},[])







async function approve(id){


try{


await apiPost(

`/memory/proposals/${id}/approve`,

{}

)


loadMemory()


}

catch(error){

console.error(error)

}


}





async function reject(id){


try{


await apiPost(

`/memory/proposals/${id}/reject`,

{}

)


loadMemory()


}

catch(error){

console.error(error)

}


}





if(loading){

return (

<p className="text-neutral-400">

Ladataan muistia...

</p>

)

}







return (

<div className="space-y-8">


<section>


<h2 className="
text-xl
font-bold
">

🧠 Memory Proposals

</h2>



<div className="
mt-4
space-y-3
">


{

proposals.length === 0 &&

<p className="
text-neutral-500
">

Ei odottavia muistiehdotuksia.

</p>

}




{

proposals.map(item=>(


<div

key={item.id}

className="
rounded-xl
border
border-neutral-800
bg-neutral-950
p-4
"


>


<h3 className="font-bold">

{item.title || "Muistiehdotus"}

</h3>


<p className="
mt-2
text-neutral-300
">

{item.content}

</p>



<div className="
mt-4
flex
gap-3
">


<button

onClick={()=>approve(item.id)}

className="
rounded-xl
bg-green-500
px-4
py-2
font-bold
text-black
"

>

Hyväksy

</button>




<button

onClick={()=>reject(item.id)}

className="
rounded-xl
bg-red-500
px-4
py-2
font-bold
text-black
"

>

Hylkää

</button>


</div>


</div>


))

}



</div>


</section>







<section>


<h2 className="
text-xl
font-bold
">

🧠 Saved Memory

</h2>



<div className="
mt-4
space-y-3
">


{

memories.length === 0 &&

<p className="
text-neutral-500
">

Ei tallennettua muistia.

</p>

}




{

memories.map(memory=>(


<div

key={memory.id}

className="
rounded-xl
border
border-neutral-800
bg-neutral-950
p-4
"

>


<p className="
text-neutral-300
">

{memory.content}

</p>


</div>


))

}



</div>


</section>




</div>

)

}


export default ProjectMemory
