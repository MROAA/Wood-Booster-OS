import express from "express"


import {
  evaluateTrust,
  canUseKnowledge,
  getTrustRecords,
  getLatestTrust,
} from "../services/spacemonkey/modules/creatorIntelligenceTrustLayer/index.js"





function createSpacemonkeyCreatorIntelligenceTrustLayerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/trust",

    (req, res)=>{

      try{

        res.json({ success:true, ...getTrustRecords() })

      }
      catch(error){

        console.error("Spacemonkey creator trust error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/trust/latest",

    (req, res)=>{

      try{

        res.json({ success:true, records:getLatestTrust() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/trust",

    (req, res)=>{

      try{

        const trust =
          evaluateTrust(req.body || {})


        res.json({ success:true, trust })

      }
      catch(error){

        console.error("Spacemonkey creator trust evaluate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/trust/can-use",

    (req, res)=>{

      try{

        res.json({ success:true, ...canUseKnowledge(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator trust can-use error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceTrustLayerRouter

}
