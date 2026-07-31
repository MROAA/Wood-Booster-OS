const MODULE_ID = "creator-intelligence-scheduler"



const schedules = []

const executionHistory = []



function createSchedule({

  name,

  interval,

  action,

}){

  const schedule = {

    id:
      `creator-schedule-${Date.now()}`,

    name,

    interval,

    action,

    status:
      "active",

    created:
      new Date().toISOString(),

  }


  schedules.push(schedule)


  return schedule

}



function executeSchedule(id){

  const schedule =
    schedules.find(
      item =>
        item.id === id
    )


  if (!schedule){

    return {

      success:
        false,

      reason:
        "Schedule not found.",

    }

  }



  const execution = {

    id:
      `execution-${Date.now()}`,

    scheduleId:
      id,

    action:
      schedule.action,

    timestamp:
      new Date().toISOString(),

    status:
      "completed",

  }


  executionHistory.push(
    execution
  )


  return execution

}



function getSchedules(){

  return {

    moduleId:
      MODULE_ID,

    count:
      schedules.length,

    schedules,

  }

}



function getExecutionHistory(){

  return {

    moduleId:
      MODULE_ID,

    count:
      executionHistory.length,

    executions:
      executionHistory,

  }

}



function getLatestExecutions(){

  return executionHistory.slice(-10)

}



export {

  MODULE_ID,

  createSchedule,

  executeSchedule,

  getSchedules,

  getExecutionHistory,

  getLatestExecutions,

}
