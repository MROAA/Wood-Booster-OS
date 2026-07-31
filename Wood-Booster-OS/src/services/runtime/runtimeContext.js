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

  if (
    path === "/"
  ) {
    return {
      routeId:
        "ai-workspace",

      pageName:
        "AI Workspace",

      pageType:
        "ai-workspace",
    }
  }

  if (
    path === "/dashboard"
  ) {
    return {
      routeId:
        "dashboard",

      pageName:
        "Dashboard",

      pageType:
        "dashboard",
    }
  }

  if (
    path === "/system"
  ) {
    return {
      routeId:
        "system-center",

      pageName:
        "System Center",

      pageType:
        "system-center",
    }
  }

  if (
    path === "/projects"
  ) {
    return {
      routeId:
        "projects",

      pageName:
        "Projects",

      pageType:
        "project-list",
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
      routeId:
        "customers",

      pageName:
        "Customers",

      pageType:
        "customer-list",
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
    path === "/knowledge"
  ) {
    return {
      routeId:
        "knowledge",

      pageName:
        "Knowledge",

      pageType:
        "knowledge-management",
    }
  }

  if (
    path === "/memory"
  ) {
    return {
      routeId:
        "memory",

      pageName:
        "Memory",

      pageType:
        "memory-management",
    }
  }

  if (
    path === "/capabilities"
  ) {
    return {
      routeId:
        "capabilities",

      pageName:
        "Capability Center",

      pageType:
        "capability-center",
    }
  }

  if (
    path === "/execution"
  ) {
    return {
      routeId:
        "execution",

      pageName:
        "Execution Center",

      pageType:
        "execution-center",
    }
  }

  if (
    path === "/tools"
  ) {
    return {
      routeId:
        "tools",

      pageName:
        "Tools",

      pageType:
        "tools",
    }
  }

  if (
    path === "/settings"
  ) {
    return {
      routeId:
        "settings",

      pageName:
        "Settings",

      pageType:
        "settings",
    }
  }

  if (
    path === "/agents"
  ) {
    return {
      routeId:
        "agents",

      pageName:
        "AI Agents",

      pageType:
        "agent-management",
    }
  }

  if (
    path === "/inventory"
  ) {
    return {
      routeId:
        "inventory",

      pageName:
        "Inventory",

      pageType:
        "inventory",
    }
  }

  if (
    path === "/brain" ||
    path === "/ai-brain" ||
    path === "/ai"
  ) {
    return {
      routeId:
        "ai-workspace",

      pageName:
        "AI Workspace",

      pageType:
        "ai-workspace",
    }
  }

  return {
    routeId:
      "unknown",

    pageName:
      "Unknown Page",

    pageType:
      "unknown",
  }
}


function getDefaultAvailableActions(
  routeContext,
) {
  const pageType =
    routeContext?.pageType

  const actionsByPage = {
    "ai-workspace": [
      "send_ai_message",
      "run_workflow",
      "inspect_execution",
      "inspect_memory",
      "inspect_knowledge",
      "inspect_agents",
      "inspect_tools",
    ],

    dashboard: [
      "open_projects",
      "open_customers",
      "open_system_center",
      "inspect_dashboard",
    ],

    "system-center": [
      "inspect_system_status",
      "inspect_ai_activity",
      "inspect_notifications",
      "inspect_execution",
      "inspect_agents",
      "inspect_memory",
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

    "memory-management": [
      "list_memories",
      "inspect_memory",
      "search_memory",
    ],

    "capability-center": [
      "list_capabilities",
      "inspect_capability",
      "inspect_system_registry",
    ],

    "execution-center": [
      "list_executions",
      "inspect_execution",
      "run_workflow",
      "inspect_action_queue",
    ],

    tools: [
      "list_tools",
      "inspect_tool",
      "run_tool",
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

  const overrideContext =
    safeObject(overrides)

  const merged = {
    ...storedContext,
    ...overrideContext,
  }

  const hasActionOverride =
    Object.prototype.hasOwnProperty.call(
      overrideContext,
      "availableActions",
    )

  const availableActions =
    hasActionOverride
      ? safeArray(
          overrideContext.availableActions,
        )
      : getDefaultAvailableActions(
          routeContext,
        )

  return {
    version:
      "1.0.0",

    capturedAt:
      new Date().toISOString(),

    location,

    route: {
      ...routeContext,
      ...safeObject(
        overrideContext.route,
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

  const updateValues =
    safeObject(updates)

  const nextContext = {
    ...currentContext,
    ...updateValues,

    route: {
      ...safeObject(
        currentContext.route,
      ),

      ...safeObject(
        updateValues.route,
      ),
    },

    activeProject:
      updateValues.activeProject === null
        ? {}
        : {
            ...safeObject(
              currentContext.activeProject,
            ),

            ...safeObject(
              updateValues.activeProject,
            ),
          },

    activeCustomer:
      updateValues.activeCustomer === null
        ? {}
        : {
            ...safeObject(
              currentContext.activeCustomer,
            ),

            ...safeObject(
              updateValues.activeCustomer,
            ),
          },

    availableActions:
      Object.prototype.hasOwnProperty.call(
        updateValues,
        "availableActions",
      )
        ? safeArray(
            updateValues.availableActions,
          )
        : getDefaultAvailableActions(
            safeObject(
              updateValues.route,
            ).pageType
              ? safeObject(
                  updateValues.route,
                )
              : safeObject(
                  currentContext.route,
                ),
          ),

    metadata: {
      ...safeObject(
        currentContext.metadata,
      ),

      ...safeObject(
        updateValues.metadata,
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
    activeProject:
      null,
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
    activeCustomer:
      null,
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
