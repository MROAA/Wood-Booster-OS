import express from "express"


import {
  requestPersonalityChange,
  approvePersonalityChange,
  getGovernanceRules,
  getChangeRequests,
} from "../services/spacemonkey/modules/personalityGovernance/index.js"





function createSpacemonkeyPersonalityGovernanceRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/governance/rules",

    (req, res)=>{

      try{

        res.json({ success:true, ...getGovernanceRules() })

      }
      catch(error){

        console.error("Spacemonkey personality governance rules error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/governance/requests",

    (req, res)=>{

      try{

        res.json({ success:true, ...getChangeRequests() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/governance/requests",

    (req, res)=>{

      try{

        const request =
          requestPersonalityChange(req.body || {})


        res.json({ success:true, request })

      }
      catch(error){

        console.error("Spacemonkey personality governance request error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/governance/requests/:id/approve",

    (req, res)=>{

      try{

        res.json(approvePersonalityChange(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey personality governance approve error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityGovernanceRouter

}
