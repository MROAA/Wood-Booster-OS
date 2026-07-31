/*
=====================================

SPACEMONKEY BOOTSTRAP ADAPTER

Turvallinen lukuväylä
Bootstrap Orchestratorille.

Read-only käynnistysrajapinta.

=====================================
*/


import {

  bootSpacemonkeySystem

} from "./spacemonkeyBootstrapOrchestrator.js"







function getSpacemonkeyBootstrap(){


  const bootstrap =

    bootSpacemonkeySystem()







  return {


    success:true,


    system:

      "Spacemonkey Bootstrap API",


    version:

      "1.0.0",


    bootstrap


  }


}







export {

  getSpacemonkeyBootstrap

}
