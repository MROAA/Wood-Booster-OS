import express from "express"

import {
  bootstrapSystem,
} from "./services/systemBootstrap.js"



const app =
  express()



bootstrapSystem(
  app
)



console.log(
  "SYSTEM BOOTSTRAP TEST OK"
)
