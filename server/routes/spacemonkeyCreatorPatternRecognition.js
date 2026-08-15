import express from "express"


import {
  analyzePattern,
  recognizeDecisionPattern,
  getPatterns,
  getPatternsByCategory,
  getLatestPatterns,
} from "../services/spacemonkey/modules/creatorPatternRecognition/index.js"





function createSpacemonkeyCreatorPatternRecognitionRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/patterns",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "creator-pattern-recognition", patterns: getPatternsByCategory(category) }
            : getPatterns()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator patterns error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/patterns/latest",

    (req, res)=>{

      try{

        res.json({ success:true, patterns:getLatestPatterns() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/patterns",

    (req, res)=>{

      try{

        const pattern =
          analyzePattern(req.body || {})


        res.json({ success:true, pattern })

      }
      catch(error){

        console.error("Spacemonkey creator patterns create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/patterns/decision-recognition",

    (req, res)=>{

      try{

        const decisions =
          Array.isArray(req.body?.decisions)
            ? req.body.decisions
            : []


        const result =
          recognizeDecisionPattern(decisions)


        res.json({ success:true, result })

      }
      catch(error){

        console.error("Spacemonkey creator decision pattern recognition error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorPatternRecognitionRouter

}
