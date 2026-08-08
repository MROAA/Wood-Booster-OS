function InstallerCard({
installer,
onCreateSnapshot,
snapshotResult
}) {

if (!installer) {

return null

}



const runtime =
installer.runtime?.runtime



const system =
installer.systemInfo?.operatingSystem



const recovery =
installer.recovery



const snapshotRepair =
installer.snapshotRepair



return (

<div
className="
p-4
rounded-lg
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
space-y-3
"
>


<div
className="
text-sm
text-[var(--wood-text)]
"
>

Installer System

</div>



<div
className="
text-sm
text-[var(--wood-muted)]
"
>

Recovery:

{" "}

{
snapshotRepair?.canRestore
?
"Ready"
:
"Unavailable"
}

</div>



<div
className="
text-sm
text-[var(--wood-muted)]
"
>

Runtime:

{" "}

{
runtime?.platform
||
"-"
}

{" / "}

{
runtime?.architecture
||
"-"
}

</div>



<div
className="
text-sm
text-[var(--wood-muted)]
"
>

System:

{" "}

{
system?.release
||
"-"
}

</div>



<button
onClick={onCreateSnapshot}
className="
px-4
py-2
rounded
bg-[var(--wood-text)]
text-[var(--wood-panel)]
text-sm
"
>

Create Snapshot

</button>



{
snapshotResult && (

<div
className="
text-sm
text-[var(--wood-muted)]
"
>

Snapshot:

{" "}

{
snapshotResult.snapshotId
||
"-"
}

</div>

)

}


</div>

)

}

export default InstallerCard
