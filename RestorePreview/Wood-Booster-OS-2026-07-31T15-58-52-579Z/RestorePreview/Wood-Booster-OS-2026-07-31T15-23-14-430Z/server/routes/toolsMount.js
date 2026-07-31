import createToolsRouter from "./tools.js"



export function createToolsMount(app) {


  app.use(
    "/api",
    createToolsRouter()
  )


}
