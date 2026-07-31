import express from "express"


import {
  getSecurityReflections,
} from "../services/spacemonkey/modules/securityReflectionEngine/index.js"





function createSpacemonkeySecurityReflectionRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-reflection",

    (

      req,

      res

    )=>{


      try{


        const reflections =
          getSecurityReflections()



        res.json({

          success:true,

          reflections,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security reflection error:",
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

  createSpacemonkeySecurityReflectionRouter

}
