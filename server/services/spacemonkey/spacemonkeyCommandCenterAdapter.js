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







async function getSpacemonkeyDashboard(){


  const dashboard =

    await getSpacemonkeyCommandCenter()







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
