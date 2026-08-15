import express from "express"


import {
  evaluatePolicy,
  getPolicies,
  getPolicyEvents,
} from "../services/spacemonkey/modules/creatorContextPolicyEngine/index.js"





function createSpacemonkeyCreatorContextPolicyEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context/policies",

    (req, res)=>{

      try{

        res.json({ success:true, ...getPolicies() })

      }
      catch(error){

        console.error("Spacemonkey creator context policies error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/policies/events",

    (req, res)=>{

      try{

        res.json({ success:true, ...getPolicyEvents() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/policies/evaluate",

    (req, res)=>{

      try{

        res.json({ success:true, ...evaluatePolicy(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator context policies evaluate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextPolicyEngineRouter

}
