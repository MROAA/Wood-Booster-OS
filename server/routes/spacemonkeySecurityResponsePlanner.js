import express from "express"


import {
  getResponsePlanner,
  planResponse,
  getCriticalResponses,
} from "../services/spacemonkey/modules/securityResponsePlanner/index.js"





function createSpacemonkeySecurityResponsePlannerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/response-planner",

    (req, res)=>{

      try{

        const critical =
          req.query.critical === "true"


        const data =
          critical
            ? { moduleId: "security-response-planner", responses: getCriticalResponses() }
            : getResponsePlanner()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey security response planner error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/security/response-planner/:threatId",

    (req, res)=>{

      try{

        res.json({ success:true, plan:planResponse(req.params.threatId) })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecurityResponsePlannerRouter

}
