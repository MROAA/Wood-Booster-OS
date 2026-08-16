import express from "express"


import {
  analyzeDecision,
  evaluateRisk,
  explainDecision,
  getDecisions,
} from "../services/spacemonkey/modules/creatorIntelligenceDecisionEngine/index.js"





function createSpacemonkeyCreatorIntelligenceDecisionEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/decision-engine",

    (req, res)=>{

      try{

        res.json({ success:true, ...getDecisions() })

      }
      catch(error){

        console.error("Spacemonkey creator decision engine error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/decision-engine/analyze",

    (req, res)=>{

      try{

        const decision =
          analyzeDecision(req.body || {})


        res.json({ success:true, decision })

      }
      catch(error){

        console.error("Spacemonkey creator decision engine analyze error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/decision-engine/risk",

    (req, res)=>{

      try{

        res.json({ success:true, ...evaluateRisk(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator decision engine risk error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/decision-engine/explain",

    (req, res)=>{

      try{

        res.json({ success:true, ...explainDecision(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator decision engine explain error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceDecisionEngineRouter

}
