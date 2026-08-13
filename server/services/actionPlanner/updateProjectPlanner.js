import {
  createActionResult,
  createNoMatchResult,
  getActiveProject,
  includesPhrase,
  normalizeText,
} from "./plannerUtils.js"


const projectStatuses = [
  {
    status:
      "Suunnittelu",

    keywords: [
      "suunnittelu",
      "suunnitteluun",
      "suunnitteluvaiheeseen",
      "planning",
    ],
  },

  {
    status:
      "Valmistus",

    keywords: [
      "valmistus",
      "valmistukseen",
      "valmistusvaiheeseen",
      "tuotantoon",
      "production",
    ],
  },

  {
    status:
      "Valmis",

    keywords: [
      "valmis",
      "valmiiksi",
      "valmistuneeksi",
      "completed",
      "complete",
      "done",
    ],
  },
]


const statusUpdateKeywords = [
  "vaihda projektin tila",
  "muuta projektin tila",
  "aseta projektin tila",
  "päivitä projektin tila",
  "merkitse projekti",
  "siirrä projekti",
  "set project status",
  "change project status",
  "mark project",
]


function containsStatusUpdateIntent(
  normalizedMessage,
) {
  return statusUpdateKeywords.some(
    (keyword) =>
      includesPhrase(
        normalizedMessage,
        keyword,
      ),
  )
}


function findRequestedProjectStatus(
  message,
) {
  const normalizedMessage =
    normalizeText(message)

  if (!normalizedMessage) {
    return null
  }

  if (
    !containsStatusUpdateIntent(
      normalizedMessage,
    )
  ) {
    return null
  }

  const statusMatch =
    projectStatuses.find(
      (statusDefinition) =>
        statusDefinition.keywords.some(
          (keyword) =>
            includesPhrase(
              normalizedMessage,
              keyword,
            ),
        ),
    )

  return (
    statusMatch?.status ||
    null
  )
}


function createUpdateProjectStatusAction({
  project,
  status,
}) {
  return {
    type:
      "update_project",

    label:
      `Vaihda projektin tila: ${status}`,

    projectId:
      project.id,

    status,

    payload: {
      projectId:
        project.id,

      status,
    },
  }
}


function updateProjectPlanner({
  message,
  runtimeContext,
}) {
  const requestedStatus =
    findRequestedProjectStatus(
      message,
    )

  if (!requestedStatus) {
    return createNoMatchResult(
      "update project planner did not match",
    )
  }

  const activeProject =
    getActiveProject(
      runtimeContext,
    )

  if (!activeProject) {
    return createActionResult({
      matched: false,

      actions: [],

      answer:
        "Projektin tilaa ei voida muuttaa, koska aktiivista projektia ei ole valittu.",

      reason:
        "active project missing",
    })
  }

  const action =
    createUpdateProjectStatusAction({
      project:
        activeProject,

      status:
        requestedStatus,
    })

  return createActionResult({
    matched: true,

    actions: [
      action,
    ],

    answer:
      `Vaihdetaan projektin tilaksi "${requestedStatus}".`,

    reason:
      "update project status action generated",
  })
}


function getSupportedProjectStatuses() {
  return projectStatuses.map(
    (statusDefinition) =>
      statusDefinition.status,
  )
}


export {
  createUpdateProjectStatusAction,
  findRequestedProjectStatus,
  getSupportedProjectStatuses,
  updateProjectPlanner,
}
