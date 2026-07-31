/*
=====================================

SPACEMONKEY COGNITIVE ROUTER MVP

Express
 |
 v
Cognitive Adapter
 |
 v
AI Brain V2

=====================================
*/


import express from "express"



import {
  runSpacemonkeyPipeline,
} from "../services/spacemonkey/adapters/cognitivePipelineAdapter.js"





function createDefaultKnowledge(){

  return [

    {
      type:
        "fact",

      content:
        "Wood-Booster OS yhdistää AI Brainin, Memory Layerin ja Knowledge Layerin."
    },


    {
      type:
        "fact",

      content:
        "Spacemonkey käyttää modulaarista AI-rakennetta."
    }

  ]

}





function createDefaultSystemState(){

  return {

    project:
      "Wood-Booster OS",

    environment:
      "development",

    layer:
      "Spacemonkey Cognitive",

    version:
      "AI Brain V2"

  }

}





function createSpacemonkeyCognitiveRouter(
  prisma
){

  const router =
    express.Router()



  router.post(
    "/spacemonkey/cognitive",

    async(
      req,
      res
    )=>{


      try{


        const {

          message = "",

          knowledge,

          systemState


        } = req.body





        const result =
          await runSpacemonkeyPipeline({

            prisma,

            message,

            memory:
              [],


            knowledge:

              Array.isArray(
                knowledge
              )

              ? knowledge

              :

              createDefaultKnowledge(),



            systemState:

              systemState ||

              createDefaultSystemState()

          })





        res.json({

          success:
            true,


          result

        })


      }


      catch(error){


        console.error(
          "SPACEMONKEY COGNITIVE ERROR:",
          error
        )


        res.status(500).json({

          success:
            false,

          error:
            error.message

        })

      }


    }

  )



  return router

}





export {

  createSpacemonkeyCognitiveRouter

}
