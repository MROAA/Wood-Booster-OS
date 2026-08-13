import express from "express"


import {
  getAuditLog,
} from "../services/spacemonkey/modules/securityAuditLog/index.js"





function createSpacemonkeySecurityAuditRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/security-audit",

    (

      req,

      res

    )=>{


      try{


        const audit =
          getAuditLog()



        res.json({

          success:true,

          audit,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey security audit error:",
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

  createSpacemonkeySecurityAuditRouter

}
