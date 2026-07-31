const allowedBasePaths = [
  "/",
  "/dashboard",
  "/projects",
  "/customers",
  "/agents",
  "/knowledge",
  "/memory",
  "/tools",
  "/settings",
]

function isSafeInternalPath(path) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    return false
  }

  return allowedBasePaths.some(
    (allowedPath) =>
      path === allowedPath ||
      (
        allowedPath !== "/" &&
        path.startsWith(
          `${allowedPath}/`,
        )
      ),
  )
}

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

function resolveProjectPath(action) {
  const projectId =
    action.projectId ||
    action.payload?.projectId ||
    action.payload?.id

  if (!projectId) {
    return null
  }

  return `/projects/${encodeURIComponent(
    projectId,
  )}`
}

function resolveCustomerPath(action) {
  const customerId =
    action.customerId ||
    action.payload?.customerId ||
    action.payload?.id

  if (!customerId) {
    return null
  }

  return `/customers/${encodeURIComponent(
    customerId,
  )}`
}

const simpleNavigationActions = {
  open_projects: {
    path: "/projects",
    message: "Projektit avattiin.",
  },

  open_customers: {
    path: "/customers",
    message: "Asiakkaat avattiin.",
  },

  open_knowledge: {
    path: "/knowledge",
    message: "Tietopankki avattiin.",
  },

  open_memory: {
    path: "/memory",
    message: "Muisti avattiin.",
  },

  open_tools: {
    path: "/tools",
    message: "Työkalut avattiin.",
  },

  open_settings: {
    path: "/settings",
    message: "Asetukset avattiin.",
  },
}

const supportedActionTypes = [
  "navigate",
  "open_project",
  "open_customer",
  ...Object.keys(
    simpleNavigationActions,
  ),
]

function supportsNavigationAction(
  actionType,
) {
  return supportedActionTypes.includes(
    actionType,
  )
}

async function executeNavigationTool({
  action,
  actionType,
  navigate,
}) {
  if (
    typeof navigate !== "function"
  ) {
    return createResult({
      success: false,
      type: "configuration_error",
      message:
        "Navigointitoimintoa ei ole määritetty.",
      action,
    })
  }

  if (actionType === "navigate") {
    const path =
      action.path ||
      action.payload?.path

    if (!isSafeInternalPath(path)) {
      return createResult({
        success: false,
        type: "blocked",
        message:
          "AI yritti avata estettyä tai virheellistä osoitetta.",
        path,
        action,
      })
    }

    navigate(path)

    return createResult({
      success: true,
      type: "navigate",
      message: `Avattiin näkymä ${path}.`,
      path,
      action,
    })
  }

  if (
    actionType === "open_project"
  ) {
    const path =
      resolveProjectPath(action)

    if (!path) {
      return createResult({
        success: false,
        type: "invalid",
        message:
          "Projektin tunniste puuttuu.",
        action,
      })
    }

    navigate(path)

    return createResult({
      success: true,
      type: "open_project",
      message:
        "Projektinäkymä avattiin.",
      path,
      action,
    })
  }

  if (
    actionType === "open_customer"
  ) {
    const path =
      resolveCustomerPath(action)

    if (!path) {
      return createResult({
        success: false,
        type: "invalid",
        message:
          "Asiakkaan tunniste puuttuu.",
        action,
      })
    }

    navigate(path)

    return createResult({
      success: true,
      type: "open_customer",
      message:
        "Asiakasnäkymä avattiin.",
      path,
      action,
    })
  }

  const navigationAction =
    simpleNavigationActions[
      actionType
    ]

  if (navigationAction) {
    navigate(
      navigationAction.path,
    )

    return createResult({
      success: true,
      type: actionType,
      message:
        navigationAction.message,
      path:
        navigationAction.path,
      action,
    })
  }

  return createResult({
    success: false,
    type: "unsupported",
    message: `Navigation Tool ei tue toimintoa: ${
      actionType ||
      "puuttuva tyyppi"
    }.`,
    action,
  })
}

export {
  executeNavigationTool,
  isSafeInternalPath,
  supportsNavigationAction,
}
