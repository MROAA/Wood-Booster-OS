const activityHistory = []



let currentActivity = {

  state:
    "idle",

  action:
    null,

  decision:
    null,

  plan:
    null,

  updatedAt:
    new Date().toISOString()

}







function updateDashboardActivity({

  state = "idle",

  action = null,

  decision = null,

  plan = null,

} = {}) {



  currentActivity = {

    state,

    action,

    decision,

    plan,

    updatedAt:
      new Date().toISOString()

  }



  activityHistory.push(

    currentActivity

  )



  return {

    system:
      "Spacemonkey Dashboard Activity Bridge",


    activity:
      currentActivity,


    createdAt:
      new Date().toISOString()

  }

}







function getDashboardActivity(){


  return {

    system:
      "Spacemonkey Dashboard Activity Bridge",


    activity:
      currentActivity,


    history:
      [
        ...activityHistory
      ],


    createdAt:
      new Date().toISOString()

  }

}







function getDashboardActivityStatus(){


  return {

    system:
      "Spacemonkey Dashboard Activity Bridge",


    version:
      "1.0.0",


    events:
      activityHistory.length

  }

}







export {

  updateDashboardActivity,

  getDashboardActivity,

  getDashboardActivityStatus

}
