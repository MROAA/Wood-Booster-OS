import {
  createProjectPlanner,
} from "./createProjectPlanner.js"

import {
  openProjectPlanner,
} from "./openProjectPlanner.js"

import {
  updateProjectPlanner,
} from "./updateProjectPlanner.js"


const plannerRegistry = [
  {
    id:
      "create_project",

    description:
      "Tunnistaa uuden projektin luomisen.",

    priority:
      100,

    planner:
      createProjectPlanner,
  },

  {
    id:
      "update_project",

    description:
      "Tunnistaa aktiivisen projektin tilan päivittämisen.",

    priority:
      90,

    planner:
      updateProjectPlanner,
  },

  {
    id:
      "open_project_tab",

    description:
      "Tunnistaa aktiivisen projektin välilehden avaamisen.",

    priority:
      80,

    planner:
      openProjectPlanner,
  },
]


function getPlannerRegistry() {
  return [...plannerRegistry]
    .sort(
      (firstPlanner, secondPlanner) =>
        secondPlanner.priority -
        firstPlanner.priority,
    )
}


function getRegisteredPlannerInfo() {
  return getPlannerRegistry().map(
    (plannerDefinition) => ({
      id:
        plannerDefinition.id,

      description:
        plannerDefinition.description,

      priority:
        plannerDefinition.priority,
    }),
  )
}


export {
  getPlannerRegistry,
  getRegisteredPlannerInfo,
}
