const sessionHistory = []



function createDevelopmentSession({

  name,

  goal,

  files,

  tasks

}) {


  const session = {


    id:

      `session-${Date.now()}`,


    name:

      name || "Unnamed Development Session",


    goal:

      goal || null,


    files:

      normalizeList(files),


    tasks:

      normalizeList(tasks),


    status:

      "active",


    createdAt:

      new Date().toISOString(),


    updatedAt:

      new Date().toISOString()

  }



  sessionHistory.push(

    session

  )



  return session

}





function updateSession({

  sessionId,

  task,

  file,

  status

}) {


  const session =

    sessionHistory.find(

      item =>

        item.id === sessionId

    )



  if(!session){

    return null

  }



  if(task){

    session.tasks.push(task)

  }



  if(file){

    session.files.push(file)

  }



  if(status){

    session.status = status

  }



  session.updatedAt =

    new Date().toISOString()



  return session

}





function getActiveSessions(){


  return sessionHistory.filter(

    session =>

      session.status === "active"

  )

}





function getSessionHistory(){


  return [

    ...sessionHistory

  ]

}





function normalizeList(value){


  if(!Array.isArray(value)){

    return []

  }



  return [

    ...value

  ]

}





function getDevelopmentSessionStatus(){


  return {


    engine:

      "Spacemonkey Development Session Engine",


    version:

      "0.1.0",


    sessions:

      sessionHistory.length

  }

}



export {

  createDevelopmentSession,

  updateSession,

  getActiveSessions,

  getSessionHistory,

  getDevelopmentSessionStatus

}
