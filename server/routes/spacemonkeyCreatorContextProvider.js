import express from "express"


import {
  updateCreatorContext,
  getCreatorContext,
  getIdentityContext,
  getPhilosophyContext,
  getDecisionContext,
  getVisionContext,
  getPatternContext,
  clearContext,
} from "../services/spacemonkey/modules/creatorContextProvider/index.js"





function createSpacemonkeyCreatorContextProviderRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context",

    (req, res)=>{

      try{

        res.json({ success:true, ...getCreatorContext() })

      }
      catch(error){

        console.error("Spacemonkey creator context provider error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/identity",

    (req, res)=>{

      try{

        res.json({ success:true, identity:getIdentityContext() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/philosophy",

    (req, res)=>{

      try{

        res.json({ success:true, philosophy:getPhilosophyContext() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/decisions",

    (req, res)=>{

      try{

        res.json({ success:true, decisions:getDecisionContext() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/vision",

    (req, res)=>{

      try{

        res.json({ success:true, vision:getVisionContext() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/patterns",

    (req, res)=>{

      try{

        res.json({ success:true, patterns:getPatternContext() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context",

    (req, res)=>{

      try{

        res.json({ success:true, ...updateCreatorContext(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator context provider update error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/clear",

    (req, res)=>{

      try{

        res.json({ success:true, ...clearContext() })

      }
      catch(error){

        console.error("Spacemonkey creator context provider clear error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextProviderRouter

}
