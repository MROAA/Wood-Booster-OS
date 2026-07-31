import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"


import {
  getPrimeMission,
  getStrategicMissions,
} from "./spacemonkeyMissionController.js"



const GOAL_STATUS = {


  PLANNED:
    "planned",


  ACTIVE:
    "active",


  BLOCKED:
    "blocked",


  COMPLETED:
    "completed"

}



const goals = []



function createGoal({

  title,

  description,

  priority = 5,

  missionId = null

}) {


  const goal = {


    id:
      `goal-${Date.now()}`,


    title,


    description,


    priority,


    missionId,


    status:
      GOAL_STATUS.PLANNED,


    createdAt:
      new Date().toISOString()

  }



  goals.push(goal)



  return goal

}



function activateGoal({

  goalId

}) {


  const goal =
    goals.find(

      item =>
        item.id === goalId

    )



  if(
    !goal
  ){

    return {


      success:false,


      reason:
        "Goal not found"

    }

  }



  goal.status =
    GOAL_STATUS.ACTIVE



  goal.startedAt =
    new Date().toISOString()



  return {


    success:true,


    goal

  }

}



function completeGoal({

  goalId

}) {


  const goal =
    goals.find(

      item =>
        item.id === goalId

    )



  if(
    !goal
  ){

    return {


      success:false,


      reason:
        "Goal not found"

    }

  }



  goal.status =
    GOAL_STATUS.COMPLETED



  goal.completedAt =
    new Date().toISOString()



  return {


    success:true,


    goal

  }

}



function prioritizeGoals(){


  return [

    ...goals

  ]

  .sort(

    (a,b)=>

      b.priority -
      a.priority

  )

}



function getActiveGoals(){


  return goals.filter(

    goal =>

      goal.status === GOAL_STATUS.ACTIVE

  )

}



function evaluateGoalAlignment({

  goal

}) {


  const strategic =
    getStrategicMissions()



  const aligned =
    strategic.some(

      mission =>

        mission.id === goal.missionId

    )



  return {


    aligned,


    mission:

      aligned

        ?

        "connected"

        :

        "unknown"

  }

}



function getGoalStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    primeMission:
      getPrimeMission(),


    totalGoals:
      goals.length,


    activeGoals:
      getActiveGoals(),


    allGoals:
      goals

  }

}



export {

  GOAL_STATUS,

  createGoal,

  activateGoal,

  completeGoal,

  prioritizeGoals,

  getActiveGoals,

  evaluateGoalAlignment,

  getGoalStatus

}
