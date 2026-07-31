import express from "express"

import {
  getSystemRegistry,
} from "../services/systemRegistry.js"



export default function createSystemRegistryRouter(){


  const router =
    express.Router()



  router.get(
    "/system/registry",
    (
      req,
      res
    )=>{


      res.json({

        success:true,

        registry:
          getSystemRegistry()

      })


    }
  )



  return router

}
