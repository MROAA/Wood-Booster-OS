import express from "express"

import {
  enhanceServer,
} from "./services/serverEnhancer.js"



const app =
  express()



enhanceServer(
  app
)



console.log(
  "SERVER ENHANCER TEST OK"
)
