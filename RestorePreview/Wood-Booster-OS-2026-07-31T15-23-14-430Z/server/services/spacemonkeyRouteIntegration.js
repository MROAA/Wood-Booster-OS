import {
  createSpacemonkeySystemRouter,
} from "../routes/spacemonkeySystem.js"



import {
  createSpacemonkeyApiCatalogRouter,
} from "../routes/spacemonkeyApiCatalog.js"





export function integrateSpacemonkeyRoutes(app){


  console.log(
    "SPACEMONKEY EXTRA ROUTES START"
  )



  app.use(
    "/api",
    createSpacemonkeySystemRouter()
  )



  app.use(
    "/api",
    createSpacemonkeyApiCatalogRouter()
  )



  console.log(
    "SPACEMONKEY EXTRA ROUTES READY"
  )


}
