/*
WOOD-BOOSTER HQ

SYSTEM PULSE

RESTORE AUDIT CARD

Vastuut:

- näyttää restore audit historian
- näyttää viimeisimmän palautustapahtuman

Ei:

- suorita palautusta
- muuta järjestelmää
*/


function RestoreAuditCard({
audit
}) {


if(
!audit ||
audit.length === 0
){

return null

}



const latest =
audit[
audit.length - 1
]



return (

<section

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
"
>
Restore Audit
</h2>



<div>

Events:

{" "}

{audit.length}

</div>



<div>

Latest Event:

{" "}

{latest.event}

</div>



<div>

Snapshot:

{" "}

{latest.snapshot || "-"}

</div>



<div>

Status:

{" "}

{latest.status}

</div>



<div>

Operator:

{" "}

{latest.operator}

</div>



<div>

Created:

{" "}

{latest.createdAt}

</div>



</section>

)

}


export default RestoreAuditCard
