import {
  apiPost,
  apiPut,
} from "../../api/client"


const supportedProjectTabs = [
  "overview",
  "ai",
  "tools",
  "memory",
  "knowledge",
  "notes",
  "files",
]


const projectTabLabels = {
  overview: "Overview",
  ai: "AI Assistant",
  tools: "Tools",
  memory: "Memory",
  knowledge: "Knowledge",
  notes: "Notes",
  files: "Files",
}


const supportedProjectStatuses = [
  "Suunnittelu",
  "Valmistus",
  "Valmis",
]


function createResult({
  success,
  type,
  message,
  path = null,
  action = null,
  data = null,
}) {
  return {
    success,
    type,
    message,
    path,
    action,
    data,
  }
}


function normalizeProjectPayload(
  action,
) {
  const payload =
    action?.payload || {}

  const name =
    String(
      payload.name ||
      action?.name ||
      "",
    ).trim()

  const status =
    String(
      payload.status ||
      action?.status ||
      "",
    ).trim()

  const notes =
    String(
      payload.notes ??
      action?.notes ??
      "",
    ).trim()

  const customerId =
    payload.customerId ||
    action?.customerId ||
    null

  return {
    name,
    status,
    notes,
    customerId,
  }
}


function normalizeProjectTab(
  action,
) {
  const payload =
    action?.payload || {}

  return String(
    payload.tab ||
    payload.tabId ||
    action?.tab ||
    action?.tabId ||
    "",
  )
    .trim()
    .toLowerCase()
}


function normalizeProjectId(
  action,
) {
  const payload =
    action?.payload || {}

  return (
    payload.projectId ||
    action?.projectId ||
    null
  )
}


function normalizeUpdatePayload(
  action,
) {
  const payload =
    action?.payload || {}

  const update = {}

  if (
    payload.name !== undefined ||
    action?.name !== undefined
  ) {
    update.name =
      String(
        payload.name ??
        action?.name ??
        "",
      ).trim()
  }

  if (
    payload.status !== undefined ||
    action?.status !== undefined
  ) {
    update.status =
      String(
        payload.status ??
        action?.status ??
        "",
      ).trim()
  }

  if (
    payload.notes !== undefined ||
    action?.notes !== undefined
  ) {
    update.notes =
      String(
        payload.notes ??
        action?.notes ??
        "",
      ).trim()
  }

  if (
    payload.customerId !== undefined ||
    action?.customerId !== undefined
  ) {
    update.customerId =
      payload.customerId ??
      action?.customerId ??
      null
  }

  return update
}


function supportsProjectAction(
  actionType,
) {
  return [
    "create_project",
    "open_project_tab",
    "update_project",
  ].includes(actionType)
}


async function executeProjectTool({
  action,
  actionType,
  navigate,
}) {
  if (
    actionType ===
    "create_project"
  ) {
    return executeCreateProject({
      action,
      navigate,
    })
  }

  if (
    actionType ===
    "open_project_tab"
  ) {
    return executeOpenProjectTab({
      action,
      navigate,
    })
  }

  if (
    actionType ===
    "update_project"
  ) {
    return executeUpdateProject({
      action,
    })
  }

  return createResult({
    success: false,
    type: "unsupported",
    message:
      `Project Tool ei tue toimintoa: ${actionType}.`,
    action,
  })
}


async function executeCreateProject({
  action,
  navigate,
}) {
  const project =
    normalizeProjectPayload(
      action,
    )

  if (project.name.length < 2) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Projektin nimi puuttuu tai on liian lyhyt.",
      action,
    })
  }

  if (project.name.length > 120) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Projektin nimi on liian pitkä.",
      action,
    })
  }

  const requestBody = {
    name:
      project.name,

    status:
      project.status ||
      "Suunnittelu",
  }

  if (project.notes) {
    requestBody.notes =
      project.notes
  }

  if (project.customerId) {
    requestBody.customerId =
      project.customerId
  }

  try {
    const response =
      await apiPost(
        "/projects",
        requestBody,
      )

    const createdProject =
      response?.project ||
      response?.data ||
      response

    const projectId =
      createdProject?.id

    if (!projectId) {
      if (
        typeof navigate ===
        "function"
      ) {
        navigate("/projects")
      }

      return createResult({
        success: true,
        type: "create_project",
        message:
          `Projekti "${project.name}" luotiin. Projektit avattiin.`,
        path: "/projects",
        action,
        data:
          createdProject,
      })
    }

    const path =
      `/projects/${encodeURIComponent(
        projectId,
      )}`

    if (
      typeof navigate ===
      "function"
    ) {
      navigate(path)
    }

    return createResult({
      success: true,
      type: "create_project",
      message:
        `Projekti "${project.name}" luotiin onnistuneesti.`,
      path,
      action,
      data:
        createdProject,
    })
  } catch (error) {
    console.error(
      "Project Tool create error:",
      error,
    )

    return createResult({
      success: false,
      type: "api_error",
      message:
        error?.message ||
        "Projektin luominen epäonnistui.",
      action,
    })
  }
}


async function executeUpdateProject({
  action,
}) {
  const projectId =
    normalizeProjectId(
      action,
    )

  if (!projectId) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Päivitettävän projektin ID puuttuu.",
      action,
    })
  }

  const update =
    normalizeUpdatePayload(
      action,
    )

  if (
    Object.keys(update).length === 0
  ) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Projektin päivitettäviä tietoja ei annettu.",
      action,
    })
  }

  if (
    update.name !== undefined &&
    update.name.length < 2
  ) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Projektin nimi on liian lyhyt.",
      action,
    })
  }

  if (
    update.name !== undefined &&
    update.name.length > 120
  ) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Projektin nimi on liian pitkä.",
      action,
    })
  }

  if (
    update.status &&
    !supportedProjectStatuses.includes(
      update.status,
    )
  ) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        `Tuntematon projektin tila: ${update.status}.`,
      action,
      data: {
        supportedStatuses: [
          ...supportedProjectStatuses,
        ],
      },
    })
  }

  try {
    const response =
      await apiPut(
        `/projects/${encodeURIComponent(
          projectId,
        )}`,
        update,
      )

    const updatedProject =
      response?.project ||
      response?.data ||
      response

    if (
      typeof window !==
      "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "wood-booster:project-updated",
          {
            detail: {
              project:
                updatedProject,
              projectId,
            },
          },
        ),
      )
    }

    return createResult({
      success: true,
      type: "update_project",
      message:
        createUpdateMessage(
          update,
        ),
      action,
      data:
        updatedProject,
    })
  } catch (error) {
    console.error(
      "Project Tool update error:",
      error,
    )

    return createResult({
      success: false,
      type: "api_error",
      message:
        error?.message ||
        "Projektin päivittäminen epäonnistui.",
      action,
    })
  }
}


function executeOpenProjectTab({
  action,
  navigate,
}) {
  const tab =
    normalizeProjectTab(
      action,
    )

  const projectId =
    normalizeProjectId(
      action,
    )

  if (!tab) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Avattavan projektivälilehden tunniste puuttuu.",
      action,
    })
  }

  if (
    !supportedProjectTabs.includes(
      tab,
    )
  ) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        `Tuntematon projektivälilehti: ${tab}.`,
      action,
      data: {
        supportedTabs: [
          ...supportedProjectTabs,
        ],
      },
    })
  }

  let path = null

  if (projectId) {
    path =
      `/projects/${encodeURIComponent(
        projectId,
      )}`

    if (
      typeof navigate ===
      "function"
    ) {
      navigate(path)
    }
  }

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "wood-booster:open-project-tab",
        {
          detail: {
            tab,
            projectId,
          },
        },
      ),
    )
  }

  const tabLabel =
    projectTabLabels[tab] ||
    tab

  return createResult({
    success: true,
    type: "open_project_tab",
    message:
      `Projektin välilehti "${tabLabel}" avattiin.`,
    path,
    action,
    data: {
      tab,
      tabLabel,
      projectId,
    },
  })
}


function createUpdateMessage(
  update,
) {
  if (
    update.status &&
    Object.keys(update).length === 1
  ) {
    return (
      `Projektin tilaksi vaihdettiin "${update.status}".`
    )
  }

  if (
    update.notes !== undefined &&
    Object.keys(update).length === 1
  ) {
    return (
      "Projektin muistiinpanot päivitettiin."
    )
  }

  if (
    update.name &&
    Object.keys(update).length === 1
  ) {
    return (
      `Projektin nimeksi vaihdettiin "${update.name}".`
    )
  }

  return (
    "Projektin tiedot päivitettiin onnistuneesti."
  )
}


export {
  executeProjectTool,
  supportsProjectAction,
}
