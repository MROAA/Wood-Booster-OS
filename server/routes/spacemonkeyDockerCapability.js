import express from "express"


import {
  getDockerCapability,
  findDockerCapability,
  getCapabilitiesByCategory,
} from "../services/spacemonkey/modules/dockerCapability/index.js"





function createSpacemonkeyDockerCapabilityRouter(){


  const router =
    express.Router()





  router.get(

    "/spacemonkey/capabilities/docker",

    (

      req,

      res

    )=>{


      try{


        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "docker-capability", capabilities: getCapabilitiesByCategory(category) }
            : getDockerCapability()



        res.json({

          success:true,

          ...data,

        })


      }


      catch(error){


        console.error(
          "Spacemonkey docker capability error:",
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

    "/spacemonkey/capabilities/docker/:id",

    (

      req,

      res

    )=>{


      try{


        const item =
          findDockerCapability(req.params.id)



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
          "Spacemonkey docker capability lookup error:",
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

  createSpacemonkeyDockerCapabilityRouter

}
