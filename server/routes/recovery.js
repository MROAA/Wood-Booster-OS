/*
WOOD-BOOSTER HQ

RECOVERY API ROUTES

Vastuut:

- vastaanottaa palautuspyynnöt
- hallitsee hyväksyntää
- näyttää stable build tiedot
- näyttää recovery orchestrator tilan
- käynnistää hyväksytyn restore-prosessin

Ei:

- ohita validointia
- suorita suoraa tiedostojen ylikirjoitusta
- palauta ilman hyväksyntää
*/


import express from "express"


import {

requestRestoreApproval,

approveRestore,

rejectRestore,

getRestoreApprovalStatus,

} from "../services/systemRecovery/approvalGateway.js"



import {

getStableBuildStatus,

} from "../services/aiBrainV2/services/systemPulse/buildGuardian.js"



import {

getRecoverySystemStatus,

} from "../services/systemRecovery/recoveryOrchestrator.js"



import {

executeRestore,

} from "../services/systemRecovery/restoreEngine.js"



const router =
express.Router()



router.post(
"/request",
(req,res)=>{

try{


const result =
requestRestoreApproval(
req.body || {}
)


res.json(
result
)


}

catch(error){

res.status(500).json({

success:false,

error:error.message

})

}

}

)



router.post(
"/approve",
(req,res)=>{

try{


const result =
approveRestore(
req.body.id
)


res.json(
result
)


}

catch(error){

res.status(500).json({

success:false,

error:error.message

})

}

}

)



router.post(
"/reject",
(req,res)=>{

try{


const result =
rejectRestore(
req.body.id
)


res.json(
result
)


}

catch(error){

res.status(500).json({

success:false,

error:error.message

})

}

}

)



router.get(
"/status",
(req,res)=>{

res.json({

success:true,

recovery:
getRestoreApprovalStatus()

})

}

)



router.get(
"/stable-build",
(req,res)=>{

try{


res.json({

success:true,

stableBuild:
getStableBuildStatus()

})


}

catch(error){

res.status(500).json({

success:false,

error:error.message

})

}

}

)



router.get(
"/orchestrator",
(req,res)=>{

try{


res.json({

success:true,

recovery:
getRecoverySystemStatus()

})


}

catch(error){

res.status(500).json({

success:false,

error:error.message

})

}

}

)



router.post(
"/execute",
(req,res)=>{

try{


const result =
executeRestore({

approval:
req.body.approval,


integrity:
req.body.integrity

})


res.json(
result
)


}

catch(error){

res.status(500).json({

success:false,

error:error.message

})

}

}

)



export default router
