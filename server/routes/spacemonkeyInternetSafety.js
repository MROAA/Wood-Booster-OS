import express from "express"


import {
  getInternetSafetyModel,
} from "../services/spacemonkey/modules/internetSafetyGateway/index.js"





function createSpacemonkeyInternetSafetyRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/internet-safety",

    (

      req,

      res

    )=>{


      try{


        const safety =
          getInternetSafetyModel()



        res.json({

          success:true,

          safety,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey internet safety error:",
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

  createSpacemonkeyInternetSafetyRouter

}
