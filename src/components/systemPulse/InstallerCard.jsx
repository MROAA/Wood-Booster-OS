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



const snapshotEngine =
installer.snapshotEngine



const snapshotHistory =
installer.snapshotHistory



const snapshotValidator =
installer.snapshotValidator



const snapshotRepair =
installer.snapshotRepair



const snapshotRestorePlan =
installer.snapshotRestorePlan



const latestSnapshot =
snapshotHistory?.latest



const history =
snapshotHistory?.history || []



return (

<div
className="
space-y-4
p-4
rounded-lg
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
"
>


<div
className="
text-lg
text-[var(--wood-text)]
"
>

Installer System

</div>



<div>

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



<div>

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



<div>

System:

{" "}

{
system?.release
||
"-"
}

</div>



<div
className="
pt-2
border-t
border-[var(--wood-border)]
"
>

Snapshot Engine

</div>



<div>

Status:

{" "}

{
snapshotEngine?.status
||
"-"
}

</div>



<div>

Snapshots:

{" "}

{
snapshotEngine?.snapshotCount
||
0
}

</div>



<div>

Latest:

{" "}

{
latestSnapshot?.id
||
"-"
}

</div>



<div>

Validator:

{" "}

{
snapshotValidator?.status
||
"-"
}

</div>



<div>

Repair:

{" "}

{
snapshotRepair?.status
||
"-"
}

</div>



<div>

Restore:

{" "}

{
snapshotRestorePlan?.requiresConfirmation
?
"Confirmation required"
:
"-"
}

</div>



<div
className="
pt-2
border-t
border-[var(--wood-border)]
"
>

Snapshot History

</div>



<div>

Total:

{" "}

{
snapshotHistory?.count
||
0
}

</div>



<div
className="
space-y-2
text-sm
"
>

{
history
.slice(
0,
3
)
.map(
(snapshot)=>(


<div
key={
snapshot.id
}
className="
p-2
rounded
border
border-[var(--wood-border)]
"
>


<div>

{
snapshot.id
}

</div>


<div>

Git:

{" "}

{
snapshot.metadata?.git?.available
?
"available"
:
"not available"
}

</div>


<div>

Created:

{" "}

{
snapshot.metadata?.createdAt
||
"-"
}

</div>


</div>


)

)

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
"
>

Created:

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
