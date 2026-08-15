import express from "express"


import {
  recordPersonalityEvent,
  getAuditHistory,
  getEventsByType,
  getLatestEvents,
} from "../services/spacemonkey/modules/personalityAuditLog/index.js"





function createSpacemonkeyPersonalityAuditLogRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/audit-log",

    (req, res)=>{

      try{

        const type =
          req.query.type


        const data =
          type
            ? { moduleId: "personality-audit-log", events: getEventsByType(type) }
            : getAuditHistory()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personality audit log error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/audit-log/latest",

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

    "/spacemonkey/personality/audit-log",

    (req, res)=>{

      try{

        const event =
          recordPersonalityEvent(req.body || {})


        res.json({ success:true, event })

      }
      catch(error){

        console.error("Spacemonkey personality audit log create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityAuditLogRouter

}
