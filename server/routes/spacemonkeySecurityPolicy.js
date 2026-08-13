import express from "express"


import {
  getSecurityPolicy,
} from "../services/spacemonkey/modules/securityPolicyEngine/index.js"





function createSpacemonkeySecurityPolicyRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-policy",

    (

      req,

      res

    )=>{


      try{


        const policy =
          getSecurityPolicy()



        res.json({

          success:true,

          policy,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security policy error:",
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

  createSpacemonkeySecurityPolicyRouter

}
