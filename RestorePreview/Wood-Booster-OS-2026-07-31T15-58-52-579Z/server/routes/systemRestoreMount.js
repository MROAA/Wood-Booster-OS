import createSystemRestoreRouter from "./systemRestore.js"



export function mountSystemRestore(app){


  app.use(
    "/api",
    createSystemRestoreRouter()
  )


}
