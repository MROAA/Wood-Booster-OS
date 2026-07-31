/*
=====================================

SPACEMONKEY COMMAND CENTER ADAPTER

Turvallinen lukuväylä
Spacemonkey Command Centerille.

Read-only.

Ei muuta järjestelmää.

=====================================
*/


import {

  getSpacemonkeyCommandCenter

} from "./spacemonkeyCommandCenter.js"







function getSpacemonkeyDashboard(){


  const dashboard =

    getSpacemonkeyCommandCenter()







  return {


    success:true,


    system:

      "Spacemonkey Command Center API",


    version:

      "1.0.0",


    dashboard


  }


}







export {

  getSpacemonkeyDashboard

}
