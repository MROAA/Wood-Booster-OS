/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE ROUTE

GET /api/system-pulse

Palauttaa:
- AI Brain tila
- moduulit
- capabilityt
- runtime
- hardware
- git
- git sync
- git history

=====================================
*/


import express from "express"


import {
  getSystemPulseState,
} from "../services/aiBrainV2/services/systemPulse/systemPulseState.js"





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
        await getSystemPulseState()



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





export default router
