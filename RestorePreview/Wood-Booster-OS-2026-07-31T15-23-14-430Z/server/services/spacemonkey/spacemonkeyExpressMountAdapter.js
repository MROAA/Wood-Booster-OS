/*
=====================================

SPACEMONKEY EXPRESS MOUNT ADAPTER

Yhdistää Spacemonkey
routerit Expressiin.

Hallittu adapteri.

=====================================
*/


function mountSpacemonkeyRouter({

  app,

  path,

  router

}){


  app.use(

    path,

    router

  )


  return {


    success:true,


    system:

      "Spacemonkey Express Mount Adapter",


    path,


    mounted:true,


    createdAt:

      new Date().toISOString()


  }


}





export {

  mountSpacemonkeyRouter

}
