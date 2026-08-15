import express from "express"


import {
  classifyData,
  sanitizeContext,
  minimizeContext,
  recordBoundaryEvent,
  getBoundaryEvents,
  getClassifications,
} from "../services/spacemonkey/modules/creatorContextBoundaryLayer/index.js"





function createSpacemonkeyCreatorContextBoundaryLayerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context/boundary/classifications",

    (req, res)=>{

      try{

        res.json({ success:true, ...getClassifications() })

      }
      catch(error){

        console.error("Spacemonkey creator context boundary classifications error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/boundary/events",

    (req, res)=>{

      try{

        res.json({ success:true, ...getBoundaryEvents() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/boundary/classify",

    (req, res)=>{

      try{

        res.json({ success:true, classification:classifyData(req.body) })

      }
      catch(error){

        console.error("Spacemonkey creator context boundary classify error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/boundary/sanitize",

    (req, res)=>{

      try{

        res.json({ success:true, ...sanitizeContext(req.body) })

      }
      catch(error){

        console.error("Spacemonkey creator context boundary sanitize error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/boundary/minimize",

    (req, res)=>{

      try{

        res.json({ success:true, ...minimizeContext(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator context boundary minimize error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/boundary/events",

    (req, res)=>{

      try{

        const event =
          recordBoundaryEvent(req.body || {})


        res.json({ success:true, event })

      }
      catch(error){

        console.error("Spacemonkey creator context boundary event error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextBoundaryLayerRouter

}
