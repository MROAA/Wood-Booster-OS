/*
=====================================

WOOD-BOOSTER HQ

SYSTEM INSTALLER SNAPSHOT API

Vastuut:

- hallittu snapshotin luonti
- käyttää Snapshot Creator moduulia

Ei:

- automaattisia snapshotteja
- restore-toimintoja

=====================================
*/


import express from "express"


import {
    createInstallerSnapshot,
} from "../services/systemInstaller/installerSnapshotCreator.js"



const router =
    express.Router()



router.post(
    "/create",
    (req, res) => {


        try {


            const snapshot =
                createInstallerSnapshot()



            res.json({

                success: true,

                snapshot,

            })


        }

        catch(error){


            res.status(500)
            .json({

                success: false,

                error:
                    error.message,

            })


        }


    }
)



export default router
