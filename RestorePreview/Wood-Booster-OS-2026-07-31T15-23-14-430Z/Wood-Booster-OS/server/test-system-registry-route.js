import express from "express"

import createSystemRegistryRouter from "./routes/systemRegistry.js"

import {
  loadDefaultSystemModules,
} from "./services/defaultSystemModules.js"



const app =
  express()



app.use(
  express.json()
)



loadDefaultSystemModules()



app.use(
  "/api",
  createSystemRegistryRouter()
)



app.listen(
  3999,
  ()=>{

    console.log(
      "SYSTEM REGISTRY TEST SERVER RUNNING"
    )

  }
)
