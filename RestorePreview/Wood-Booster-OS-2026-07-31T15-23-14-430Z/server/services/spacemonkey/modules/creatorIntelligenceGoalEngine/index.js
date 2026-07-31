const MODULE_ID = "creator-intelligence-goal-engine"



const goals = []



function createGoal({

  title,

  description,

  priority,

  milestones,

}){

  const goal = {

    id:
      `goal-${Date.now()}`,


    created:
      new Date().toISOString(),


    title,


    description,


    priority:
      priority || "normal",


    milestones:
      milestones || [],


    progress:
      0,


    status:
      "active",

  }


  goals.push(goal)


  return goal

}



function updateProgress({

  id,

  progress,

}){

  const goal =
    goals.find(
      item =>
        item.id === id
    )


  if (!goal){

    return {

      success:
        false,

      reason:
        "Goal not found.",

    }

  }



  goal.progress =
    Math.min(
      100,
      Math.max(
        0,
        progress
      )
    )



  if (
    goal.progress === 100
  ){

    goal.status =
      "completed"

  }



  return {

    success:
      true,

    goal,

  }

}



function addMilestone({

  id,

  milestone,

}){

  const goal =
    goals.find(
      item =>
        item.id === id
    )


  if (!goal){

    return {

      success:
        false,

    }

  }



  goal.milestones.push({

    title:
      milestone,


    completed:
      false,

  })



  return goal

}



function getGoals(){

  return {

    moduleId:
      MODULE_ID,


    count:
      goals.length,


    goals,

  }

}



function getActiveGoals(){

  return goals.filter(
    goal =>
      goal.status === "active"
  )

}



export {

  MODULE_ID,

  createGoal,

  updateProgress,

  addMilestone,

  getGoals,

  getActiveGoals,

}
