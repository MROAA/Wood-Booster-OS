/*
=====================================

SPACEMONKEY BOOTSTRAP RUNTIME

Hallitsee Bootstrapin elinkaarta.

Ei käynnistä palveluita.

Vain tila.

=====================================
*/


let state = {

  status:

    "created",


  version:

    "1.0.0",


  startedAt:

    null

}







function loadSpacemonkeyBootstrap(){


  state = {


    ...state,


    status:

      "loaded"


  }


  return state


}







function activateSpacemonkeyBootstrap(){


  state = {


    ...state,


    status:

      "active",


    startedAt:

      new Date().toISOString()


  }


  return state


}







function getSpacemonkeyBootstrapRuntime(){


  return {


    system:

      "Spacemonkey Bootstrap Runtime",


    ...state,


    createdAt:

      new Date().toISOString()


  }


}







export {

  loadSpacemonkeyBootstrap,

  activateSpacemonkeyBootstrap,

  getSpacemonkeyBootstrapRuntime

}
