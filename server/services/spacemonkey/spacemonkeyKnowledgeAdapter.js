/*
=====================================

SPACEMONKEY KNOWLEDGE ADAPTER

Turvallinen lukuväylä
Spacemonkey Knowledge Intelligence
-moduulille.

Read-only.

Ei muuta tietoa.

=====================================
*/


import {

  createKnowledgeReport,

  getKnowledgeState

} from "./modules/knowledgeIntelligence/index.js"







function getSpacemonkeyKnowledge(){


  return {


    success:true,


    system:

      "Spacemonkey Knowledge API",


    version:

      "1.0.0",





    report:

      createKnowledgeReport(),





    state:

      getKnowledgeState(),





    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyKnowledge

}
