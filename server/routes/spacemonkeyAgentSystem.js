/*
=====================================

SPACEMONKEY AGENT SYSTEM ROUTER

Tarjoaa Agent System Intelligence
datan frontendille.

Ei sisällä agenttilogiikkaa.

=====================================
*/


import express from "express"


import {

  createAgentSystemReport,
  getAgentSystemState

} from "../services/spacemonkey/modules/agentSystemIntelligence/index.js"







function createSpacemonkeyAgentSystemRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/agents-system",

    (

      req,

      res

    )=>{


      try{


        const agents =

          createAgentSystemReport()



        const state =

          getAgentSystemState()





        res.json({

          success:true,

          agents,

          state,

        })


      }


      catch(error){


        console.error(

          "Spacemonkey agent system error:",

          error

        )



        res.status(500).json({

          success:false,

          error:error.message

        })


      }


    }

  )







  return router


}







export {

  createSpacemonkeyAgentSystemRouter

}
