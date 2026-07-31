import express from "express"

import {
  getTools,
} from "../services/toolRegistry.js"



export default function createToolsRouter() {


  const router =
    express.Router()



  router.get(
    "/tools",
    (
      req,
      res,
    ) => {


      res.json({

        success:
          true,

        tools:
          getTools(),

      })


    },
  )



  return router

}
