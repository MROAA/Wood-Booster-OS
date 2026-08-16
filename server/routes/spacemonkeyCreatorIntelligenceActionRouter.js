import express from "express"


import {
  routeAction,
  validateAction,
  createExecutionRequest,
  getActions,
} from "../services/spacemonkey/modules/creatorIntelligenceActionRouter/index.js"





function createSpacemonkeyCreatorIntelligenceActionRouterRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/action-router",

    (req, res)=>{

      try{

        res.json({ success:true, ...getActions() })

      }
      catch(error){

        console.error("Spacemonkey creator action router error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/action-router",

    (req, res)=>{

      try{

        const action =
          routeAction(req.body || {})


        res.json({ success:true, action })

      }
      catch(error){

        console.error("Spacemonkey creator action router route error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/action-router/validate",

    (req, res)=>{

      try{

        const result =
          validateAction(req.body || {})


        res.json({ success:true, ...result })

      }
      catch(error){

        console.error("Spacemonkey creator action router validate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/action-router/execution-request",

    (req, res)=>{

      try{

        const result =
          createExecutionRequest(req.body || {})


        res.json({ success:true, ...result })

      }
      catch(error){

        console.error("Spacemonkey creator action router execution request error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceActionRouterRouter

}
