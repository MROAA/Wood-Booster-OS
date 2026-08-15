import express from "express"


import {
  ensureCognitiveRuntimeInitialized,
} from "../services/spacemonkey/boosterverseCognitiveRuntimeBootstrap.js"

/*
Ei jatkuvaa tick-silmukkaa - ks.
boosterverseCognitiveRuntimeBootstrap.js:n kommentti. Tila on
alkutilassa kunnes joku kutsuu POST /tick:iä erikseen.
*/

const STATE_KEYS = [
  "attention",
  "awareness",
  "cognitive",
  "context",
  "memory",
  "planner",
]


function createSpacemonkeyCognitiveRuntimeRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/cognitive-runtime",

    async (req, res)=>{

      try{

        const runtime =
          await ensureCognitiveRuntimeInitialized()


        res.json({ success:true, ...runtime.summary() })

      }
      catch(error){

        console.error("Spacemonkey cognitive runtime error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/cognitive-runtime/health",

    async (req, res)=>{

      try{

        const runtime =
          await ensureCognitiveRuntimeInitialized()


        res.json({ success:true, ...(await runtime.health()) })

      }
      catch(error){

        console.error("Spacemonkey cognitive runtime health error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/cognitive-runtime/:engineId",

    async (req, res)=>{

      try{

        const { engineId } =
          req.params


        if(!STATE_KEYS.includes(engineId)){

          return res.status(404).json({ success:false, error:"unknown engine" })

        }


        const runtime =
          await ensureCognitiveRuntimeInitialized()


        res.json({

          success:true,

          engineId,

          state:runtime.readState(engineId),

        })

      }
      catch(error){

        console.error("Spacemonkey cognitive runtime engine state error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/cognitive-runtime/tick",

    async (req, res)=>{

      try{

        const runtime =
          await ensureCognitiveRuntimeInitialized()


        const result =
          await runtime.tick()


        res.json({ success:true, ...result })

      }
      catch(error){

        console.error("Spacemonkey cognitive runtime tick error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )





  return router

}





export {

  createSpacemonkeyCognitiveRuntimeRouter

}
