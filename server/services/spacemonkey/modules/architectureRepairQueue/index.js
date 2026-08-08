/*
WOOD-BOOSTER HQ

SPACEMONKEY

ARCHITECTURE REPAIR QUEUE

Vastuut:

- muodostaa korjausjonon
- priorisoi puuttuvat rakenteet
- antaa perustelun

Ei:

- muuta tiedostoja
- luo moduuleita
- suorita korjauksia
*/


function createRepairQueue(
repairPlan
){

const repairs =
repairPlan?.repairs || []



const priorityMap = {

memory:
"high",

context:
"high",

planner:
"medium",

cognitive:
"medium",

attention:
"low",

awareness:
"low"

}



const reasonMap = {

memory:
"Core intelligence dependency",

context:
"Required by reasoning pipeline",

planner:
"Planning capability",

cognitive:
"Cognitive processing layer",

attention:
"Attention management layer",

awareness:
"System awareness layer"

}



const queue =
repairs.map(
(item,index)=>({

order:
index + 1,

module:
item.module,


priority:
priorityMap[item.module] || "low",


reason:
reasonMap[item.module] || "Architecture improvement",


status:
"waiting-approval"


})

)



return {

system:
"Spacemonkey Architecture Repair Queue",


status:

queue.length > 0

?
"pending-review"

:
"clean",


total:
queue.length,


queue,


createdAt:
new Date().toISOString()

}

}



export {

createRepairQueue

}
