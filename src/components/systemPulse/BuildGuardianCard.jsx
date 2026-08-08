function BuildGuardianCard({
  build,
}){


return (

<div
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
text-[var(--wood-text)]
"
>
Build Guardian
</h2>



<div>

<p
className="
text-sm
text-gray-400
"
>
Status
</p>

<p
className="
text-xl
"
>
{
build?.status === "stable"
?
"🟢 Stable"
:
"⚠️ Unknown"
}
</p>

</div>



<div>

<p
className="
text-sm
text-gray-400
"
>
Last stable snapshot
</p>


<p
className="
break-all
text-sm
"
>
{
build?.latestStableBuild?.snapshot
||
"-"
}
</p>

</div>



<div>

<p
className="
text-sm
text-gray-400
"
>
Recovery
</p>


<p>

{
build?.available
?
"Available"
:
"Not available"
}

</p>

</div>



</div>

)

}


export default BuildGuardianCard
