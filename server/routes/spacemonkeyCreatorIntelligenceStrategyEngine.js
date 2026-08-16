import express from "express"


import {
  createStrategy,
  updateStrategyStatus,
  addStrategyStep,
  getStrategies,
  getActiveStrategies,
} from "../services/spacemonkey/modules/creatorIntelligenceStrategyEngine/index.js"





function createSpacemonkeyCreatorIntelligenceStrategyEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/strategies",

    (req, res)=>{

      try{

        const active =
          req.query.active === "true"


        const data =
          active
            ? { moduleId: "creator-intelligence-strategy-engine", strategies: getActiveStrategies() }
            : getStrategies()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator strategies error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/strategies",

    (req, res)=>{

      try{

        const strategy =
          createStrategy(req.body || {})


        res.json({ success:true, strategy })

      }
      catch(error){

        console.error("Spacemonkey creator strategies create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/strategies/status",

    (req, res)=>{

      try{

        res.json(updateStrategyStatus(req.body || {}))

      }
      catch(error){

        console.error("Spacemonkey creator strategies status error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/strategies/step",

    (req, res)=>{

      try{

        const strategy =
          addStrategyStep(req.body || {})


        if(!strategy){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, strategy })

      }
      catch(error){

        console.error("Spacemonkey creator strategies step error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceStrategyEngineRouter

}
