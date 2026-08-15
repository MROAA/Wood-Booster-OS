import express from "express"


import {
  analyzePersonalityEvent,
  getLearningProposals,
  getLatestProposals,
} from "../services/spacemonkey/modules/personalityLearningBridge/index.js"





function createSpacemonkeyPersonalityLearningBridgeRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/learning",

    (req, res)=>{

      try{

        res.json({ success:true, ...getLearningProposals() })

      }
      catch(error){

        console.error("Spacemonkey personality learning error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/learning/latest",

    (req, res)=>{

      try{

        res.json({ success:true, proposals:getLatestProposals() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/learning",

    (req, res)=>{

      try{

        const proposal =
          analyzePersonalityEvent(req.body || {})


        res.json({ success:true, proposal })

      }
      catch(error){

        console.error("Spacemonkey personality learning create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityLearningBridgeRouter

}
