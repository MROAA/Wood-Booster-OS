/*
=====================================

SPACEMONKEY MODULE ROUTER

Tarjoaa moduulit frontendille.

Käyttää Module Adapteria.

Ei sisällä moduulilogiikkaa.

=====================================
*/


import express from "express"


import {

  getSpacemonkeyModules

} from "../services/spacemonkey/spacemonkeyModuleAdapter.js"







function createSpacemonkeyModulesRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/modules",

    (

      req,

      res

    )=>{


      try{


        const modules =

          getSpacemonkeyModules()





        res.json(

          modules

        )


      }


      catch(error){


        console.error(

          "Spacemonkey modules error:",

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

  createSpacemonkeyModulesRouter

}
