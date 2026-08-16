import express from "express"


import {
  runHealthCheck,
  getHealthStatus,
} from "../services/spacemonkey/modules/creatorIntelligenceHealthMonitor/index.js"





function createSpacemonkeyCreatorIntelligenceHealthMonitorRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/health",

    (req, res)=>{

      try{

        res.json({ success:true, ...getHealthStatus() })

      }
      catch(error){

        console.error("Spacemonkey creator health error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/health/check",

    (req, res)=>{

      try{

        res.json({ success:true, ...runHealthCheck(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator health check error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceHealthMonitorRouter

}
