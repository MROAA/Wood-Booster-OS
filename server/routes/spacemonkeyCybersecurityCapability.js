import express from "express"


import {
  getCybersecurityCapability,
  findCybersecurityCapability,
  getCapabilitiesByCategory,
} from "../services/spacemonkey/modules/cybersecurityCapability/index.js"





function createSpacemonkeyCybersecurityCapabilityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/capabilities/cybersecurity",

    (

      req,

      res

    )=>{


      try{


        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "cybersecurity-capability", capabilities: getCapabilitiesByCategory(category) }
            : getCybersecurityCapability()



        res.json({

          success:true,

          ...data,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey cybersecurity capability error:",
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

    "/spacemonkey/capabilities/cybersecurity/:id",

    (

      req,

      res

    )=>{


      try{


        const item =
          findCybersecurityCapability(req.params.id)



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
          "Spacemonkey cybersecurity capability lookup error:",
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

  createSpacemonkeyCybersecurityCapabilityRouter

}
