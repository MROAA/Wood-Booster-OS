import express from "express"


import {
  createSimulation,
  evaluateOutcome,
  compareScenarios,
  getSimulations,
  getLatestSimulations,
} from "../services/spacemonkey/modules/creatorIntelligenceSimulationEngine/index.js"





function createSpacemonkeyCreatorIntelligenceSimulationEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/simulations",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSimulations() })

      }
      catch(error){

        console.error("Spacemonkey creator simulations error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/simulations/latest",

    (req, res)=>{

      try{

        res.json({ success:true, simulations:getLatestSimulations() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/simulations",

    (req, res)=>{

      try{

        const simulation =
          createSimulation(req.body || {})


        res.json({ success:true, simulation })

      }
      catch(error){

        console.error("Spacemonkey creator simulations create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/simulations/evaluate",

    (req, res)=>{

      try{

        res.json({ success:true, ...evaluateOutcome(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator simulations evaluate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/simulations/compare",

    (req, res)=>{

      try{

        const options =
          Array.isArray(req.body?.options)
            ? req.body.options
            : []


        res.json({ success:true, comparison:compareScenarios(options) })

      }
      catch(error){

        console.error("Spacemonkey creator simulations compare error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceSimulationEngineRouter

}
