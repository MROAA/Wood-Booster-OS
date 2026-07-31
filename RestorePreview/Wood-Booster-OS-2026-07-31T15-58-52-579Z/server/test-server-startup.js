import express from "express"

import {
  runServerStartup,
} from "./services/serverStartup.js"



const app =
  express()



runServerStartup(
  app
)



console.log(
  "SERVER STARTUP TEST OK"
)
