function ArchitectureCard({
architecture
}) {


if(!architecture){

return null

}



const modules =
architecture.audit?.modules



const missing =
architecture.audit?.missingIndex || []



const repair =
architecture.repairPlan



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
Spacemonkey Architecture
</h3>



<div>

Status:

{" "}

{architecture.status || "-"}

</div>



<div>

Score:

{" "}

{architecture.score || 0}/100

</div>



<div>

Modules:

{" "}

{modules?.total || 0}

</div>



<div>

Healthy:

{" "}

{modules?.healthy || 0}

</div>



<div>

With Tests:

{" "}

{modules?.withTests || 0}

</div>



<div>

Repair Plan:

{" "}

{repair?.status || "-"}

</div>



<div>

Missing Index:

{" "}

{missing.length}

</div>



{
missing.length > 0 && (

<div
className="
space-y-1
"
>

<div>

Missing:

</div>


{
missing.map(
(module)=>(

<div
key={module}
className="
text-sm
"
>

• {module}

</div>

)

)

}


</div>

)

}



</div>

)

}


export default ArchitectureCard
