/*
WOOD-BOOSTER HQ

SPACEMONKEY

ARCHITECTURE REPAIR PLAN

Vastuut:

- analysoi Architecture Audit tuloksen
- tunnistaa puuttuvat rakenteet
- tekee korjaussuunnitelman

Ei:

- luo tiedostoja
- muuta moduuleita
- suorita korjauksia
*/


function createArchitectureRepairPlan(
audit
){

const missing =
audit?.missingIndex || []



const repairs =
missing.map(
moduleName => ({

module:
moduleName,

issue:
"Missing index.js",

action:
"Create module entry point",

status:
"planned"

})

)



return {

system:
"Spacemonkey Architecture Repair Plan",


status:

repairs.length === 0

?
"healthy"

:
"repair-needed",


summary: {

missingModules:
repairs.length,

ready:
repairs.filter(
item =>
item.status === "planned"
)
.length

},


repairs,


createdAt:
new Date()
.toISOString()


}

}



export {

createArchitectureRepairPlan

}
