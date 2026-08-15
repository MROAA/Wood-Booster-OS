import express from "express"


import {
  subscribe,
  publish,
  getSubscribers,
  getEventHistory,
  getLatestEvents,
} from "../services/spacemonkey/modules/creatorIntelligenceEventBus/index.js"





function createSpacemonkeyCreatorIntelligenceEventBusRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/event-bus/subscribers",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSubscribers() })

      }
      catch(error){

        console.error("Spacemonkey creator event bus subscribers error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/event-bus/events",

    (req, res)=>{

      try{

        res.json({ success:true, ...getEventHistory() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/event-bus/events/latest",

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

    "/spacemonkey/creator/event-bus/subscribe",

    (req, res)=>{

      try{

        res.json(subscribe(req.body || {}))

      }
      catch(error){

        console.error("Spacemonkey creator event bus subscribe error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/event-bus/publish",

    (req, res)=>{

      try{

        res.json({ success:true, ...publish(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator event bus publish error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceEventBusRouter

}
