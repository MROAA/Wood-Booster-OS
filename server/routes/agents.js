import express from "express"

import {
  getAgents,
} from "../services/agentRegistry.js"



export function createAgentsRouter() {

  const router =
    express.Router()



  router.get(
    "/agents",
    (
      req,
      res,
    ) => {

      res.json({

        success: true,

        agents:
          getAgents(),

      })

    },
  )



  return router

}
