import express from "express"


import {
  getStyleRules,
  applySentenceStyle,
} from "../services/spacemonkey/modules/sentenceStyleModifier/index.js"





function createSpacemonkeySentenceStyleModifierRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/style",

    (req, res)=>{

      try{

        res.json({ success:true, ...getStyleRules() })

      }
      catch(error){

        console.error("Spacemonkey sentence style modifier error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/style/apply",

    (req, res)=>{

      try{

        res.json({ success:true, message:applySentenceStyle(req.body?.message) })

      }
      catch(error){

        console.error("Spacemonkey sentence style modifier apply error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySentenceStyleModifierRouter

}
