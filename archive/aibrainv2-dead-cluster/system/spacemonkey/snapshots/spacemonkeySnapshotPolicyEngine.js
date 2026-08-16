/*
==================================================

SPACEMONKEY SNAPSHOT POLICY ENGINE

Turvallinen kasvukerros.

Tehtävä:
- arvioi tarvitaanko snapshot
- ei suorita muutoksia
- ei kirjoita tiedostoja
- ei tee automaattisia päätöksiä

Snapshot ennen muutosta.

==================================================
*/



const CHANGE_TYPES = {

  CODE_CHANGE:
    "code_change",

  DATABASE_CHANGE:
    "database_change",

  SYSTEM_CHANGE:
    "system_change",

  CONFIG_CHANGE:
    "config_change",

  KNOWLEDGE_CHANGE:
    "knowledge_change",

}





function evaluateSnapshotNeed({

  changeType,

  riskLevel = "low",

} = {}){


  const reasons = []



  let required = false



  if(
    changeType ===
    CHANGE_TYPES.CODE_CHANGE
  ){

    required = true

    reasons.push(
      "Code changes require safety snapshot."
    )

  }



  if(
    changeType ===
    CHANGE_TYPES.DATABASE_CHANGE
  ){

    required = true

    reasons.push(
      "Database changes require safety snapshot."
    )

  }



  if(
    changeType ===
    CHANGE_TYPES.SYSTEM_CHANGE
  ){

    required = true

    reasons.push(
      "System changes require safety snapshot."
    )

  }



  if(
    riskLevel === "high"
  ){

    required = true

    reasons.push(
      "High risk operation detected."
    )

  }



  return {

    snapshotRequired:
      required,


    changeType:
      changeType || "unknown",


    risk:
      riskLevel,


    approvalRequired:
      required,


    reasons,


    safe:
      true

  }


}





function getSnapshotPolicy(){


  return {

    system:
      "Spacemonkey Snapshot Policy Engine",


    version:
      "1.0.0",


    rules:{

      beforeCodeChange:
        true,


      beforeDatabaseChange:
        true,


      beforeSystemChange:
        true,


      requireApproval:
        true,


      autonomousRestore:
        false

    },


    safety:
      "Spacemonkey cannot modify its foundation without a snapshot."

  }


}





export {

  CHANGE_TYPES,

  evaluateSnapshotNeed,

  getSnapshotPolicy

}
