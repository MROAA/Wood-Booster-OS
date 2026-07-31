/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE

RESTORE REPORT SERVICE

Palautustapahtuman raportointi

=====================================
*/


function createRestoreReport({

  snapshot,

  restoredFiles,

  startedAt,

  finishedAt,

  success

}) {


  return {

    success,


    snapshot,


    restoredFiles,


    startedAt,


    finishedAt,


    duration:

      new Date(finishedAt)
        -
      new Date(startedAt),


    status:

      success
        ?
        "SUCCESS"
        :
        "FAILED"


  }


}





export {

  createRestoreReport

}
