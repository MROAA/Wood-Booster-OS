/*
=====================================

SPACEMONKEY DECISION ADAPTER

Turvallinen lukuväylä
Spacemonkey Decision Intelligence
-moduulille.

Read-only.

Ei tee päätöksiä.

Ei suorita toimintoja.

=====================================
*/


import {

  createDecisionReport,

  getDecisionState

} from "./modules/decisionIntelligence/index.js"







function getSpacemonkeyDecision(){


  return {


    success:true,


    system:

      "Spacemonkey Decision API",


    version:

      "1.0.0",





    report:

      createDecisionReport(),





    state:

      getDecisionState(),





    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyDecision

}
