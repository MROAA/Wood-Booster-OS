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

{
audit.count || 0
}

</div>



<div
className="
space-y-1
"
>

<div>

Latest Event:

</div>


<div>

{
latest?.event || "-"
}

</div>


<div>

Snapshot:

{" "}

{
latest?.snapshot || "-"
}

</div>


<div>

Result:

{" "}

{
latest?.result || "-"
}

</div>


<div>

Validation:

{" "}

{
latest?.metadata?.validation || "-"
}

</div>


<div>

Score:

{" "}

{
latest?.metadata?.score || 0
}

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
className="
border
rounded
p-2
text-sm
"
>


<div>

#{index + 1}

</div>


<div>

Event:

{" "}

{
event.event
}

</div>


<div>

Snapshot:

{" "}

{
event.snapshot || "-"
}

</div>


<div>

Result:

{" "}

{
event.result
}

</div>


<div>

Time:

{" "}

{
event.createdAt
}

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
