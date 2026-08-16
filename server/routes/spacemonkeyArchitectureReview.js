import express from "express"


import {
  createArchitectureReview,
  reviewSystem,
  getReviewAreas,
} from "../services/spacemonkey/modules/architectureReview/index.js"





function createSpacemonkeyArchitectureReviewRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/architecture-review",

    (req, res)=>{

      try{

        res.json({ success:true, ...createArchitectureReview() })

      }
      catch(error){

        console.error("Spacemonkey architecture review error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/architecture-review/areas",

    (req, res)=>{

      try{

        res.json({ success:true, areas:getReviewAreas() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/architecture-review",

    (req, res)=>{

      try{

        res.json({ success:true, ...reviewSystem(req.body?.component) })

      }
      catch(error){

        console.error("Spacemonkey architecture review post error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyArchitectureReviewRouter

}
