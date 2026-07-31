const capabilityManifest = [
  {
    id: "workspace_navigation",
    name: "Workspace Navigation",
    description:
      "Mahdollistaa Wood-Booster OS:n sisäisissä näkymissä liikkumisen.",
    enabled: true,
    tools: [
      "navigation",
    ],
    actions: [
      "navigate",
      "open_project",
      "open_customer",
      "open_projects",
      "open_customers",
      "open_knowledge",
      "open_memory",
      "open_tools",
      "open_settings",
    ],
  },

  {
    id: "project_management",
    name: "Project Management",
    description:
      "Mahdollistaa projektien luomisen, päivittämisen ja projektitoimintojen suorittamisen.",
    enabled: true,
    tools: [
      "projects",
      "navigation",
    ],
    actions: [
      "create_project",
      "update_project",
      "open_project",
      "open_projects",
      "open_project_tab",
    ],
  },

  {
    id: "customer_management",
    name: "Customer Management",
    description:
      "Mahdollistaa asiakkaiden luomisen ja asiakastoimintojen suorittamisen.",
    enabled: true,
    tools: [
      "customers",
      "navigation",
    ],
    actions: [
      "create_customer",
      "open_customer",
      "open_customers",
    ],
  },
]


function getCapabilityManifest() {
  return capabilityManifest.map(
    (capability) => ({
      ...capability,

      tools: [
        ...capability.tools,
      ],

      actions: [
        ...capability.actions,
      ],
    }),
  )
}


function getEnabledCapabilities() {
  return getCapabilityManifest().filter(
    (capability) =>
      capability.enabled,
  )
}


function findCapabilityById(
  capabilityId,
) {
  const normalizedCapabilityId =
    String(capabilityId || "")
      .trim()
      .toLowerCase()

  return (
    getEnabledCapabilities().find(
      (capability) =>
        capability.id ===
        normalizedCapabilityId,
    ) || null
  )
}


function findCapabilityByAction(
  actionType,
) {
  const normalizedActionType =
    String(actionType || "")
      .trim()
      .toLowerCase()

  return (
    getEnabledCapabilities().find(
      (capability) =>
        capability.actions.includes(
          normalizedActionType,
        ),
    ) || null
  )
}


export {
  capabilityManifest,
  findCapabilityByAction,
  findCapabilityById,
  getCapabilityManifest,
  getEnabledCapabilities,
}
