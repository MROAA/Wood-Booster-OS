import express from "express"


import {
  getHumorSettings,
  generateHumor,
} from "../services/spacemonkey/modules/humorPersonality/index.js"





function createSpacemonkeyHumorPersonalityRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/humor",

    (req, res)=>{

      try{

        res.json({ success:true, ...getHumorSettings() })

      }
      catch(error){

        console.error("Spacemonkey humor personality error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/humor/generate",

    (req, res)=>{

      try{

        res.json({ success:true, ...generateHumor() })

      }
      catch(error){

        console.error("Spacemonkey humor personality generate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyHumorPersonalityRouter

}
