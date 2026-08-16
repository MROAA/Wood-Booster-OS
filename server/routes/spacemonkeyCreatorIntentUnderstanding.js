import express from "express"


import {
  analyzeIntent,
  getIntentMemory,
  findIntent,
  getLatestIntents,
  getGoals,
} from "../services/spacemonkey/modules/creatorIntentUnderstanding/index.js"





function createSpacemonkeyCreatorIntentUnderstandingRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/intent",

    (req, res)=>{

      try{

        res.json({ success:true, ...getIntentMemory() })

      }
      catch(error){

        console.error("Spacemonkey creator intent error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/intent/latest",

    (req, res)=>{

      try{

        res.json({ success:true, intents:getLatestIntents() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/intent/goals",

    (req, res)=>{

      try{

        res.json({ success:true, goals:getGoals() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/intent/:id",

    (req, res)=>{

      try{

        const item =
          findIntent(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, intent:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/intent",

    (req, res)=>{

      try{

        const intent =
          analyzeIntent(req.body || {})


        res.json({ success:true, intent })

      }
      catch(error){

        console.error("Spacemonkey creator intent create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntentUnderstandingRouter

}
