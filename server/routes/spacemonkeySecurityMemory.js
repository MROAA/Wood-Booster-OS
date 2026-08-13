import express from "express"


import {
  getSecurityMemory,
} from "../services/spacemonkey/modules/securityLearningMemory/index.js"





function createSpacemonkeySecurityMemoryRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-memory",

    (

      req,

      res

    )=>{


      try{


        const memory =
          getSecurityMemory()



        res.json({

          success:true,

          memory,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security memory error:",
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

  createSpacemonkeySecurityMemoryRouter

}
