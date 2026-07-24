const RUNTIME_STORAGE_KEY =
  "woodBoosterRuntimeContext"


function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  return String(value).trim()
}


function safeObject(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {}
  }

  return value
}


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


function readStoredRuntimeContext() {
  try {
    const storedValue =
      window.localStorage.getItem(
        RUNTIME_STORAGE_KEY,
      )

    if (!storedValue) {
      return {}
    }

    return safeObject(
      JSON.parse(storedValue),
    )
  } catch (error) {
    console.error(
      "Runtime context read failed:",
      error,
    )

    return {}
  }
}


function writeStoredRuntimeContext(
  runtimeContext,
) {
  try {
    window.localStorage.setItem(
      RUNTIME_STORAGE_KEY,
      JSON.stringify(
        runtimeContext,
      ),
    )

    return true
  } catch (error) {
    console.error(
      "Runtime context write failed:",
      error,
    )

    return false
  }
}


function getCurrentLocation() {
  if (
    typeof window === "undefined"
  ) {
    return {
      pathname: "/",
      search: "",
      hash: "",
      href: "",
    }
  }

  return {
    pathname:
      cleanText(
        window.location.pathname,
      ) || "/",

    search:
      cleanText(
        window.location.search,
      ),

    hash:
      cleanText(
        window.location.hash,
      ),

    href:
      cleanText(
        window.location.href,
      ),
  }
}


function resolveRouteContext(
  pathname,
) {
  const path =
    cleanText(pathname) || "/"

  if (path === "/") {
    return {
      routeId: "dashboard",
      pageName: "Dashboard",
      pageType: "dashboard",
    }
  }

  if (
    path === "/projects"
  ) {
    return {
      routeId: "projects",
      pageName: "Projects",
      pageType: "project-list",
    }
  }

  if (
    path.startsWith(
      "/projects/",
    )
  ) {
    const projectId =
      path
        .replace(
          "/projects/",
          "",
        )
        .split("/")[0]

    return {
      routeId:
        "project-details",
      pageName:
        "Project Details",
      pageType:
        "project-details",
      resourceId:
        cleanText(projectId),
      resourceType:
        "project",
    }
  }

  if (
    path === "/customers"
  ) {
    return {
      routeId: "customers",
      pageName: "Customers",
      pageType: "customer-list",
    }
  }

  if (
    path.startsWith(
      "/customers/",
    )
  ) {
    const customerId =
      path
        .replace(
          "/customers/",
          "",
        )
        .split("/")[0]

    return {
      routeId:
        "customer-details",
      pageName:
        "Customer Details",
      pageType:
        "customer-details",
      resourceId:
        cleanText(customerId),
      resourceType:
        "customer",
    }
  }

  if (
    path === "/agents"
  ) {
    return {
      routeId: "agents",
      pageName: "AI Agents",
      pageType: "agent-management",
    }
  }

  if (
    path === "/knowledge"
  ) {
    return {
      routeId: "knowledge",
      pageName: "Knowledge",
      pageType: "knowledge-management",
    }
  }

  if (
    path === "/settings"
  ) {
    return {
      routeId: "settings",
      pageName: "Settings",
      pageType: "settings",
    }
  }

  if (
    path === "/inventory"
  ) {
    return {
      routeId: "inventory",
      pageName: "Inventory",
      pageType: "inventory",
    }
  }

  if (
    path === "/ai-brain" ||
    path === "/ai"
  ) {
    return {
      routeId: "ai-brain",
      pageName: "AI Brain",
      pageType: "ai-workspace",
    }
  }

  return {
    routeId: "unknown",
    pageName: "Unknown Page",
    pageType: "unknown",
  }
}


function getDefaultAvailableActions(
  routeContext,
) {
  const pageType =
    routeContext?.pageType

  const actionsByPage = {
    dashboard: [
      "open_projects",
      "open_customers",
      "open_agents",
      "open_knowledge",
    ],

    "project-list": [
      "create_project",
      "open_project",
      "list_projects",
    ],

    "project-details": [
      "update_project",
      "add_project_note",
      "open_project_tab",
      "calculate_project_costs",
      "generate_project_quote",
      "create_shopping_list",
    ],

    "customer-list": [
      "create_customer",
      "open_customer",
      "list_customers",
    ],

    "customer-details": [
      "update_customer",
      "list_customer_projects",
      "create_project_for_customer",
    ],

    "agent-management": [
      "list_agents",
      "inspect_agent",
      "open_agent",
    ],

    "knowledge-management": [
      "search_knowledge",
      "list_knowledge",
      "add_knowledge",
    ],

    settings: [
      "inspect_system_registry",
      "inspect_system_status",
    ],

    inventory: [
      "list_inventory",
      "add_inventory_item",
      "update_inventory_item",
      "create_purchase",
    ],

    "ai-workspace": [
      "send_ai_message",
      "inspect_memory",
      "inspect_knowledge",
      "inspect_agents",
      "inspect_tools",
    ],
  }

  return safeArray(
    actionsByPage[pageType],
  )
}


function createRuntimeContext(
  overrides = {},
) {
  const storedContext =
    readStoredRuntimeContext()

  const location =
    getCurrentLocation()

  const routeContext =
    resolveRouteContext(
      location.pathname,
    )

  const merged =
    {
      ...storedContext,
      ...safeObject(overrides),
    }

  const availableActions =
    safeArray(
      merged.availableActions,
    ).length > 0
      ? safeArray(
          merged.availableActions,
        )
      : getDefaultAvailableActions(
          routeContext,
        )

  return {
    version: "1.0.0",

    capturedAt:
      new Date().toISOString(),

    location,

    route: {
      ...routeContext,
      ...safeObject(
        merged.route,
      ),
    },

    activeProject:
      safeObject(
        merged.activeProject,
      ),

    activeCustomer:
      safeObject(
        merged.activeCustomer,
      ),

    activeTab:
      cleanText(
        merged.activeTab,
      ),

    selectedItems:
      safeArray(
        merged.selectedItems,
      ),

    availableActions,

    metadata:
      safeObject(
        merged.metadata,
      ),
  }
}


function updateRuntimeContext(
  updates = {},
) {
  const currentContext =
    createRuntimeContext()

  const nextContext = {
    ...currentContext,
    ...safeObject(updates),

    route: {
      ...safeObject(
        currentContext.route,
      ),
      ...safeObject(
        updates.route,
      ),
    },

    activeProject:
      updates.activeProject === null
        ? {}
        : {
            ...safeObject(
              currentContext.activeProject,
            ),
            ...safeObject(
              updates.activeProject,
            ),
          },

    activeCustomer:
      updates.activeCustomer === null
        ? {}
        : {
            ...safeObject(
              currentContext.activeCustomer,
            ),
            ...safeObject(
              updates.activeCustomer,
            ),
          },

    metadata: {
      ...safeObject(
        currentContext.metadata,
      ),
      ...safeObject(
        updates.metadata,
      ),
    },

    capturedAt:
      new Date().toISOString(),
  }

  writeStoredRuntimeContext(
    nextContext,
  )

  return nextContext
}


function setActiveProject(
  project,
) {
  return updateRuntimeContext({
    activeProject:
      safeObject(project),
  })
}


function clearActiveProject() {
  return updateRuntimeContext({
    activeProject: null,
  })
}


function setActiveCustomer(
  customer,
) {
  return updateRuntimeContext({
    activeCustomer:
      safeObject(customer),
  })
}


function clearActiveCustomer() {
  return updateRuntimeContext({
    activeCustomer: null,
  })
}


function setActiveTab(
  activeTab,
) {
  return updateRuntimeContext({
    activeTab:
      cleanText(activeTab),
  })
}


function setAvailableActions(
  actions,
) {
  return updateRuntimeContext({
    availableActions:
      safeArray(actions)
        .map(cleanText)
        .filter(Boolean),
  })
}


function clearRuntimeContext() {
  try {
    window.localStorage.removeItem(
      RUNTIME_STORAGE_KEY,
    )

    return true
  } catch (error) {
    console.error(
      "Runtime context clear failed:",
      error,
    )

    return false
  }
}


export {
  clearActiveCustomer,
  clearActiveProject,
  clearRuntimeContext,
  createRuntimeContext,
  getCurrentLocation,
  readStoredRuntimeContext,
  resolveRouteContext,
  setActiveCustomer,
  setActiveProject,
  setActiveTab,
  setAvailableActions,
  updateRuntimeContext,
}
