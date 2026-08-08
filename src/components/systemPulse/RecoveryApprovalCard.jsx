function RecoveryApprovalCard({
recovery
}) {


if(!recovery){

return null

}


const approval =
recovery.latest



if(!approval){

return (

<section
className="
p-6
rounded-xl
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
"
>

<h2>
Recovery
</h2>

<p>
No pending restore requests
</p>

</section>

)

}



return (

<section
className="
p-6
rounded-xl
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
space-y-3
"
>

<h2
className="
text-lg
font-semibold
"
>
Recovery Approval
</h2>


<div>
Snapshot:
{" "}
{approval.snapshot}
</div>


<div>
Requested by:
{" "}
{approval.requestedBy}
</div>


<div>
Status:
{" "}
{approval.status}
</div>


<div>
Created:
{" "}
{
new Date(
approval.createdAt
).toLocaleString()
}
</div>


</section>

)

}


export default RecoveryApprovalCard
