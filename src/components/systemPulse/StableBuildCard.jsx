/*
WOOD-BOOSTER HQ

SYSTEM PULSE

STABLE BUILD CARD

Näyttää viimeisimmän vakaan palautuspisteen.
*/


import {
useState
} from "react"



function StableBuildCard({
stableBuild
}) {


const [
requestStatus,
setRequestStatus
] = useState(null)



if(!stableBuild){

return null

}



const build =
stableBuild.latestStableBuild



if(!build){

return null

}



async function requestRestore(){


try {


const response =
await fetch(
"http://localhost:3001/api/recovery/request",
{

method:
"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({

snapshot:
build.snapshot,

requestedBy:
"System Pulse",

validation:{

status:
"healthy",

score:
100,

metadata:{

source:
"System Pulse Stable Build"

}

}

})

}

)


const data =
await response.json()


setRequestStatus(
data
)


}

catch(error){


setRequestStatus({

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
Stable Build
</h2>



<div>
Status:
{" "}
🟢 {build.status}
</div>



<div>
Version:
{" "}
{build.version}
</div>



<div>
Commit:
{" "}
{build.commit.slice(0,8)}
</div>



<div>
Snapshot:
{" "}
{build.snapshot}
</div>



<div>
Created:
{" "}
{new Date(
build.createdAt
).toLocaleString()
}
</div>



<button

onClick={
requestRestore
}

className="
px-4
py-2
rounded
border
"

>
Request Restore
</button>



{
requestStatus &&

<pre
className="
text-xs
overflow-auto
"
>
{
JSON.stringify(
requestStatus,
null,
2
)
}
</pre>

}



</section>

)

}


export default StableBuildCard
