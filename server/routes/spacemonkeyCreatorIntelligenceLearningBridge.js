import express from "express"


import {
  createLearningEvent,
  processReflection,
  getLearningEvents,
  getLatestLearning,
  exportKnowledgeUpdate,
} from "../services/spacemonkey/modules/creatorIntelligenceLearningBridge/index.js"





function createSpacemonkeyCreatorIntelligenceLearningBridgeRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/learning",

    (req, res)=>{

      try{

        res.json({ success:true, ...getLearningEvents() })

      }
      catch(error){

        console.error("Spacemonkey creator learning error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/learning/latest",

    (req, res)=>{

      try{

        res.json({ success:true, events:getLatestLearning() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/learning/export",

    (req, res)=>{

      try{

        res.json({ success:true, ...exportKnowledgeUpdate() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/learning",

    (req, res)=>{

      try{

        const learning =
          createLearningEvent(req.body || {})


        res.json({ success:true, learning })

      }
      catch(error){

        console.error("Spacemonkey creator learning create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/learning/reflection",

    (req, res)=>{

      try{

        const learning =
          processReflection(req.body || {})


        res.json({ success:true, learning })

      }
      catch(error){

        console.error("Spacemonkey creator learning reflection error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceLearningBridgeRouter

}
