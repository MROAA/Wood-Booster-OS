import createToolsRouter from "../routes/tools.js"



export function integrateToolsLayer(app) {


  app.use(
    "/api",
    createToolsRouter()
  )


}
