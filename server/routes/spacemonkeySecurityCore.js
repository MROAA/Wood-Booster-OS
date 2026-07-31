import express from "express"


import {
  getSecurityCore,
} from "../services/spacemonkey/modules/securityCore/index.js"





function createSpacemonkeySecurityCoreRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-core",

    (

      req,

      res

    )=>{


      try{


        const security =
          getSecurityCore()



        res.json({

          success:true,

          security,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security core error:",
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

  createSpacemonkeySecurityCoreRouter

}
