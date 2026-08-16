import express from "express"


import {
  createSecurityObservation,
  createImprovementProposal,
  getSecurityEvolution,
  getHighPriorityItems,
} from "../services/spacemonkey/modules/securityEvolutionEngine/index.js"





function createSpacemonkeySecurityEvolutionEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/evolution",

    (req, res)=>{

      try{

        const highPriority =
          req.query.priority === "high"


        const data =
          highPriority
            ? { moduleId: "security-evolution-engine", evolution: getHighPriorityItems() }
            : getSecurityEvolution()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey security evolution error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/evolution/observation",

    (req, res)=>{

      try{

        const entry =
          createSecurityObservation(req.body || {})


        res.json({ success:true, entry })

      }
      catch(error){

        console.error("Spacemonkey security evolution observation error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/evolution/proposal",

    (req, res)=>{

      try{

        const proposal =
          createImprovementProposal(req.body || {})


        res.json({ success:true, proposal })

      }
      catch(error){

        console.error("Spacemonkey security evolution proposal error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecurityEvolutionEngineRouter

}
