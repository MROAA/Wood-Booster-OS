import { useEffect, useState } from "react"
import { apiGet } from "../api/client"


function Memory(){

const [proposals,setProposals] = useState([])
const [loading,setLoading] = useState(true)
const [error,setError] = useState(null)



useEffect(()=>{


async function loadMemory(){

try{


const data = await apiGet(
"/memory/proposals"
)


setProposals(
data.proposals || []
)


}

catch(error){

console.error(
"Memory error:",
error
)


setError(
"Memory Center yhteys epäonnistui."
)

}


finally{

setLoading(false)

}


}


loadMemory()


},[])



return (

<div className="space-y-8">


<header>


<p className="
text-sm
font-semibold
uppercase
tracking-[0.25em]
text-amber-500
">

AI Brain

</p>



<h1 className="
mt-2
text-4xl
font-bold
">

🧠 Memory Center

</h1>



<p className="
mt-3
max-w-3xl
text-neutral-400
">

AI:n muistiehdotukset ja opittu tieto.
Hyväksytyt muistot voidaan myöhemmin
ottaa osaksi järjestelmän tietopohjaa.

</p>


</header>



<section className="
grid
grid-cols-1
md:grid-cols-3
gap-4
">


<Stat
title="Pending memories"
value={proposals.length}
/>


<Stat
title="Storage"
value="DATABASE"
/>


<Stat
title="Validation"
value="ACTIVE"
/>


</section>




{
loading &&

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-6
">

Ladataan muistia...

</div>

}



{
error &&

<div className="
rounded-2xl
border
border-red-800
bg-red-950
p-6
text-red-300
">

{error}

</div>

}





<div className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
">


{
proposals.map(proposal=>(

<MemoryCard
key={proposal.id}
proposal={proposal}
/>

))

}



{
!loading &&
proposals.length===0 &&

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-6
text-neutral-400
">

Ei odottavia muistiehdotuksia.

</div>

}



</div>



</div>

)

}





function Stat({
title,
value
}){

return (

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-5
">


<p className="
text-neutral-500
text-sm
">

{title}

</p>


<p className="
mt-2
text-3xl
font-bold
">

{value}

</p>


</div>

)

}





function MemoryCard({
proposal
}){

return (

<div className="
rounded-2xl
border
border-neutral-800
bg-neutral-900
p-6
">


<div className="
flex
justify-between
gap-4
">


<h2 className="
text-xl
font-bold
">

Memory #{proposal.id}

</h2>



<span className="
text-amber-400
text-sm
">

{proposal.status}

</span>


</div>



<p className="
mt-5
text-neutral-300
">

{
proposal.content ||
proposal.memory ||
"Ei sisältöä"
}

</p>



<div className="
mt-5
rounded-xl
bg-neutral-800
p-4
text-sm
text-neutral-400
">

AI Memory Proposal

</div>



</div>

)

}




export default Memory
