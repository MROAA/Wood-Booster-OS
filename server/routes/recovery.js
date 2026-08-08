/*
WOOD-BOOSTER HQ

RECOVERY ROUTES

Vastuut:

- tarjoaa API:n Recovery Approval Gatewaylle
- vastaanottaa palautuspyynnöt
- hyväksyy tai hylkää palautuksia

Ei:

- suorita palautusta
- muuta tiedostoja
*/


import express from "express"


import {
requestRestoreApproval,
approveRestore,
rejectRestore,
getRestoreApprovalStatus,
} from "../services/systemRecovery/approvalGateway.js"



const router =
express.Router()



router.post(
"/request",
(req,res)=>{


try {


const result =
requestRestoreApproval(
req.body
)


res.json(result)


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


try {


const result =
approveRestore(
req.body.id
)


res.json(result)


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


try {


const result =
rejectRestore(
req.body.id
)


res.json(result)


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



export default router
