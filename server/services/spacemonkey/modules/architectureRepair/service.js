/*
WOOD-BOOSTER HQ

SPACEMONKEY

ARCHITECTURE REPAIR SERVICE

Vastuut:

- yhdistää Architecture Audit
- muodostaa Repair Plan
- muodostaa Repair Queue
- tarjoaa System Pulse tiedon

Ei:

- muuta moduuleita
- luo tiedostoja
- suorita korjauksia
*/


import {
getArchitectureAudit
} from "../architectureAudit/index.js"


import {
createArchitectureRepairPlan
} from "./index.js"


import {
createRepairQueue
} from "../architectureRepairQueue/index.js"





function getArchitectureHealth(){


const audit =
getArchitectureAudit()



const repairPlan =
createArchitectureRepairPlan(
audit
)



const repairQueue =
createRepairQueue(
repairPlan
)





return {


system:

"Spacemonkey Architecture Health",



status:

audit.status,



score:

audit.score,



audit:
{

modules:
audit.modules,

missingIndex:
audit.missingIndex

},



repairPlan,



repairQueue,



checkedAt:

new Date()
.toISOString()


}


}





export {

getArchitectureHealth

}
