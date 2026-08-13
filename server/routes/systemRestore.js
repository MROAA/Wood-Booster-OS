import express from "express"

import {
  restoreSnapshot,
} from "../services/restoreService.js"

import {
  getLatestStableBuild,
} from "../services/aiBrainV2/services/systemPulse/stableBuildRegistry.js"



export default function createSystemRestoreRouter(){


  const router =
    express.Router()



  router.post(
    "/system/restore",
    async (
      req,
      res
    )=>{


      try{


        const {
          file,
          confirm,
        } =
          req.body



        const result =
          await restoreSnapshot(
            file,
            { confirm },
          )



        res.json(result)


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.error ||
            error.message ||
            "System restore failed"

        })


      }


    }
  )



  router.post(
    "/system/restore-last-known-good",
    async (
      req,
      res
    )=>{


      try{


        const {
          confirm,
        } =
          req.body



        const build =
          await getLatestStableBuild()



        if(!build){

          res.status(404).json({

            success:false,

            error:
              "No stable build registered yet",

          })


          return

        }



        if(confirm !== true){

          res.status(400).json({

            success:false,

            error:
              "Restore requires explicit confirmation",

          })


          return

        }



        const result =
          await restoreSnapshot(
            build.snapshot,
            { confirm },
          )



        res.json({

          ...result,

          restoredBuild:
            build,

        })


      }
      catch(error){


        res.status(500).json({

          success:false,

          error:
            error.error ||
            error.message ||
            "System restore failed"

        })


      }


    }
  )



  return router

}
