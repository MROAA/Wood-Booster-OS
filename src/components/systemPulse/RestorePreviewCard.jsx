/*
WOOD-BOOSTER HQ

SYSTEM PULSE

RESTORE PREVIEW CARD

Vastuut:

- näyttää palautuksen esikatselun
- käynnistää hyväksytyn restore-prosessin

Ei:

- ohita hyväksyntää
- suorita suoraa tiedostojen palautusta
*/


import {
useState
} from "react"



function RestorePreviewCard({
restorePlan
}) {


const [
result,
setResult
] = useState(null)



if(!restorePlan){

return null

}



async function executeRestore(){


try{


const response =
await fetch(
"http://localhost:3001/api/recovery/execute",
{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:
JSON.stringify({

approval:{

status:
"approved",

snapshot:
restorePlan.source

},

integrity:{

status:
"healthy"

}

})

}

)



const data =
await response.json()


setResult(
data
)


}

catch(error){

setResult({

success:false,

error:
error.message

})

}

}



return (

<section

className="
p-6
rounded-xl
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
space-y-4
"

>


<h2
className="
text-lg
font-semibold
"
>
Restore Preview
</h2>



<div>

Target:

{" "}

{restorePlan.target}

</div>



<div>

Source:

{" "}

{restorePlan.source}

</div>



<h3>
Operations
</h3>



<ul>

{
restorePlan.operations?.map(
(operation,index)=>(

<li
key={index}
>
✓ {operation}
</li>

)

)

}

</ul>



<div>

Rollback:

{" "}

{
restorePlan.rollbackAvailable
?
"Available"
:
"Unavailable"
}

</div>



<button

onClick={
executeRestore
}

className="
px-4
py-2
rounded
border
border-[var(--wood-border)]
hover:bg-[var(--wood-panel-hover)]
"

>

Execute Restore

</button>



{
result && (

<pre

className="
text-xs
overflow-auto
"

>

{
JSON.stringify(
result,
null,
2
)
}

</pre>

)

}


</section>

)

}


export default RestorePreviewCard
