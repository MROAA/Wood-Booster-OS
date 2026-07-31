/*
=====================================

SPACEMONKEY SYSTEM SNAPSHOT ADAPTER

Turvallinen lukuväylä
Spacemonkey järjestelmätilalle.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  createSystemSnapshot

} from "./spacemonkeySystemSnapshot.js"







function getSpacemonkeySystemSnapshot(){


  const snapshot =

    createSystemSnapshot()







  return {


    success:true,


    system:

      "Spacemonkey System Snapshot API",


    version:

      "1.0.0",


    snapshot


  }


}







export {

  getSpacemonkeySystemSnapshot

}
