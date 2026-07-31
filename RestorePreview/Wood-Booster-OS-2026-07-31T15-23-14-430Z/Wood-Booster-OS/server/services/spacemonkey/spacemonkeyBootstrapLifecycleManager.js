/*
=====================================

SPACEMONKEY BOOTSTRAP LIFECYCLE MANAGER

Orkestroi:

- Bootstrap Lifecycle
- Runtime State

Ei käynnistä Expressiä.

Hallittu käynnistys.

=====================================
*/


import {

  loadBootstrapLifecycle,

  activateBootstrapLifecycle,

  getBootstrapLifecycleState

} from "./spacemonkeyBootstrapLifecycle.js"







function startSpacemonkeyBootstrap(){


  const loaded =

    loadBootstrapLifecycle()







  const active =

    activateBootstrapLifecycle()







  return {


    success:true,


    system:

      "Spacemonkey Bootstrap Lifecycle Manager",


    version:

      "1.0.0",


    loaded,


    active,


    state:

      getBootstrapLifecycleState(),


    createdAt:

      new Date().toISOString()


  }


}







export {

  startSpacemonkeyBootstrap

}
