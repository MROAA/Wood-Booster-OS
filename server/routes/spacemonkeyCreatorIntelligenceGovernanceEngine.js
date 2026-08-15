import express from "express"


import {
  evaluateAction,
  approveDecision,
  getRules,
  getDecisions,
} from "../services/spacemonkey/modules/creatorIntelligenceGovernanceEngine/index.js"





function createSpacemonkeyCreatorIntelligenceGovernanceEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/governance/rules",

    (req, res)=>{

      try{

        res.json({ success:true, ...getRules() })

      }
      catch(error){

        console.error("Spacemonkey creator governance rules error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/governance/decisions",

    (req, res)=>{

      try{

        res.json({ success:true, ...getDecisions() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/governance/evaluate",

    (req, res)=>{

      try{

        res.json({ success:true, decision:evaluateAction(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator governance evaluate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/governance/decisions/:id/approve",

    (req, res)=>{

      try{

        res.json(approveDecision(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey creator governance approve error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceGovernanceEngineRouter

}
