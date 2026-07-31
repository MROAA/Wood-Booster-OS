/*
=====================================

SPACEMONKEY ROUTE REGISTRY

Hallinnoi Spacemonkey routeja.

Ei käynnistä palvelinta.

Vain rekisteri.

=====================================
*/


const routes = []







function registerSpacemonkeyRoute(route){


  if(!route || !route.id){


    return {


      success:false,


      error:"Invalid route"


    }


  }







  const exists =

    routes.find(

      item =>

        item.id === route.id

    )







  if(exists){


    return {


      success:false,


      error:"Route already exists"


    }


  }







  routes.push(

    route

  )







  return {


    success:true,


    route

  }


}







function getSpacemonkeyRoutes(){


  return routes


}







function getSpacemonkeyRoute(id){


  return (

    routes.find(

      item =>

        item.id === id

    )

    ||

    null

  )


}







export {

  registerSpacemonkeyRoute,

  getSpacemonkeyRoutes,

  getSpacemonkeyRoute

}
