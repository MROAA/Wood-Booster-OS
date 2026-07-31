/*
=====================================

SPACEMONKEY API CATALOG ROUTER

Tarjoaa Spacemonkey API Catalogin.

Read-only.

=====================================
*/


import express from "express"


import {

  getSpacemonkeyApiCatalog

} from "../services/spacemonkey/spacemonkeyApiCatalogAdapter.js"







function createSpacemonkeyApiCatalogRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/api-catalog",

    (

      req,

      res

    )=>{


      try{


        res.json(

          getSpacemonkeyApiCatalog()

        )


      }


      catch(error){


        console.error(

          "Spacemonkey API Catalog error:",

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

  createSpacemonkeyApiCatalogRouter

}
