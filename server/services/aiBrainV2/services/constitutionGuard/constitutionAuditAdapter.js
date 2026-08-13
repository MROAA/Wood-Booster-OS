import {
  addAuditRecord,
} from "../capabilityExecution/capabilityAuditStore.js"



function auditConstitutionDecision({

  actionType,

  decision,

  reason,

} = {}) {


  return addAuditRecord({

    type:
      "constitution_check",


    capability:
      actionType || null,


    status:
      decision === "allow"
        ? "approved"
        : decision === "require_approval"
          ? "approval_required"
          : "blocked",


    metadata: {

      guard:
        "constitution-guard",


      decision,

      reason,

    },

  })


}



export {

  auditConstitutionDecision,

}
