/*
=====================================

SPACEMONKEY RESTORE APPROVAL

Hallinnoi snapshot palautuksen
hyväksyntää.

Ei suorita palautusta.

=====================================
*/



let approvalState = {

  approved: false,

  approvedBy: null,

  approvedAt: null

}







function requestRestoreApproval({


  approvedBy = "unknown"


}){


  approvalState = {


    approved:

      true,


    approvedBy,


    approvedAt:

      new Date().toISOString()


  }





  return {


    approved:

      approvalState.approved,


    approvedBy:

      approvalState.approvedBy,


    approvedAt:

      approvalState.approvedAt,


    nextStep:

      "restore-ready"


  }


}







function getRestoreApproval(){


  return approvalState


}







export {

  requestRestoreApproval,

  getRestoreApproval

}
