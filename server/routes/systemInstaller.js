import express from "express"

import {
    getInstallerHealth,
} from "../services/systemInstaller/installerHealth.js"


import {
    getInstallerManager,
} from "../services/systemInstaller/installerManager.js"



const router =
    express.Router()



router.get(
    "/system-installer",
    (
        req,
        res
    ) => {


        try {


            const health =
                getInstallerHealth()



            const manager =
                getInstallerManager()



            res.json({

                success:
                    true,


                installer: {

                    health,


                    manager,

                },

            })


        }
        catch(error){


            res.status(500).json({

                success:
                    false,


                error:
                    error.message,

            })


        }


    }

)



export default router
