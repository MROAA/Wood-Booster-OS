import express from "express"


import {
  getSandboxModel,
} from "../services/spacemonkey/modules/securitySandboxAwareness/index.js"





function createSpacemonkeySecuritySandboxRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-sandbox",

    (

      req,

      res

    )=>{


      try{


        const sandbox =
          getSandboxModel()



        res.json({

          success:true,

          sandbox,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security sandbox error:",
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

  createSpacemonkeySecuritySandboxRouter

}
