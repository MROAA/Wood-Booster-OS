import express from "express"


import {
  getPersonality,
  detectEmotion,
} from "../services/spacemonkey/modules/personalityCharacter/index.js"





function createSpacemonkeyPersonalityCharacterRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/character",

    (req, res)=>{

      try{

        res.json({ success:true, ...getPersonality() })

      }
      catch(error){

        console.error("Spacemonkey personality character error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/character/detect-emotion",

    (req, res)=>{

      try{

        res.json({ success:true, ...detectEmotion(req.body?.message) })

      }
      catch(error){

        console.error("Spacemonkey personality character emotion error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityCharacterRouter

}
