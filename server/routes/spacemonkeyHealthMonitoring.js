import express from "express"


import {
  createHealthSnapshot,
  getHealthStatus,
} from "../services/spacemonkey/modules/healthMonitoring/index.js"





function createSpacemonkeyHealthMonitoringRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/health-monitoring",

    (req, res)=>{

      try{

        res.json({ success:true, ...getHealthStatus() })

      }
      catch(error){

        console.error("Spacemonkey health monitoring error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/health-monitoring/snapshot",

    (req, res)=>{

      try{

        res.json({ success:true, ...createHealthSnapshot() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyHealthMonitoringRouter

}
