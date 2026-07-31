const auditHistory = []



function recordExecutionAudit({

  task,

  decision,

  result

}) {


  const audit = {


    id:

      `audit-${Date.now()}`,


    taskId:

      task?.id || null,


    target:

      task?.target || null,


    decision:

    {

      action:

        decision?.action || null,


      reason:

        decision?.reason || null

    },


    execution:

    {

      status:

        result?.status || "not_executed",


      result:

        result || null

    },


    timestamp:

      new Date().toISOString()

  }



  auditHistory.push(

    audit

  )



  return audit

}





function getAuditByTask({

  taskId

}) {


  return auditHistory.filter(

    item =>

      item.taskId === taskId

  )

}





function getRecentAudits(){


  return [

    ...auditHistory

  ]

  .reverse()

}





function getAuditStatus(){


  return {


    engine:

      "Spacemonkey Execution Audit Engine",


    version:

      "0.1.0",


    audits:

      auditHistory.length

  }

}



export {

  recordExecutionAudit,

  getAuditByTask,

  getRecentAudits,

  getAuditStatus

}
