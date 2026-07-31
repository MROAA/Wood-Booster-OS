import express from "express"


import {
  getApprovalRequests,
  getApprovalRules,
} from "../services/spacemonkey/modules/securityApprovalGateway/index.js"





function createSpacemonkeyApprovalGatewayRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/approval-gateway",

    (

      req,

      res

    )=>{


      try{


        const requests =
          getApprovalRequests()



        const rules =
          getApprovalRules()



        res.json({

          success:true,

          approval:

            {

              requests,

              rules,

            }


        })


      }


      catch(error){


        console.error(
          "Spacemonkey approval gateway error:",
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

  createSpacemonkeyApprovalGatewayRouter

}
