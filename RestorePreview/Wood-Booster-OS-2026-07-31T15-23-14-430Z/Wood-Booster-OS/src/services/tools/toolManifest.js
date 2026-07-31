const toolManifest = [
  {
    id: "navigation",
    name: "Navigation Tool",
    description:
      "Avaa Wood-Booster OS:n sisäisiä näkymiä.",
    enabled: true,
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
    id: "projects",
    name: "Project Tool",
    description:
      "Luo projekteja ja hallitsee aktiivisen projektin toimintoja.",
    enabled: true,
    actions: [
      "create_project",
      "update_project",
      "open_project_tab",
    ],
  },

  {
    id: "customers",
    name: "Customer Tool",
    description:
      "Luo ja hallitsee asiakkaisiin liittyviä toimintoja.",
    enabled: true,
    actions: [
      "create_customer",
    ],
  },
]


function getToolManifest() {
  return toolManifest.map(
    (tool) => ({
      ...tool,
      actions: [
        ...tool.actions,
      ],
    }),
  )
}


function getEnabledTools() {
  return getToolManifest().filter(
    (tool) => tool.enabled,
  )
}


function findToolByAction(
  actionType,
) {
  const normalizedActionType =
    String(actionType || "")
      .trim()
      .toLowerCase()

  return (
    getEnabledTools().find(
      (tool) =>
        tool.actions.includes(
          normalizedActionType,
        ),
    ) || null
  )
}


export {
  findToolByAction,
  getEnabledTools,
  getToolManifest,
  toolManifest,
}
