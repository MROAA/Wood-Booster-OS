const summaryHistory = []



function createDevelopmentSummary({

  projectName,

  tasks,

  workflows,

  decisions,

  audits

}) {


  const summary = {


    projectName:

      projectName || "unknown",


    overview:

    {

      tasks:

        countItems(tasks),


      workflows:

        countItems(workflows),


      decisions:

        countItems(decisions),


      audits:

        countItems(audits)

    },


    activeWork:

      findActiveWork({

        tasks,

        workflows

      }),


    lastAudit:

      getLastItem(audits),


    createdAt:

      new Date().toISOString()

  }



  summaryHistory.push(

    summary

  )



  return summary

}





function findActiveWork({

  tasks,

  workflows

}) {


  const active = []



  if(

    Array.isArray(tasks)

  ){


    active.push(

      ...tasks.filter(

        task =>

          task.status !== "completed"

      )

    )

  }



  if(

    Array.isArray(workflows)

  ){


    active.push(

      ...workflows.filter(

        workflow =>

          workflow.status === "active"

      )

    )

  }



  return active

}





function countItems(items){


  if(

    !Array.isArray(items)

  ){

    return 0

  }



  return items.length

}





function getLastItem(items){


  if(

    !Array.isArray(items) ||

    items.length === 0

  ){

    return null

  }



  return items[

    items.length - 1

  ]

}





function getSummaryHistory(){


  return [

    ...summaryHistory

  ]

}





function getDevelopmentSummaryStatus(){


  return {


    engine:

      "Spacemonkey Development Intelligence Summary Engine",


    version:

      "0.1.0",


    summaries:

      summaryHistory.length

  }

}



export {

  createDevelopmentSummary,

  getSummaryHistory,

  getDevelopmentSummaryStatus

}
