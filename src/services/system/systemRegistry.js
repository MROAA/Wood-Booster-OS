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
  id: "wood-booster-hq",
  name: "Wood-Booster AI Operating System",
  version: "0.1.0-mvp",
  environment: "local",
  frontend: "React + Vite",
  backend: "Node.js + Express",
  database: "SQLite + Prisma",
  aiRuntime: "Ollama",
  aiModel: "Qwen 2.5",
}


/*
Vastaa src/App.jsx:n oikeaa <Route>-listaa. Aiempi versio oli jäänyt
jälkeen ajasta (mm. /dashboard-polkua ei ole enää olemassa, "/" on
oikea Dashboard-reitti - ks. src/pages/Dashboard.jsx - ja iso joukko
uudempia sivuja puuttui kokonaan, kuten /desktop).
*/
const systemRoutes = [
  { id: "dashboard", name: "Dashboard", path: "/", category: "workspace" },
  { id: "projects", name: "Projektit", path: "/projects", category: "workspace" },
  { id: "customers", name: "Asiakkaat", path: "/customers", category: "workspace" },
  { id: "inventory", name: "Varasto", path: "/inventory", category: "workspace" },
  { id: "purchases", name: "Ostot", path: "/purchases", category: "workspace" },
  { id: "invoices", name: "Laskut", path: "/invoices", category: "workspace" },
  { id: "quotes", name: "Tarjoukset", path: "/quotes", category: "workspace" },
  { id: "knowledge", name: "Knowledge", path: "/knowledge", category: "system" },
  { id: "memory", name: "Memory", path: "/memory", category: "system" },
  { id: "agents", name: "Agents", path: "/agents", category: "system" },
  { id: "system-pulse", name: "System Pulse", path: "/system-pulse", category: "system" },
  { id: "spacemonkey-brain", name: "Spacemonkey Brain", path: "/spacemonkey-brain", category: "spacemonkey" },
  { id: "spacemonkey-diagnostics", name: "Spacemonkey Diagnostics", path: "/spacemonkey-diagnostics", category: "spacemonkey" },
  { id: "spacemonkey", name: "Spacemonkey", path: "/spacemonkey", category: "spacemonkey" },
  { id: "spacemonkey-chat", name: "Spacemonkey Chat", path: "/spacemonkey-chat", category: "spacemonkey" },
  { id: "altrako", name: "Altrako", path: "/altrako", category: "spacemonkey" },
  { id: "project-workspace", name: "Projektityötila", path: "/project-workspace", category: "workspace" },
  { id: "settings", name: "Asetukset", path: "/settings", category: "system" },
  { id: "ai-chat", name: "AI Chat", path: "/ai-chat", category: "system" },
  { id: "ai-generator", name: "AI Generator", path: "/ai-generator", category: "system" },
  { id: "capabilities", name: "Capability Center", path: "/capabilities", category: "system" },
  { id: "execution", name: "Execution Center", path: "/execution", category: "system" },
  { id: "tools", name: "Tools Center", path: "/tools", category: "system" },
  { id: "dev-studio", name: "Dev Studio", path: "/dev-studio", category: "system" },
  { id: "spider-solitaire", name: "Spider-pasianssi", path: "/spider-solitaire", category: "workspace" },
  { id: "desktop", name: "Työpöytä", path: "/desktop", category: "workspace" },
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


/*
Muotoilee getSystemRegistry():n tuloksen sellaiseksi kuin
server/services/systemContextKnowledge.js:n normalizeSystemContext()
sen odottaa (system.id/name/version/environment/status/mode - ei
metadata+status kahtena erillisenä lohkona niin kuin
getSystemRegistry() palauttaa). Backendillä on ollut tämä
tietomuoto valmiina koko ajan (createSystemContextKnowledge otetaan
käyttöön heti kun runAgentChat() saa systemContext-kentän), mutta
mikään frontendin osa ei koskaan lähettänyt sitä - tämä on se
puuttuva lähde.
*/
function getSystemContextPayload() {
  const registry =
    getSystemRegistry()

  return {
    system: {
      id: registry.metadata.id,
      name: registry.metadata.name,
      version: registry.metadata.version,
      environment: registry.metadata.environment,
      status: registry.status.health,
      mode: registry.status.mode,
    },

    agents:
      registry.agents,

    capabilities:
      registry.capabilities,

    tools:
      registry.tools,

    routes:
      registry.routes,

    actions:
      registry.actions,

    truthSources:
      registry.truthSources,

    summary:
      registry.summary,
  }
}


export {
  findSystemRouteById,
  findSystemRouteByPath,
  getSystemContextPayload,
  getSystemRegistry,
  getSystemSummary,
  systemMetadata,
  systemRoutes,
}
