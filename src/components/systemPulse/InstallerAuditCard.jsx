function InstallerAuditCard({
audit
}) {


if(!audit){

return null

}



const latest =
audit.latest



return (

<div
className="
border
rounded-lg
p-4
space-y-3
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

Events:

{" "}

{
audit.count || 0
}

</div>



<div>

Latest:

{" "}

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

)

}


export default InstallerAuditCard
