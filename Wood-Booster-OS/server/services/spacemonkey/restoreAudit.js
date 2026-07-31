/*
=====================================

SPACEMONKEY RESTORE AUDIT

Kirjaa palautukseen liittyvät
tapahtumat.

Ensimmäinen versio:
memory storage.

Ei muuta järjestelmää.

=====================================
*/


const auditLog = []







function createRestoreAuditEvent({

  event,

  user,

  snapshot,

  status

}){


  const entry = {


    event,


    user,


    snapshot,


    status,


    timestamp:

      new Date().toISOString()


  }





  auditLog.push(

    entry

  )





  return entry


}







function getRestoreAuditLog(){


  return auditLog


}







export {

  createRestoreAuditEvent,

  getRestoreAuditLog

}
