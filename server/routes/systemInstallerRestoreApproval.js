/*
=====================================

WOOD-BOOSTER OS

SYSTEM INSTALLER RESTORE APPROVAL API

Vastuut:

- tarjoaa restore approval tarkistuksen
- vaatii vahvistuksen
- palauttaa turvallisen tilan
- käsittelee hyväksynnän

Ei:

- suorita restorea
- muuta tiedostoja
- muuta järjestelmää

=====================================
*/


import express from "express"


import {
getInstallerV2,
} from "../services/systemInstaller/installerV2.js"



import {
getInstallerRestoreApproval,
} from "../services/systemInstaller/installerRestoreApproval.js"



const router =
express.Router()



router.post(
"/check",
(req, res) => {


try {


const installer =
getInstallerV2()



const approval =
installer.snapshotRestoreApproval



res.json({

success:true,

approval

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



router.post(
"/confirm",
(req, res) => {


try {


const confirmed =
req.body?.confirmed === true



const installer =
getInstallerV2()



const approval =
getInstallerRestoreApproval({

restorePlan:
installer.snapshotRestorePlan,

confirmed

})



res.json({

success:true,

approval

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
