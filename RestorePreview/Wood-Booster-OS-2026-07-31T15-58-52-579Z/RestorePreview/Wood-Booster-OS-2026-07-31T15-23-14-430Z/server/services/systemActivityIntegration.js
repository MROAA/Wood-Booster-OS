import createSystemActivityRouter from "../routes/systemActivity.js"



export function integrateSystemActivity(app){


  console.log(
    "SYSTEM ACTIVITY ROUTE START"
  )



  app.use(
    "/api",
    createSystemActivityRouter()
  )



  console.log(
    "SYSTEM ACTIVITY ROUTE READY"
  )


}
