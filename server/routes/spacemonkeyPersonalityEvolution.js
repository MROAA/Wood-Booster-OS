import express from "express"


import {
  createEvolutionObservation,
  analyzeBehavior,
  getEvolutionHistory,
  getHighPrioritySuggestions,
} from "../services/spacemonkey/modules/personalityEvolution/index.js"





function createSpacemonkeyPersonalityEvolutionRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/evolution",

    (req, res)=>{

      try{

        const highPriority =
          req.query.priority === "high"


        const data =
          highPriority
            ? { moduleId: "personality-evolution", history: getHighPrioritySuggestions() }
            : getEvolutionHistory()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personality evolution error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/evolution",

    (req, res)=>{

      try{

        const entry =
          createEvolutionObservation(req.body || {})


        res.json({ success:true, entry })

      }
      catch(error){

        console.error("Spacemonkey personality evolution create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/evolution/analyze",

    (req, res)=>{

      try{

        res.json({ success:true, ...analyzeBehavior(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey personality evolution analyze error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityEvolutionRouter

}
