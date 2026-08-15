import express from "express"


import {
  getOperatorAwareness,
  getSystemIdentity,
  getMission,
  getOperatorIdentity,
} from "../services/spacemonkey/modules/operatorAwareness/index.js"





function createSpacemonkeyOperatorAwarenessRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/operator-awareness",

    (req, res)=>{

      try{

        res.json({ success:true, ...getOperatorAwareness() })

      }
      catch(error){

        console.error("Spacemonkey operator awareness error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/operator-awareness/system",

    (req, res)=>{

      try{

        res.json({ success:true, system:getSystemIdentity() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/operator-awareness/mission",

    (req, res)=>{

      try{

        res.json({ success:true, mission:getMission() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/operator-awareness/operator",

    (req, res)=>{

      try{

        res.json({ success:true, operator:getOperatorIdentity() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyOperatorAwarenessRouter

}
