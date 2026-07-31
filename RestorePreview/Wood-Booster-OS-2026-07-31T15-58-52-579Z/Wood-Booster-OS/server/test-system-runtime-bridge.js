import express from "express"

import {
  runSystemRuntimeBridge,
} from "./services/systemRuntimeBridge.js"



const app =
  express()



runSystemRuntimeBridge(
  app
)



console.log(
  "SYSTEM RUNTIME BRIDGE TEST OK"
)
