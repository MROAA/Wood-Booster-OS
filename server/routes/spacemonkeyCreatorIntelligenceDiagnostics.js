import express from "express"


import {
  runDiagnostics,
  getDiagnostics,
} from "../services/spacemonkey/modules/creatorIntelligenceDiagnostics/index.js"





function createSpacemonkeyCreatorIntelligenceDiagnosticsRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/diagnostics",

    (req, res)=>{

      try{

        res.json({ success:true, ...getDiagnostics() })

      }
      catch(error){

        console.error("Spacemonkey creator diagnostics error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/diagnostics/run",

    (req, res)=>{

      try{

        res.json({ success:true, ...runDiagnostics(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator diagnostics run error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceDiagnosticsRouter

}
