export function debugRoutes(app){


  console.log(
    "REGISTERED ROUTES"
  )


  for(
    const layer of app.router.stack
  ){

    if(
      layer.route
    ){

      console.log(
        layer.route.path
      )

    }

  }

}
