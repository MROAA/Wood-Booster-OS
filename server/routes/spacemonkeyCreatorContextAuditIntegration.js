import express from "express"


import {
  createAuditEvent,
  getAuditEvents,
  getEventsByRequester,
  getLatestEvents,
} from "../services/spacemonkey/modules/creatorContextAuditIntegration/index.js"





function createSpacemonkeyCreatorContextAuditIntegrationRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context/audit",

    (req, res)=>{

      try{

        const requester =
          req.query.requester


        const data =
          requester
            ? { moduleId: "creator-context-audit-integration", events: getEventsByRequester(requester) }
            : getAuditEvents()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator context audit error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/audit/latest",

    (req, res)=>{

      try{

        res.json({ success:true, events:getLatestEvents() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/audit",

    (req, res)=>{

      try{

        const event =
          createAuditEvent(req.body || {})


        res.json({ success:true, event })

      }
      catch(error){

        console.error("Spacemonkey creator context audit create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextAuditIntegrationRouter

}
