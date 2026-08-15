import express from "express"


import {
  initializeControlCenter,
  createControlReport,
  getControlStatus,
} from "../services/spacemonkey/modules/creatorIntelligenceControlCenter/index.js"





function createSpacemonkeyCreatorIntelligenceControlCenterRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/control-center",

    (req, res)=>{

      try{

        res.json({ success:true, ...getControlStatus() })

      }
      catch(error){

        console.error("Spacemonkey creator control center error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/control-center/initialize",

    (req, res)=>{

      try{

        res.json({ success:true, ...initializeControlCenter(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator control center initialize error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/control-center/report",

    (req, res)=>{

      try{

        res.json({ success:true, ...createControlReport(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator control center report error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceControlCenterRouter

}
