import {
  cleanTextValue,
  createActionResult,
  createNoMatchResult,
} from "./plannerUtils.js"


function getRequestedProjectName(
  message,
) {
  const rawMessage =
    String(message || "")
      .trim()

  const patterns = [
    /^luo uusi projekti nimeltä\s+(.+)$/i,
    /^luo projekti nimeltä\s+(.+)$/i,
    /^tee uusi projekti nimeltä\s+(.+)$/i,
    /^tee projekti nimeltä\s+(.+)$/i,
    /^perusta uusi projekti nimeltä\s+(.+)$/i,
    /^perusta projekti nimeltä\s+(.+)$/i,

    /^luo uusi projekti\s+(.+)$/i,
    /^luo projekti\s+(.+)$/i,
    /^tee uusi projekti\s+(.+)$/i,
    /^tee projekti\s+(.+)$/i,
    /^perusta uusi projekti\s+(.+)$/i,
    /^perusta projekti\s+(.+)$/i,

    /^create a new project named\s+(.+)$/i,
    /^create project named\s+(.+)$/i,
    /^create a new project\s+(.+)$/i,
    /^create project\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match =
      rawMessage.match(pattern)

    if (!match?.[1]) {
      continue
    }

    const projectName =
      cleanTextValue(
        match[1],
      )

    if (projectName) {
      return projectName
    }
  }

  return null
}


function createProjectAction({
  name,
}) {
  return {
    type:
      "create_project",

    label:
      `Luo projekti ${name}`,

    name,

    status:
      "Suunnittelu",

    notes:
      "",

    payload: {
      name,

      status:
        "Suunnittelu",

      notes:
        "",
    },
  }
}


function createProjectPlanner({
  message,
}) {
  const requestedProjectName =
    getRequestedProjectName(
      message,
    )

  if (!requestedProjectName) {
    return createNoMatchResult(
      "create project planner did not match",
    )
  }

  const action =
    createProjectAction({
      name:
        requestedProjectName,
    })

  return createActionResult({
    matched: true,

    actions: [
      action,
    ],

    answer:
      `Luodaan projekti "${requestedProjectName}".`,

    reason:
      "create project action generated",
  })
}


export {
  createProjectAction,
  createProjectPlanner,
  getRequestedProjectName,
}
