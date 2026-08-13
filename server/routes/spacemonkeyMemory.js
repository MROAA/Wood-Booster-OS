/*
=====================================

SPACEMONKEY MEMORY ROUTER

Tarjoaa Memory Intelligence
datan frontendille.

Ei sisällä muistilogiikkaa.

=====================================
*/


import express from "express"


import {

  createMemoryReport,
  getMemoryState

} from "../services/spacemonkey/modules/memoryIntelligence/index.js"







function createSpacemonkeyMemoryRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/memory",

    (

      req,

      res

    )=>{


      try{


        const memory =

          createMemoryReport()



        const state =

          getMemoryState()





        res.json({

          success:true,

          memory,

          state,

        })


      }


      catch(error){


        console.error(

          "Spacemonkey memory error:",

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

  createSpacemonkeyMemoryRouter

}
