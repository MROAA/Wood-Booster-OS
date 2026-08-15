import express from "express"


import {
  getDatabaseCapability,
  findDatabaseCapability,
  getCapabilitiesByCategory,
} from "../services/spacemonkey/modules/databaseCapability/index.js"





function createSpacemonkeyDatabaseCapabilityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/capabilities/database",

    (

      req,

      res

    )=>{


      try{


        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "database-capability", capabilities: getCapabilitiesByCategory(category) }
            : getDatabaseCapability()



        res.json({

          success:true,

          ...data,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey database capability error:",
          error
        )


        res.status(500).json({

          success:false,

          error:error.message

        })


      }


    }

  )



  router.get(

    "/spacemonkey/capabilities/database/:id",

    (

      req,

      res

    )=>{


      try{


        const item =
          findDatabaseCapability(req.params.id)



        if(!item){

          return res.status(404).json({

            success:false,

            error:"not found",

          })

        }



        res.json({

          success:true,

          capability:item,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey database capability lookup error:",
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

  createSpacemonkeyDatabaseCapabilityRouter

}
