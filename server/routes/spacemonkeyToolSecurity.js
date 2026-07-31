import express from "express"


import {
  getToolSecurityModel,
} from "../services/spacemonkey/modules/toolSecurityGateway/index.js"





function createSpacemonkeyToolSecurityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/tool-security",

    (

      req,

      res

    )=>{


      try{


        const tools =
          getToolSecurityModel()



        res.json({

          success:true,

          tools,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey tool security error:",
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

  createSpacemonkeyToolSecurityRouter

}
