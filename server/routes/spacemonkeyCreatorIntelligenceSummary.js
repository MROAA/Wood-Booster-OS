import express from "express"


import {
  createCreatorSummary,
  getCreatorSummaries,
  getLatestSummary,
  extractCorePrinciples,
} from "../services/spacemonkey/modules/creatorIntelligenceSummary/index.js"





function createSpacemonkeyCreatorIntelligenceSummaryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/summary",

    (req, res)=>{

      try{

        res.json({ success:true, ...getCreatorSummaries() })

      }
      catch(error){

        console.error("Spacemonkey creator summary error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/summary/latest",

    (req, res)=>{

      try{

        const summary =
          getLatestSummary()


        res.json({

          success:true,

          summary,

          corePrinciples:extractCorePrinciples(summary),

        })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/summary",

    (req, res)=>{

      try{

        const summary =
          createCreatorSummary(req.body || {})


        res.json({ success:true, summary })

      }
      catch(error){

        console.error("Spacemonkey creator summary create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceSummaryRouter

}
