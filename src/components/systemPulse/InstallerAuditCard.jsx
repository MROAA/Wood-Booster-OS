function InstallerAuditCard({
audit
}) {

if(!audit){

return null

}


const events =
audit.events || []


const latest =
audit.latest



function getEventStyle(event){

if(event === "stable-build-created"){

return "text-green-400 border-green-700 bg-green-950/20"

}


if(event === "stable-build-failed"){

return "text-red-400 border-red-700 bg-red-950/20"

}


if(event === "restore-approved"){

return "text-blue-400 border-blue-700 bg-blue-950/20"

}


return "text-yellow-400 border-yellow-700 bg-yellow-950/20"

}



return (

<div
className="
border
rounded-lg
p-4
space-y-4
border-[var(--wood-border)]
bg-[var(--wood-panel)]
"
>


<h3
className="
text-lg
text-[var(--wood-text)]
"
>
Installer Audit
</h3>



<div>

Total Events:

{" "}

{audit.count || 0}

</div>



<div
className="
border
rounded
p-3
"
>

<div>

Latest Event:

{" "}

{latest?.event || "-"}

</div>


<div>

Snapshot:

{" "}

{latest?.snapshot || "-"}

</div>


<div>

Result:

{" "}

{latest?.result || "-"}

</div>


<div>

Validation:

{" "}

{latest?.metadata?.validation || "-"}

</div>


<div>

Score:

{" "}

{latest?.metadata?.score || 0}

</div>


</div>




<div
className="
space-y-2
"
>

<div>

History:

</div>



{
events
.slice()
.reverse()
.map(
(event,index)=>(


<div
key={index}
className={`
border
rounded
p-3
text-sm
${getEventStyle(event.event)}
`}
>


<div>

#{index + 1}

</div>


<div>

Event:

{" "}

{event.event}

</div>


<div>

Snapshot:

{" "}

{event.snapshot || "-"}

</div>


<div>

Result:

{" "}

{event.result || "-"}

</div>


{
event.metadata?.error && (

<div>

Error:

{" "}

{event.metadata.error}

</div>

)

}


<div>

Time:

{" "}

{event.createdAt || "-"}

</div>


</div>


)

)

}


</div>


</div>

)

}


export default InstallerAuditCard
