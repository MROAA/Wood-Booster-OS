import express from "express"


import {
  getPermissionModel,
} from "../services/spacemonkey/modules/permissionAwareness/index.js"





function createSpacemonkeyPermissionsRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/permissions",

    (

      req,

      res

    )=>{


      try{


        const permissions =
          getPermissionModel()



        res.json({

          success:true,

          permissions,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey permissions error:",
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

  createSpacemonkeyPermissionsRouter

}
