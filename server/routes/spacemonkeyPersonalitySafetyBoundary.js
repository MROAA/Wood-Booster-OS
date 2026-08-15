import express from "express"


import {
  getSafetyBoundaries,
  validatePersonalityAction,
  getBoundaryStatus,
} from "../services/spacemonkey/modules/personalitySafetyBoundary/index.js"





function createSpacemonkeyPersonalitySafetyBoundaryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/safety",

    (req, res)=>{

      try{

        res.json({ success:true, ...getBoundaryStatus() })

      }
      catch(error){

        console.error("Spacemonkey personality safety error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/safety/boundaries",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSafetyBoundaries() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/safety/validate",

    (req, res)=>{

      try{

        res.json({ success:true, ...validatePersonalityAction(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey personality safety validate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalitySafetyBoundaryRouter

}
