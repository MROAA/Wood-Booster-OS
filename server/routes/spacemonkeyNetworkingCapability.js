import express from "express"


import {
  getNetworkingCapability,
  findNetworkingCapability,
  getCapabilitiesByCategory,
} from "../services/spacemonkey/modules/networkingCapability/index.js"





function createSpacemonkeyNetworkingCapabilityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/capabilities/networking",

    (

      req,

      res

    )=>{


      try{


        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "networking-capability", capabilities: getCapabilitiesByCategory(category) }
            : getNetworkingCapability()



        res.json({

          success:true,

          ...data,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey networking capability error:",
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

    "/spacemonkey/capabilities/networking/:id",

    (

      req,

      res

    )=>{


      try{


        const item =
          findNetworkingCapability(req.params.id)



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
          "Spacemonkey networking capability lookup error:",
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

  createSpacemonkeyNetworkingCapabilityRouter

}
