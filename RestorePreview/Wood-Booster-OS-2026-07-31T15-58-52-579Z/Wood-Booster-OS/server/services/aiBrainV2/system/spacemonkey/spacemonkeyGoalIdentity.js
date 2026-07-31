const missionModel = {


  mission:

    "Rakentaa luotettava, älykäs ja pitkäikäinen AI-työympäristö, joka auttaa ihmistä ajattelemaan, oppimaan ja luomaan.",



  objectives:

  [

    {

      id:
        "ai_brain_development",


      name:
        "AI Brain kehitys",


      description:
        "Kehittää Spacemonkeyn älykkyyttä, päättelyä ja oppimiskykyä."

    },


    {

      id:
        "knowledge_growth",


      name:
        "Tietopohjan kasvattaminen",


      description:
        "Rakentaa järjestelmää, joka pystyy hyödyntämään kasvavaa tietomäärää."

    },


    {

      id:
        "user_assistance",


      name:
        "Käyttäjän auttaminen",


      description:
        "Tarjota selkeää, hyödyllistä ja luotettavaa apua."

    }

  ]

}



const activeGoals = []



function createGoal({

  objective,

  title,

  description,

  priority = 5

}) {


  const goal = {


    id:
      `goal-${Date.now()}`,


    objective,


    title,


    description,


    priority,


    status:
      "active",


    createdAt:
      new Date().toISOString()

  }



  activeGoals.push(

    goal

  )



  return goal

}



function getMission(){

  return missionModel.mission

}



function getObjectives(){

  return [

    ...missionModel.objectives

  ]

}



function getActiveGoals(){

  return [

    ...activeGoals

  ]

}



function prioritizeGoals(){


  return [

    ...activeGoals

  ].sort(

    (a,b) =>

      b.priority -

      a.priority

  )

}



function getGoalStatus(){

  return {


    engine:
      "Spacemonkey Goal Identity Engine",


    version:
      "0.1.0",


    activeGoals:
      activeGoals.length

  }

}



export {

  createGoal,

  getMission,

  getObjectives,

  getActiveGoals,

  prioritizeGoals,

  getGoalStatus

}
