import express from "express"
import path from "path"
import { stat } from "fs/promises"

import {
  getSnapshotRegistry,
} from "../services/snapshotRegistryService.js"



const BACKUP_DIR =
  "/home/marc/Wood-Booster-AI/backups"



async function existsOnDisk(snapshot){

  try {
    await stat(path.join(BACKUP_DIR, snapshot.file))
    return true
  }
  catch {
    return false
  }

}



export default function createBackupsRouter(){


  const router =
    express.Router()



  router.get(
    "/backups",
    async (
      req,
      res
    )=>{


      try{


        const allSnapshots =
          await getSnapshotRegistry()

        const existing =
          await Promise.all(
            allSnapshots.map(
              async snapshot => ({
                snapshot,
                exists: await existsOnDisk(snapshot),
              })
            )
          )

        const snapshots =
          existing
            .filter(({ exists }) => exists)
            .map(({ snapshot }) => snapshot)



        res.json({

          success:true,

          snapshots,

        })


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.message ||
            "Could not read snapshot registry"

        })


      }


    }
  )



  return router

}
