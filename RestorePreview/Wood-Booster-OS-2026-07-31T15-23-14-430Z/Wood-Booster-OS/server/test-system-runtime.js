import express from "express"

import {
  startSystemRuntime,
} from "./services/systemRuntime.js"



const app =
  express()



startSystemRuntime(
  app
)



console.log(
  "SYSTEM RUNTIME TEST OK"
)
