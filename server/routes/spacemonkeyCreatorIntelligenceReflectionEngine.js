import express from "express"


import {
  createReflection,
  analyzeDecision,
  getReflections,
  getLatestReflections,
  getLessons,
} from "../services/spacemonkey/modules/creatorIntelligenceReflectionEngine/index.js"





function createSpacemonkeyCreatorIntelligenceReflectionEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/reflections",

    (req, res)=>{

      try{

        res.json({ success:true, ...getReflections() })

      }
      catch(error){

        console.error("Spacemonkey creator reflections error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/reflections/latest",

    (req, res)=>{

      try{

        res.json({ success:true, reflections:getLatestReflections() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/reflections/lessons",

    (req, res)=>{

      try{

        res.json({ success:true, lessons:getLessons() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/reflections",

    (req, res)=>{

      try{

        const reflection =
          createReflection(req.body || {})


        res.json({ success:true, reflection })

      }
      catch(error){

        console.error("Spacemonkey creator reflections create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/reflections/analyze-decision",

    (req, res)=>{

      try{

        const reflection =
          analyzeDecision(req.body || {})


        res.json({ success:true, reflection })

      }
      catch(error){

        console.error("Spacemonkey creator reflections analyze error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceReflectionEngineRouter

}
