import express from "express"


import {
  getLinuxCapability,
  findLinuxCapability,
  getCapabilitiesByCategory,
} from "../services/spacemonkey/modules/linuxAdvancedCapability/index.js"





function createSpacemonkeyLinuxAdvancedCapabilityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/capabilities/linux",

    (

      req,

      res

    )=>{


      try{


        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "linux-advanced-capability", capabilities: getCapabilitiesByCategory(category) }
            : getLinuxCapability()



        res.json({

          success:true,

          ...data,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey linux capability error:",
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

    "/spacemonkey/capabilities/linux/:id",

    (

      req,

      res

    )=>{


      try{


        const item =
          findLinuxCapability(req.params.id)



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
          "Spacemonkey linux capability lookup error:",
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

  createSpacemonkeyLinuxAdvancedCapabilityRouter

}
