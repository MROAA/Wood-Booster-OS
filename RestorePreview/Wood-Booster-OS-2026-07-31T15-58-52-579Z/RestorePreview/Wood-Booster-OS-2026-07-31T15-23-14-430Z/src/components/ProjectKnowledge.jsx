import {
  useEffect,
  useState,
} from "react"


import {
  apiGet,
} from "../api/client"



function ProjectKnowledge(){


const [documents,setDocuments] =
useState([])


const [loading,setLoading] =
useState(true)





async function loadKnowledge(){


try{


const data =

await apiGet(
"/knowledge"
)


setDocuments(data)


}

catch(error){


console.error(
"Knowledge loading error:",
error
)


}


finally{

setLoading(false)

}


}





useEffect(()=>{

loadKnowledge()

},[])







if(loading){

return (

<p className="
text-neutral-400
">

Ladataan tietopankkia...

</p>

)

}







return (

<div className="space-y-6">


<div>


<h2 className="
text-xl
font-bold
">

📚 Project Knowledge

</h2>


<p className="
mt-2
text-neutral-400
">

Wood-Booster AI:n tietopankki.

</p>


</div>





<div className="
grid
grid-cols-1
gap-4
">


{

documents.map(document=>(


<div

key={document.id}

className="
rounded-xl
border
border-neutral-800
bg-neutral-950
p-5
"

>


<div className="
flex
justify-between
gap-4
">


<h3 className="
font-bold
">

{document.title}

</h3>


<span className="
text-xs
text-neutral-500
">

{document.status}

</span>


</div>




<p className="
mt-3
text-sm
text-neutral-300
line-clamp-4
">

{document.content}

</p>




<div className="
mt-4
flex
flex-wrap
gap-2
">


<span className="
rounded-lg
bg-neutral-800
px-3
py-1
text-xs
text-neutral-400
">

{document.topic}

</span>



<span className="
rounded-lg
bg-neutral-800
px-3
py-1
text-xs
text-neutral-400
">

Priority {document.priority}

</span>



</div>


</div>


))


}



</div>


</div>

)

}



export default ProjectKnowledge
