import express from "express"


import {
  createPersonalityPayload,
  validatePersonalityPayload,
  getAdapterStatus,
} from "../services/spacemonkey/modules/personalityIntegrationAdapter/index.js"





function createSpacemonkeyPersonalityIntegrationAdapterRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/integration-adapter",

    (req, res)=>{

      try{

        res.json({ success:true, ...getAdapterStatus() })

      }
      catch(error){

        console.error("Spacemonkey personality integration adapter error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/integration-adapter/payload",

    (req, res)=>{

      try{

        res.json({ success:true, payload:createPersonalityPayload(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey personality integration adapter payload error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/integration-adapter/validate",

    (req, res)=>{

      try{

        res.json({ success:true, ...validatePersonalityPayload(req.body) })

      }
      catch(error){

        console.error("Spacemonkey personality integration adapter validate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityIntegrationAdapterRouter

}
