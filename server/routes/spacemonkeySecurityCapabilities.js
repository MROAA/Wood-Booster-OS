import express from "express"


import {
  getSecurityRegistry,
} from "../services/spacemonkey/modules/securityCapabilityRegistry/index.js"





function createSpacemonkeySecurityCapabilitiesRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-capabilities",

    (

      req,

      res

    )=>{


      try{


        const registry =
          getSecurityRegistry()



        res.json({

          success:true,

          capabilities:
            registry,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security capabilities error:",
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

  createSpacemonkeySecurityCapabilitiesRouter

}
