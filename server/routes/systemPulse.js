/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE ROUTE

GET  /api/system-pulse
POST /api/system-pulse/snapshot

=====================================
*/


import express from "express"


import {
  getSystemPulseSummary,
} from "../services/aiBrainV2/services/systemPulse/systemPulseSummary.js"

import {
  createSnapshot,
} from "../../services/aiBrainV2/services/systemPulse/gitSync/snapshotService.js"





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





router.post(
  "/system-pulse/snapshot",
  async (
    req,
    res,
  ) => {

    try {


      const snapshot =
        await createSnapshot()



      res.json(
        snapshot
      )


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
