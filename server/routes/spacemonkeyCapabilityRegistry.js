import express from "express"


import {
  getCapabilityRegistry,
} from "../services/spacemonkey/modules/capabilityRegistry/index.js"





function createSpacemonkeyCapabilityRegistryRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/capability-registry",

    (

      req,

      res

    )=>{


      try{


        const capabilities =
          getCapabilityRegistry()



        res.json({

          success:true,

          capabilities,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey capability registry error:",
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

  createSpacemonkeyCapabilityRegistryRouter

}
