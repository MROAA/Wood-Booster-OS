import {
  useEffect,
  useState,
} from "react"


import {
  Link,
} from "react-router-dom"


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
text-[var(--wood-muted)]
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

◌ Tietopankki

</h2>


<p className="
mt-2
text-[var(--wood-muted)]
">

Tämä on koko Wood-Booster AI:n yhteinen tietopankki, ei vain
tämän projektin - samat dokumentit näkyvät kaikissa projekteissa.

</p>


<Link
to="/knowledge"
className="
mt-2
inline-block
text-sm
text-[var(--wood-accent)]
hover:opacity-80
"
>

Hallinnoi tietopankkia →

</Link>


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
border-[var(--wood-border)]
bg-[var(--wood-bg)]
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
text-[var(--wood-muted)]
">

{document.status}

</span>


</div>




<p className="
mt-3
text-sm
text-[var(--wood-text)]
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
bg-[var(--wood-card)]
px-3
py-1
text-xs
text-[var(--wood-muted)]
">

{document.topic}

</span>



<span className="
rounded-lg
bg-[var(--wood-card)]
px-3
py-1
text-xs
text-[var(--wood-muted)]
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
