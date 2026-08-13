/*
=====================================

SPACEMONKEY LEARNING ADAPTER

Turvallinen lukuväylä
Spacemonkey Learning Intelligence
-moduulille.

Read-only.

Ei muuta järjestelmää.

Ei tee automaattisia oppimismuutoksia.

=====================================
*/


import {

  createLearningReport,

  getLearningState

} from "./modules/learningIntelligence/index.js"







function getSpacemonkeyLearning(){


  return {


    success:true,


    system:

      "Spacemonkey Learning API",


    version:

      "1.0.0",





    report:

      createLearningReport(),





    state:

      getLearningState(),





    createdAt:

      new Date().toISOString()


  }


}







export {

  getSpacemonkeyLearning

}
