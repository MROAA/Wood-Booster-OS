import {
  getAgentManifest,
} from "../agents/agentManifest"

import {
  getCapabilityManifest,
} from "../capabilities/capabilityManifest"

import {
  getToolHealthReport,
} from "../tools/toolHealth"


const systemMetadata = {
  id: "wood-booster-os",
  name: "Wood-Booster AI Operating System",
  version: "0.1.0-mvp",
  environment: "local",
  frontend: "React + Vite",
  backend: "Node.js + Express",
  database: "SQLite + Prisma",
  aiRuntime: "Ollama",
  aiModel: "Qwen 2.5",
}


const systemRoutes = [
  {
    id: "workspace",
    name: "AI Workspace",
    path: "/",
    category: "workspace",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    category: "workspace",
  },
  {
    id: "projects",
    name: "Projects",
    path: "/projects",
    category: "workspace",
  },
  {
    id: "customers",
    name: "Customers",
    path: "/customers",
    category: "workspace",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    path: "/knowledge",
    category: "system",
  },
  {
    id: "memory",
    name: "Memory",
    path: "/memory",
    category: "system",
  },
  {
    id: "capabilities",
    name: "Capability Center",
    path: "/capabilities",
    category: "system",
  },
  {
    id: "execution",
    name: "Execution Center",
    path: "/execution",
    category: "system",
  },
  {
    id: "tools",
    name: "Tools Center",
    path: "/tools",
    category: "system",
  },
  {
    id: "settings",
    name: "Settings",
    path: "/settings",
    category: "system",
  },
]


function cloneRoutes() {
  return systemRoutes.map(
    (route) => ({
      ...route,
    }),
  )
}


function getSystemRegistry() {
  const agents =
    getAgentManifest()

  const capabilities =
    getCapabilityManifest()

  const toolReport =
    getToolHealthReport()

  const routes =
    cloneRoutes()

  const activeAgents =
    agents.filter(
      (agent) =>
        agent.status === "ACTIVE",
    )

  const enabledCapabilities =
    capabilities.filter(
      (capability) =>
        capability.enabled,
    )

  const healthyCapabilities =
    enabledCapabilities.filter(
      (capability) =>
        capability.healthy !== false,
    )

  const enabledTools =
    toolReport.tools.filter(
      (tool) =>
        tool.enabled,
    )

  const healthyTools =
    enabledTools.filter(
      (tool) =>
        tool.healthy,
    )

  const actions =
    [
      ...new Set(
        toolReport.tools.flatMap(
          (tool) =>
            tool.actions,
        ),
      ),
    ]

  const truthSources =
    [
      ...new Set(
        agents.flatMap(
          (agent) =>
            agent.truthSources,
        ),
      ),
    ]

  const healthy =
    toolReport.summary.unhealthy === 0

  return {
    metadata: {
      ...systemMetadata,
    },

    status: {
      health:
        healthy
          ? "healthy"
          : "degraded",
      healthy,
      mode: "local",
      aiRuntime: "ready",
    },

    agents,

    capabilities,

    tools:
      toolReport.tools,

    routes,

    actions,

    truthSources,

    summary: {
      agents: agents.length,
      activeAgents:
        activeAgents.length,

      capabilities:
        capabilities.length,
      enabledCapabilities:
        enabledCapabilities.length,
      healthyCapabilities:
        healthyCapabilities.length,

      tools:
        toolReport.summary.total,
      enabledTools:
        enabledTools.length,
      healthyTools:
        healthyTools.length,
      unhealthyTools:
        toolReport.summary.unhealthy,

      routes:
        routes.length,
      actions:
        actions.length,
      truthSources:
        truthSources.length,
    },
  }
}


function findSystemRouteByPath(
  path,
) {
  const normalizedPath =
    String(path || "").trim()

  return (
    cloneRoutes().find(
      (route) =>
        route.path ===
        normalizedPath,
    ) || null
  )
}


function findSystemRouteById(
  id,
) {
  const normalizedId =
    String(id || "")
      .trim()
      .toLowerCase()

  return (
    cloneRoutes().find(
      (route) =>
        route.id ===
        normalizedId,
    ) || null
  )
}


function getSystemSummary() {
  const registry =
    getSystemRegistry()

  return {
    metadata:
      registry.metadata,
    status:
      registry.status,
    summary:
      registry.summary,
  }
}


export {
  findSystemRouteById,
  findSystemRouteByPath,
  getSystemRegistry,
  getSystemSummary,
  systemMetadata,
  systemRoutes,
}
