/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE ROUTE

GET  /api/system-pulse

POST /api/system-pulse/snapshot

GET  /api/system-pulse/snapshots

POST /api/system-pulse/restore

GET  /api/system-pulse/restore-previews

POST /api/system-pulse/restore-confirm

POST /api/system-pulse/restore-execute

=====================================
*/


import express from "express"

import fs from "fs/promises"


import {
  getSystemPulseState,
} from "../services/aiBrainV2/services/systemPulse/systemPulseState.js"


import {
  createSnapshot,
} from "../../services/aiBrainV2/services/systemPulse/gitSync/snapshotService.js"


import {
  prepareRestore,
} from "../../services/aiBrainV2/services/systemPulse/gitSync/restoreService.js"


import {
  confirmRestore,
} from "../../services/aiBrainV2/services/systemPulse/gitSync/restoreConfirmService.js"


import {
  executeRestore,
} from "../../services/aiBrainV2/services/systemPulse/gitSync/restoreEngine.js"





const router =
  express.Router()





const BACKUP_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/Backups"


const RESTORE_ROOT =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/RestorePreview"





router.get(
  "/system-pulse",
  async (
    req,
    res,
  ) => {

    const pulse =
      await getSystemPulseState()


    res.json({

      success:true,

      pulse

    })

  },
)





router.post(
  "/system-pulse/snapshot",
  async (
    req,
    res,
  ) => {

    const snapshot =
      await createSnapshot()


    res.json(
      snapshot
    )

  },
)





router.get(
  "/system-pulse/snapshots",
  async (
    req,
    res,
  ) => {

    try {


      const folders =
        await fs.readdir(
          BACKUP_ROOT,
          {
            withFileTypes:true
          }
        )



      const snapshots =
        folders
          .filter(
            item =>
              item.isDirectory()
          )
          .filter(
            item =>
              item.name.startsWith(
                "Wood-Booster-OS-"
              )
          )
          .map(
            item => ({

              name:
                item.name

            })
          )
          .reverse()



      res.json({

        success:true,

        snapshots

      })


    }
    catch(error){

      res.status(500).json({

        success:false,

        error:
          error.message

      })

    }

  },
)





router.post(
  "/system-pulse/restore",
  async (
    req,
    res,
  ) => {

    const result =
      await prepareRestore(
        req.body.snapshot
      )


    res.json(
      result
    )

  },
)





router.get(
  "/system-pulse/restore-previews",
  async (
    req,
    res,
  ) => {

    try {


      const folders =
        await fs.readdir(
          RESTORE_ROOT,
          {
            withFileTypes:true
          }
        )


      res.json({

        success:true,

        previews:
          folders
            .filter(
              item =>
                item.isDirectory()
            )
            .map(
              item => ({
                name:item.name
              })
            )

      })


    }
    catch(error){

      res.json({

        success:true,

        previews:[]

      })

    }

  },
)





router.post(
  "/system-pulse/restore-confirm",
  async (
    req,
    res,
  ) => {

    const result =
      await confirmRestore(
        req.body.snapshot
      )


    res.json(
      result
    )

  },
)





router.post(
  "/system-pulse/restore-execute",
  async (
    req,
    res,
  ) => {

    const result =
      await executeRestore(
        req.body.snapshot
      )


    res.json(
      result
    )

  },
)





export default router
