/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE ROUTE

GET  /api/system-pulse

Varmuuskopiot ja palautus: ks. /api/backup, /api/backups,
/api/system/restore (server/routes/backup.js, backups.js,
systemRestore.js).

=====================================
*/


import express from "express"


import {
  getSystemPulseSummary,
} from "../services/aiBrainV2/services/systemPulse/systemPulseSummary.js"


import {
  getStableBuilds,
} from "../services/aiBrainV2/services/systemPulse/stableBuildRegistry.js"





const router =
  express.Router()





router.get(
  "/system-pulse",
  async (
    req,
    res,
  ) => {

    try {


const pulse =
  await getSystemPulseSummary()


      res.json({

        success:
          true,


        pulse,

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

  },
)



router.get(
  "/system-pulse/stable-builds",
  async (
    req,
    res,
  ) => {

    try {


const builds =
  await getStableBuilds()


      res.json({

        success:
          true,


        builds,

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

  },
)






export default router
