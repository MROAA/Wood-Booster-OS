import {
  getActionPlannerInfo,
  runActionPlanner,
} from "./actionPlanner/index.js"

import {
  getRequestedProjectName,
} from "./actionPlanner/createProjectPlanner.js"

import {
  findRequestedProjectStatus,
  getSupportedProjectStatuses,
} from "./actionPlanner/updateProjectPlanner.js"

import {
  findRequestedProjectTab,
  getSupportedProjectTabs,
} from "./actionPlanner/openProjectPlanner.js"


function generateAIActions({
  message,
  runtimeContext = null,
}) {
  return runActionPlanner({
    message,
    runtimeContext,
  })
}


function getSupportedAIActionInfo() {
  return {
    actions: [
      {
        type:
          "create_project",

        description:
          "Luo uuden projektin.",

        requiredFields: [
          "name",
        ],
      },

      {
        type:
          "update_project",

        description:
          "Päivittää aktiivisen projektin tietoja.",

        requiredContext: [
          "activeProject.id",
        ],

        supportedStatuses:
          getSupportedProjectStatuses(),
      },

      {
        type:
          "open_project_tab",

        description:
          "Avaa aktiivisen projektin välilehden.",

        requiredContext: [
          "activeProject.id",
        ],

        tabs:
          getSupportedProjectTabs(),
      },
    ],

    actionPlanner:
      getActionPlannerInfo(),
  }
}


export {
  findRequestedProjectStatus,
  findRequestedProjectTab,
  generateAIActions,
  getRequestedProjectName,
  getSupportedAIActionInfo,
}
