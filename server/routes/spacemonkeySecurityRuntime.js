import express from "express"


import {
  createSecuritySnapshot,
} from "../services/spacemonkey/modules/securityRuntimeMonitor/index.js"





function createSpacemonkeySecurityRuntimeRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-runtime",

    (

      req,

      res

    )=>{


      try{


        const snapshot =
          createSecuritySnapshot()



        res.json({

          success:true,

          security:

            snapshot,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security runtime error:",
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

  createSpacemonkeySecurityRuntimeRouter

}
