import express from "express"


import {
  createSnapshot,
  getSnapshots,
  getLatestSnapshot,
  restoreSnapshot,
} from "../services/spacemonkey/modules/personalityStateSnapshot/index.js"





function createSpacemonkeyPersonalityStateSnapshotRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/snapshots",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSnapshots() })

      }
      catch(error){

        console.error("Spacemonkey personality snapshots error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/snapshots/latest",

    (req, res)=>{

      try{

        res.json({ success:true, snapshot:getLatestSnapshot() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/snapshots",

    (req, res)=>{

      try{

        const snapshot =
          createSnapshot(req.body || {})


        res.json({ success:true, snapshot })

      }
      catch(error){

        console.error("Spacemonkey personality snapshots create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/snapshots/:id/restore",

    (req, res)=>{

      try{

        res.json(restoreSnapshot(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey personality snapshots restore error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityStateSnapshotRouter

}
