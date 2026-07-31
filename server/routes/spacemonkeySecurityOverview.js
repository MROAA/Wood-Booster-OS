import express from "express"


import {
  createSecurityOverview,
} from "../services/spacemonkey/modules/securityOrchestrator/index.js"





function createSpacemonkeySecurityOverviewRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-overview",

    (

      req,

      res

    )=>{


      try{


        const overview =
          createSecurityOverview()



        res.json({

          success:true,

          security:

            overview,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security overview error:",
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

  createSpacemonkeySecurityOverviewRouter

}
