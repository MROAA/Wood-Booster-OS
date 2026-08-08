/*
WOOD-BOOSTER HQ

SPACEMONKEY

ARCHITECTURE HEALTH ROUTE

Vastuut:

- tarjoaa Spacemonkey arkkitehtuurin terveystilan
- yhdistää audit + repair plan tiedot

Ei:

- muuta moduuleita
- suorita korjauksia
- tee automaattisia muutoksia
*/


import express from "express"

import {
getArchitectureHealth
} from "../services/spacemonkey/modules/architectureRepair/service.js"



const router =
express.Router()



router.get(
"/",
(req,res)=>{


try {


const architecture =
getArchitectureHealth()



res.json({

success:true,

architecture

})


}

catch(error){


res.status(500)
.json({

success:false,

error:
error.message

})


}


}

)



export default router
