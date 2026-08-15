import express from "express"


import {
  handleRequest,
  getAvailableActions,
  getRequestHistory,
  getLatestRequests,
} from "../services/spacemonkey/modules/creatorIntelligenceApiGateway/index.js"





function createSpacemonkeyCreatorIntelligenceApiGatewayRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/api-gateway/actions",

    (req, res)=>{

      try{

        res.json({ success:true, ...getAvailableActions() })

      }
      catch(error){

        console.error("Spacemonkey creator api gateway actions error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/api-gateway/requests",

    (req, res)=>{

      try{

        res.json({ success:true, ...getRequestHistory() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/api-gateway/requests/latest",

    (req, res)=>{

      try{

        res.json({ success:true, requests:getLatestRequests() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/api-gateway/request",

    (req, res)=>{

      try{

        const result =
          handleRequest(req.body || {})


        res.json(result)

      }
      catch(error){

        console.error("Spacemonkey creator api gateway request error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceApiGatewayRouter

}
