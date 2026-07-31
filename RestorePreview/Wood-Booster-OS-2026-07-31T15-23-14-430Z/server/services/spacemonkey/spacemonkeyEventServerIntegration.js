import {
  createSpacemonkeyEventsRouter,
} from "../../routes/spacemonkeyEvents.js"





export function integrateSpacemonkeyEventLayer(app){


  console.log(
    "SPACEMONKEY EVENT LAYER INTEGRATION START"
  )



  app.use(
    "/api",
    createSpacemonkeyEventsRouter()
  )



  console.log(
    "MOUNTING: /api/spacemonkey/events"
  )



  console.log(
    "SPACEMONKEY EVENT LAYER INTEGRATION READY"
  )


}
