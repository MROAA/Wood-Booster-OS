/*
WOOD-BOOSTER HQ

SYSTEM PULSE SUMMARY

Fail-safe summary layer.

Periaate:
- frontend saa aina luettavan vastauksen
- puuttuva komponentti ei kaada summarya
- Installer V2 -virhe ei kaada System Pulsea
*/

import {
  getSystemPulse,
} from "./systemPulseService.js"

import {
  getInstallerV2,
} from "../../../systemInstaller/installerV2.js"


function safeInstaller() {
  try {
    return getInstallerV2()
  }
  catch (error) {
    console.error(
      "[SystemPulse] Installer V2 check failed:",
      error,
    )

    return {
      status: "error",
      available: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    }
  }
}


function safeObject(value) {
  if (
    value &&
    typeof value === "object"
  ) {
    return value
  }

  return {}
}


async function getSystemPulseSummary() {
  const pulse =
    await getSystemPulse()

  const components =
    safeObject(pulse?.components)

  const installer =
    safeInstaller()

  const capability =
    safeObject(components.capability)

  const capabilitySummary =
    safeObject(capability.summary)

  const runtime =
    safeObject(components.runtime)

  const modules =
    safeObject(components.modules)

  const security =
    safeObject(components.security)

  const securityHealth =
    safeObject(components.securityHealth)

  const hardware =
    safeObject(components.hardware)

  const git =
    safeObject(components.git)

  const gitSync =
    safeObject(components.gitSync)

  const gitWatcher =
    safeObject(components.gitWatcher)

  const gitHistory =
    safeObject(components.gitHistory)

  const gitSummary =
    safeObject(components.gitSummary)

  const healthScore =
    safeObject(components.healthScore)

  const lastKnownGood =
    safeObject(components.lastKnownGood)

  const moduleTotal =
    Number.isFinite(modules.total)
      ? modules.total
      : 0

  const moduleActive =
    Number.isFinite(modules.active)
      ? modules.active
      : 0

  return {
    system:
      pulse?.system ??
      "Wood-Booster HQ",

    service:
      pulse?.service ??
      "System Pulse",

    mode:
      pulse?.mode ??
      "fail-safe",

    status:
      pulse?.status ??
      "unknown",

    healthy:
      pulse?.healthy === true,

    recoveryAvailable:
      pulse?.recoveryAvailable === true,

    diagnostics:
      safeObject(pulse?.diagnostics),

    summary: {
      system:
        pulse?.system ??
        "Wood-Booster HQ",

      installer,

      healthScore: {
        score:
          Number.isFinite(healthScore.score)
            ? healthScore.score
            : 0,

        status:
          healthScore.status ??
          "unknown",

        details:
          Array.isArray(healthScore.details)
            ? healthScore.details
            : [],
      },

      modules: {
        total:
          moduleTotal,

        active:
          moduleActive,

        status:
          modules.status === "error"
            ? "error"
            : moduleTotal > 0 &&
              moduleActive === moduleTotal
              ? "healthy"
              : "degraded",
      },

      capability: {
        approved:
          capabilitySummary.approved ?? 0,

        blocked:
          capabilitySummary.blocked ?? 0,

        approvalRequired:
          capabilitySummary.approvalRequired ?? 0,

        status:
          capability.status ?? "unknown",
      },

      security: {
        status:
          securityHealth.status ??
          security.status ??
          "unknown",

        blockedEvents:
          securityHealth.blockedEvents ?? 0,

        approvalRequired:
          securityHealth.approvalRequired ?? 0,

        message:
          securityHealth.message ?? "",
      },

      environment: {
        os:
          runtime.platform ?? "-",

        kernel:
          hardware.kernel ?? "-",

        host:
          hardware.hostname ?? "-",
      },

      hardware: {
        cpu:
          hardware.cpu ?? null,

        gpu:
          hardware.gpu ?? null,

        memory:
          hardware.memory ?? null,

        status:
          hardware.status ?? "unknown",
      },

      runtime: {
        platform:
          runtime.platform ?? "-",

        nodeVersion:
          runtime.nodeVersion ?? "-",

        cpuCount:
          runtime.cpuCount ?? 0,

        status:
          runtime.status ?? "unknown",
      },

      git: {
        repository:
          git.repository ?? "-",

        branch:
          git.branch ?? "-",

        commit:
          git.commit ?? "-",

        status:
          git.status ?? "unknown",
      },

      gitSync: {
        status:
          gitSync.status ?? "unknown",

        changes:
          gitSync.changes ?? 0,
      },

      gitWatcher: {
        status:
          gitWatcher.status ?? "stopped",
      },

      gitHistory: {
        total:
          gitHistory.total ?? 0,

        events:
          Array.isArray(gitHistory.events)
            ? gitHistory.events
            : [],
      },

      gitSummary,

      lastKnownGood: {
        available:
          lastKnownGood.available === true,

        status:
          lastKnownGood.status ?? "unknown",

        latestStableBuild:
          lastKnownGood.latestStableBuild ?? null,
      },
    },

    components,

    checkedAt:
      pulse?.checkedAt ??
      new Date().toISOString(),
  }
}


export {
  getSystemPulseSummary,
}
