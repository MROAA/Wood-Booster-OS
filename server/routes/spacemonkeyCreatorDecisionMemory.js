import express from "express"


import {
  createDecision,
  getDecisionMemory,
  findDecision,
  getLessons,
  getLatestDecisions,
} from "../services/spacemonkey/modules/creatorDecisionMemory/index.js"





function createSpacemonkeyCreatorDecisionMemoryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/decision-memory",

    (req, res)=>{

      try{

        res.json({ success:true, ...getDecisionMemory() })

      }
      catch(error){

        console.error("Spacemonkey creator decision memory error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/decision-memory/latest",

    (req, res)=>{

      try{

        res.json({ success:true, decisions:getLatestDecisions() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/decision-memory/lessons",

    (req, res)=>{

      try{

        res.json({ success:true, lessons:getLessons() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/decision-memory/:id",

    (req, res)=>{

      try{

        const item =
          findDecision(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, decision:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/decision-memory",

    (req, res)=>{

      try{

        const record =
          createDecision(req.body || {})


        res.json({ success:true, decision:record })

      }
      catch(error){

        console.error("Spacemonkey creator decision memory create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorDecisionMemoryRouter

}
