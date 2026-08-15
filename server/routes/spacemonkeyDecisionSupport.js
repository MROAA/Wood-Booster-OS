import express from "express"


import {
  createDecisionFramework,
  evaluateDecision,
} from "../services/spacemonkey/modules/decisionSupport/index.js"





function createSpacemonkeyDecisionSupportRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/decision-support",

    (req, res)=>{

      try{

        res.json({ success:true, ...createDecisionFramework() })

      }
      catch(error){

        console.error("Spacemonkey decision support error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/decision-support/evaluate",

    (req, res)=>{

      try{

        res.json({ success:true, ...evaluateDecision(req.body?.decision) })

      }
      catch(error){

        console.error("Spacemonkey decision support evaluate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyDecisionSupportRouter

}
