import express from "express"


import {
  initializePersonalityRuntime,
  processPersonalityInput,
  getRuntimeStatus,
} from "../services/spacemonkey/modules/personalityRuntimeEngine/index.js"





function createSpacemonkeyPersonalityRuntimeEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/runtime",

    (req, res)=>{

      try{

        res.json({ success:true, ...getRuntimeStatus() })

      }
      catch(error){

        console.error("Spacemonkey personality runtime error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/runtime/initialize",

    (req, res)=>{

      try{

        res.json({ success:true, ...initializePersonalityRuntime(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey personality runtime initialize error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/runtime/process",

    (req, res)=>{

      try{

        res.json({ success:true, ...processPersonalityInput(req.body?.message) })

      }
      catch(error){

        console.error("Spacemonkey personality runtime process error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityRuntimeEngineRouter

}
