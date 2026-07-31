import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const MISSION_LEVELS = {


  PRIME:
    "prime",


  STRATEGIC:
    "strategic",


  ACTIVE:
    "active"

}



const missions = {


  prime:


  {

    id:
      "spacemonkey-prime-mission",


    title:
      "Human Creativity Amplification",


    description:

      "Support humans by transforming ideas into reliable systems.",


    protected:
      true

  },


  strategic:


  [

    {

      id:
        "wood-booster-os-development",


      title:
        "Develop Wood-Booster OS",


      priority:
        10

    },


    {

      id:
        "prisma-integration",


      title:
        "Prepare Prisma Intelligence Core",


      priority:
        9

    },


    {

      id:
        "knowledge-growth",


      title:
        "Expand System Knowledge",


      priority:
        8

    }

  ],


  active:


  []

}



function createMission({

  title,

  description,

  priority = 5

}) {


  const mission = {


    id:
      `mission-${Date.now()}`,


    title,


    description,


    priority,


    status:
      "active",


    createdAt:
      new Date().toISOString()

  }



  missions.active.push(
    mission
  )



  return mission

}



function getPrimeMission(){


  return missions.prime

}



function getStrategicMissions(){


  return [

    ...missions.strategic

  ]

}



function getActiveMissions(){


  return [

    ...missions.active

  ]

}



function completeMission({

  missionId

}) {


  const mission =
    missions.active.find(

      item =>
        item.id === missionId

    )



  if(
    !mission
  ){

    return {


      success:false,


      reason:
        "Mission not found"

    }

  }



  mission.status =
    "completed"



  mission.completedAt =
    new Date().toISOString()



  return {


    success:true,


    mission

  }

}



function getMissionStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    prime:
      missions.prime,


    strategic:
      missions.strategic,


    active:
      missions.active,


    generatedAt:
      new Date().toISOString()

  }

}



export {

  MISSION_LEVELS,

  createMission,

  getPrimeMission,

  getStrategicMissions,

  getActiveMissions,

  completeMission,

  getMissionStatus

}
