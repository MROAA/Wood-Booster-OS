import {

  loadSpacemonkeyRoutes

} from "./services/spacemonkey/spacemonkeyRouteLoader.js"



const routes =

  loadSpacemonkeyRoutes()



console.log(

  JSON.stringify(

    routes.map(

      route => ({

        id:route.id,

        path:route.path,

        router:

          typeof route.router

      })

    ),

    null,

    2

  )

)
