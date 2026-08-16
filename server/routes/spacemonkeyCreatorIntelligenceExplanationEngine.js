import express from "express"


import {
  createExplanation,
  evaluateConfidence,
  getExplanations,
  getLatestExplanations,
} from "../services/spacemonkey/modules/creatorIntelligenceExplanationEngine/index.js"





function createSpacemonkeyCreatorIntelligenceExplanationEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/explanations",

    (req, res)=>{

      try{

        res.json({ success:true, ...getExplanations() })

      }
      catch(error){

        console.error("Spacemonkey creator explanations error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/explanations/latest",

    (req, res)=>{

      try{

        res.json({ success:true, explanations:getLatestExplanations() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/explanations",

    (req, res)=>{

      try{

        const explanation =
          createExplanation(req.body || {})


        res.json({ success:true, explanation })

      }
      catch(error){

        console.error("Spacemonkey creator explanations create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/explanations/confidence",

    (req, res)=>{

      try{

        res.json({ success:true, ...evaluateConfidence(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator explanations confidence error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceExplanationEngineRouter

}
