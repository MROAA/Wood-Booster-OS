import express from "express"


import {
  createIntegrityCheck,
  compareVersions,
  getIntegrityChecks,
  getLatestChecks,
  getIntegrityStatus,
} from "../services/spacemonkey/modules/creatorIntelligenceIntegrityMonitor/index.js"





function createSpacemonkeyCreatorIntelligenceIntegrityMonitorRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/integrity",

    (req, res)=>{

      try{

        res.json({ success:true, ...getIntegrityStatus() })

      }
      catch(error){

        console.error("Spacemonkey creator integrity error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/integrity/checks",

    (req, res)=>{

      try{

        res.json({ success:true, ...getIntegrityChecks() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/integrity/checks/latest",

    (req, res)=>{

      try{

        res.json({ success:true, checks:getLatestChecks() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/integrity/checks",

    (req, res)=>{

      try{

        const check =
          createIntegrityCheck(req.body || {})


        res.json({ success:true, check })

      }
      catch(error){

        console.error("Spacemonkey creator integrity check error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/integrity/compare",

    (req, res)=>{

      try{

        res.json({ success:true, ...compareVersions(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator integrity compare error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceIntegrityMonitorRouter

}
