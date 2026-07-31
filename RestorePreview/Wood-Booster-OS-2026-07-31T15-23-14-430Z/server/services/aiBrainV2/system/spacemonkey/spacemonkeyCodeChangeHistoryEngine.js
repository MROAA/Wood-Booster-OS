const changeHistory = []



function recordCodeChange({

  filePath,

  instruction,

  changePlan,

  approval,

  result

}) {


  const record = {


    filePath:

      filePath || null,


    instruction:

      instruction || null,


    action:

      changePlan?.action || null,


    target:

      changePlan?.target || null,


    approval:

    {

      status:

        approval?.status || "unknown",


      approved:

        approval?.approved || false

    },


    result:

      result || null,


    createdAt:

      new Date().toISOString()

  }



  changeHistory.push(

    record

  )



  return record

}





function getFileChangeHistory({

  filePath

}) {


  return changeHistory.filter(

    item =>

      item.filePath === filePath

  )

}





function getRecentChanges(){

  return [

    ...changeHistory

  ]

  .reverse()

}





function getChangeHistoryStatus(){


  return {


    engine:

      "Spacemonkey Code Change History Engine",


    version:

      "0.1.0",


    changes:

      changeHistory.length

  }

}



export {

  recordCodeChange,

  getFileChangeHistory,

  getRecentChanges,

  getChangeHistoryStatus

}
