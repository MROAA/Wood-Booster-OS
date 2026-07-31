/*
=====================================

SPACEMONKEY BOOTSTRAP LIFECYCLE

Yhdistää:

- Runtime
- Manager
- Health

Hallittu elinkaari.

=====================================
*/


import {

  loadSpacemonkeyBootstrap,

  activateSpacemonkeyBootstrap

} from "./spacemonkeyBootstrapRuntime.js"







function loadBootstrapLifecycle(){


  return loadSpacemonkeyBootstrap()


}







function activateBootstrapLifecycle(){


  return activateSpacemonkeyBootstrap()


}







function getBootstrapLifecycleState(){


  return {


    system:

      "Spacemonkey Bootstrap Lifecycle",


    runtime:

      activateBootstrapLifecycle()


  }


}







export {

  loadBootstrapLifecycle,

  activateBootstrapLifecycle,

  getBootstrapLifecycleState

}
