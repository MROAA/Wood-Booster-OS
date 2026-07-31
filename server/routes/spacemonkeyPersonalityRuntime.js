import express from "express"


import {
  getPersonalityStatus,
} from "../services/spacemonkey/modules/personalityRuntimeController/index.js"





function createSpacemonkeyPersonalityRuntimeRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/personality-runtime",

    (

      req,

      res

    )=>{


      try{


        const personality =
          getPersonalityStatus()



        res.json({

          success:true,

          personality,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey personality runtime error:",
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

  createSpacemonkeyPersonalityRuntimeRouter

}
