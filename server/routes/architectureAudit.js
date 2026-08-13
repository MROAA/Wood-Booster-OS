import express from "express"

import {
getArchitectureAudit
} from "../services/spacemonkey/modules/architectureAudit/index.js"



const router =
express.Router()



router.get(
"/",
(req,res)=>{

try {

console.log(
"[ArchitectureAudit] running"
)


const audit =
getArchitectureAudit()



console.log(
"[ArchitectureAudit] modules:",
audit.modules.total
)


res.json({

success:true,

audit

})


}

catch(error){

console.error(
"[ArchitectureAudit] error:",
error
)


res.status(500)
.json({

success:false,

error:error.message

})

}

}

)



export default router
