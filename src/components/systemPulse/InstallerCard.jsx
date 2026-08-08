import StatusGlow from "./StatusGlow"


function InstallerCard({
installer,
onCreateSnapshot,
snapshotResult,
onRequestRestore,
restoreApprovalResult
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



const snapshotRestoreApproval =
installer.snapshotRestoreApproval



const latestSnapshot =
snapshotHistory?.latest



const history =
snapshotHistory?.history || []



const restoreTarget =
snapshotRestorePlan?.targetSnapshot



return (

<div
className="
space-y-4
p-5
rounded-lg
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
"
>


<h2>
Installer System
</h2>



<StatusGlow
label="Recovery"
value={
snapshotRepair?.canRestore
?
"Ready"
:
"Unavailable"
}
status={
snapshotRepair?.canRestore
?
"healthy"
:
"warning"
}
/>



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



<h3>
Snapshot Engine
</h3>



<StatusGlow
label="Engine"
value={
snapshotEngine?.status
||
"-"
}
status={
snapshotEngine?.status === "ready"
?
"healthy"
:
"warning"
}
/>



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



<StatusGlow
label="Validator"
value={
snapshotValidator?.status
||
"-"
}
status={
snapshotValidator?.status === "healthy"
?
"healthy"
:
"warning"
}
/>



<StatusGlow
label="Repair"
value={
snapshotRepair?.status
||
"-"
}
status={
snapshotRepair?.status === "ready"
?
"healthy"
:
"warning"
}
/>



<h3>
Snapshot History
</h3>



<div>

Total:

{" "}

{
snapshotHistory?.count
||
0
}

</div>



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
>

<div>
{snapshot.id}
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



<h3>
Restore Preview
</h3>



<div>

Target:

{" "}

{
restoreTarget?.id
||
"-"
}

</div>



<StatusGlow
label="Validation"
value={
snapshotRestorePlan?.validation
||
"-"
}
status={
snapshotRestorePlan?.validation === "healthy"
?
"healthy"
:
"warning"
}
/>



<div>

Score:

{" "}

{
snapshotRestorePlan?.score
||
0
}

</div>



<div>

Steps:

</div>



{
snapshotRestorePlan?.steps?.map(
(step)=>(

<div
key={step}
>
✓ {step}
</div>

)

)

}



<h3>
Restore Approval
</h3>



<StatusGlow
label="Approval"
value={
snapshotRestoreApproval?.status
||
"-"
}
status={
snapshotRestoreApproval?.status === "approved"
?
"healthy"
:
"warning"
}
/>



<div>

Confirmation:

{" "}

{
snapshotRestoreApproval?.requiresConfirmation
?
"required"
:
"-"
}

</div>



<div>

Can Restore:

{" "}

{
snapshotRestoreApproval?.canRestore
?
"true"
:
"false"
}

</div>



<div>

Audit:

{" "}

{
snapshotRestoreApproval?.audit?.event
||
"-"
}

</div>



<button
onClick={onRequestRestore}
className="
px-4
py-2
rounded
border
border-[var(--wood-border)]
text-sm
"
>

Request Restore

</button>



{
restoreApprovalResult && (

<div
className="
text-sm
"
>

Restore request:

{" "}

{
restoreApprovalResult.status
||
"-"
}

</div>

)

}



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

<div>

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
