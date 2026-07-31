const priorityHistory = []



const PRIORITY_LEVELS = {


  LOW:
    "low",


  NORMAL:
    "normal",


  HIGH:
    "high",


  CRITICAL:
    "critical"

}



function calculatePriority({

  missionAlignment = 0.5,

  impact = 0.5,

  urgency = 0.5,

  feasibility = 0.5,

  risk = 0.5

}) {


  const score =

    (

      missionAlignment * 0.35 +

      impact * 0.30 +

      urgency * 0.20 +

      feasibility * 0.15

    )

    -

    (

      risk * 0.20

    )



  return Math.max(

    0,

    Math.min(

      score,

      1

    )

  )

}



function determinePriorityLevel({

  score

}) {


  if(
    score >= 0.8
  ){

    return PRIORITY_LEVELS.CRITICAL

  }



  if(
    score >= 0.6
  ){

    return PRIORITY_LEVELS.HIGH

  }



  if(
    score >= 0.35
  ){

    return PRIORITY_LEVELS.NORMAL

  }



  return PRIORITY_LEVELS.LOW

}



function evaluateGoal({

  goal

}) {


  const score =
    calculatePriority({

      missionAlignment:
        goal.missionAlignment,


      impact:
        goal.impact,


      urgency:
        goal.urgency,


      feasibility:
        goal.feasibility,


      risk:
        goal.risk

    })



  const result = {


    goal,


    score,


    level:

      determinePriorityLevel({

        score

      }),


    evaluatedAt:
      new Date().toISOString()

  }



  priorityHistory.push(

    result

  )



  return result

}



function prioritizeGoals({

  goals

}) {


  return goals

    .map(

      goal =>

        evaluateGoal({

          goal

        })

    )

    .sort(

      (a,b)=>

        b.score -

        a.score

    )

}



function getPriorityStatus(){

  return {


    engine:
      "Spacemonkey Motivation & Priority Engine",


    version:
      "0.1.0",


    evaluations:
      priorityHistory.length

  }

}



export {

  PRIORITY_LEVELS,

  calculatePriority,

  evaluateGoal,

  prioritizeGoals,

  getPriorityStatus

}
