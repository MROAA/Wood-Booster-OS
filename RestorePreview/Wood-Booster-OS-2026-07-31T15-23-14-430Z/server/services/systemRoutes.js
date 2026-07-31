import createSystemRegistryRouter from "../routes/systemRegistry.js"



export function loadSystemRoutes(app){


  console.log(
    "SYSTEM ROUTES START"
  )



  app.use(
    "/api",
    createSystemRegistryRouter()
  )



  console.log(
    "SYSTEM ROUTES READY"
  )


}
