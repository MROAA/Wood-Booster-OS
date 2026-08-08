function ArchitectureRepairQueueCard({
repairQueue
}) {


return (

<div
className="
border
rounded-lg
p-4
bg-[var(--wood-panel)]
"
>

<h3>
Architecture Repair Queue TEST
</h3>


<pre>
{
JSON.stringify(
repairQueue,
null,
2
)
}
</pre>


</div>

)

}


export default ArchitectureRepairQueueCard
