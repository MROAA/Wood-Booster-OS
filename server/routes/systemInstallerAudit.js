/*
=====================================

WOOD-BOOSTER HQ

SYSTEM INSTALLER AUDIT API

Vastuut:

- tarjoaa Installer audit historian
- näyttää viimeisimmän tapahtuman

Ei:

- muuta audit tietoja
- suorita restorea
- muuta järjestelmää

=====================================
*/


import express from "express"


import {
getInstallerAuditLog,
} from "../services/systemInstaller/installerAuditLog.js"



const router =
express.Router()



router.get(
"/",
(req, res) => {


try {


const audit =
getInstallerAuditLog()



res.json({

success:true,

audit

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
