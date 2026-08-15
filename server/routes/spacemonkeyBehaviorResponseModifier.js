import express from "express"


import {
  getBehaviors,
  checkBehavior,
} from "../services/spacemonkey/modules/behaviorResponseModifier/index.js"





function createSpacemonkeyBehaviorResponseModifierRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/behaviors",

    (req, res)=>{

      try{

        res.json({ success:true, ...getBehaviors() })

      }
      catch(error){

        console.error("Spacemonkey behavior response modifier error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/behaviors/check",

    (req, res)=>{

      try{

        res.json({ success:true, ...checkBehavior(req.body?.message) })

      }
      catch(error){

        console.error("Spacemonkey behavior response modifier check error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyBehaviorResponseModifierRouter

}
