import express from "express"


import {
  createReflectionRequest,
  evaluateReflection,
  getReflections,
  getPendingReflections,
} from "../services/spacemonkey/modules/personalityReflectionConnector/index.js"





function createSpacemonkeyPersonalityReflectionConnectorRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/reflections",

    (req, res)=>{

      try{

        const pending =
          req.query.pending === "true"


        const data =
          pending
            ? { moduleId: "personality-reflection-connector", reflections: getPendingReflections() }
            : getReflections()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personality reflections error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/reflections",

    (req, res)=>{

      try{

        const request =
          createReflectionRequest(req.body || {})


        res.json({ success:true, request })

      }
      catch(error){

        console.error("Spacemonkey personality reflections create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/reflections/evaluate",

    (req, res)=>{

      try{

        res.json(evaluateReflection(req.body || {}))

      }
      catch(error){

        console.error("Spacemonkey personality reflections evaluate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityReflectionConnectorRouter

}
