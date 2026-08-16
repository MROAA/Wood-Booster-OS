import express from "express"


import {
  buildPersonalityContext,
  getPersonalityComponents,
  getContextStatus,
} from "../services/spacemonkey/modules/personalityContextBuilder/index.js"





function createSpacemonkeyPersonalityContextBuilderRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/context",

    (req, res)=>{

      try{

        res.json({ success:true, ...buildPersonalityContext() })

      }
      catch(error){

        console.error("Spacemonkey personality context error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/context/components",

    (req, res)=>{

      try{

        res.json({ success:true, components:getPersonalityComponents() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/context/status",

    (req, res)=>{

      try{

        res.json({ success:true, ...getContextStatus() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityContextBuilderRouter

}
