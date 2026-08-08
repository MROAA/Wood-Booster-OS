/*
WOOD-BOOSTER HQ

RECOVERY ORCHESTRATOR

Vastuut:

- yhdistää recovery-moduulit
- muodostaa kokonaisvaltaisen palautustilan
- tarjoaa System Pulse -raportin

Ei:

- suorita palautusta
- muuta tiedostoja
- ohita hyväksyntää
*/


import {
getLatestApproval,
} from "./approvalRegistry.js"


import {
validateRecoveryIntegrity,
} from "./integrityValidator.js"


import {
createRestoreDryRun,
} from "./restoreEngine.js"



export function getRecoverySystemStatus(){

const approval =
getLatestApproval()



if(!approval){

return {

system:
"Wood-Booster HQ Recovery",

status:
"waiting",

approval:
null,

integrity:
null,

restoreEngine:
null,

rollbackAvailable:
false,


checkedAt:
new Date().toISOString()

}

}



const integrity =
validateRecoveryIntegrity({

snapshot:
approval.snapshot,


metadata:
approval.validation?.metadata || {}

})



const restore =
createRestoreDryRun({

approval,

integrity

})



return {

system:
"Wood-Booster HQ Recovery",


status:
restore.status,


approval:{

id:
approval.id,

status:
approval.status

},


integrity:{

status:
integrity.status,

score:
integrity.score

},


restoreEngine:{

status:
restore.status

},


restorePlan:
restore.restorePlan,


rollbackAvailable:
restore.restorePlan?.rollbackAvailable || false,


checkedAt:
new Date().toISOString()

}

}
