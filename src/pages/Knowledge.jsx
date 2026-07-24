import { useEffect, useState } from "react"
import { apiGet } from "../api/client"


function Knowledge(){

const [documents,setDocuments] = useState([])
const [loading,setLoading] = useState(true)
const [error,setError] = useState(null)



useEffect(()=>{


async function loadKnowledge(){

try{


const data = await apiGet(
"/knowledge"
)


setDocuments(data)


}


catch(error){

console.error(
"Knowledge error:",
error
)

setError(
"Knowledge Center yhteys epäonnistui."
)

}


finally{

setLoading(false)

}


}


loadKnowledge()


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

Truth Layer

</p>


<h1 className="
mt-2
text-4xl
font-bold
">

📚 Knowledge Center

</h1>


<p className="
mt-3
text-neutral-400
max-w-3xl
">

AI Brainin tietokeskus.
Dokumentit toimivat agenttien
ja Truth Layerin lähteenä.

</p>


</header>



<div className="
grid
grid-cols-1
md:grid-cols-3
gap-4
">


<Stat
title="Documents"
value={documents.length}
/>


<Stat
title="Status"
value={
loading
?
"LOADING"
:
"CONNECTED"
}
/>


<Stat
title="Grounding"
value="ACTIVE"
/>


</div>




{
loading && (

<div className="
bg-neutral-900
border
border-neutral-800
rounded-2xl
p-6
">

Ladataan tietopankkia...

</div>

)

}




{
error && (

<div className="
bg-red-950
border
border-red-800
rounded-2xl
p-6
text-red-300
">

{error}

</div>

)

}




<div className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
">


{
documents.map(document=>(

<DocumentCard
key={document.id}
document={document}
/>

))

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
bg-neutral-900
border
border-neutral-800
rounded-2xl
p-5
">


<p className="
text-neutral-500
text-sm
">

{title}

</p>


<p className="
text-3xl
font-bold
mt-2
">

{value}

</p>


</div>

)

}




function DocumentCard({
document
}){

return (

<div className="
bg-neutral-900
border
border-neutral-800
rounded-2xl
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

{document.title}

</h2>


<span className="
text-green-400
text-sm
">

{document.status}

</span>


</div>



<p className="
mt-4
text-neutral-400
">

{
document.topic ||
"General"
}

</p>



<p className="
mt-4
text-neutral-300
line-clamp-3
">

{
document.content
}

</p>



<div className="
mt-5
flex
flex-wrap
gap-2
">


{
document.folder &&

<span className="
rounded-full
bg-neutral-800
px-3
py-1
text-sm
">

{document.folder}

</span>

}



{
document.author &&

<span className="
rounded-full
bg-neutral-800
px-3
py-1
text-sm
">

{document.author}

</span>

}


</div>


</div>

)

}



export default Knowledge
