import express from "express"


import {
  createCodeReviewFramework,
  reviewCode,
  getReviewCriteria,
} from "../services/spacemonkey/modules/codeReviewIntelligence/index.js"





function createSpacemonkeyCodeReviewIntelligenceRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/code-review",

    (req, res)=>{

      try{

        res.json({ success:true, ...createCodeReviewFramework() })

      }
      catch(error){

        console.error("Spacemonkey code review intelligence error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/code-review/criteria",

    (req, res)=>{

      try{

        res.json({ success:true, criteria:getReviewCriteria() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/code-review",

    (req, res)=>{

      try{

        res.json({ success:true, ...reviewCode(req.body?.component) })

      }
      catch(error){

        console.error("Spacemonkey code review intelligence post error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCodeReviewIntelligenceRouter

}
