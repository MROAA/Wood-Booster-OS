/*
WOOD-BOOSTER HQ

SYSTEM PULSE SERVICE

Fail-safe System Pulse Core.

Periaate:

- yksittäinen komponentti ei saa kaataa System Pulsea
- jokainen tarkistus suoritetaan eristetysti
- virhe palautetaan komponentin omana tilana
- System Pulse pysyy käytettävissä myös osittaisessa vikatilassa
*/

import {
  ensureDefaultBrainModules,
} from "../../index.js"


import {
  getCapabilityHealth,
} from "../capabilityExecution/capabilityHealth.js"


import {
  getRuntimePulse,
} from "./runtimePulse.js"


import {
  getRuntimeIdentity,
} from "./runtimeIdentity.js"


import {
  getModulePulse,
} from "./modulePulse.js"


import {
  getHardwareIdentity,
} from "./hardwareIdentity.js"


import {
  getGitIdentity,
} from "./gitIdentity.js"


import {
  getGitSyncStatus,
} from "./gitSyncMonitor.js"


import {
  getGitSyncWatcherStatus,
} from "./gitSyncWatcher.js"


import {
  getGitSyncHistory,
} from "./gitSyncHistory.js"


import {
  getGitSyncSummary,
} from "./gitSyncSummary.js"


import {
  getSecurityPulseStatus,
  getSecurityHealth,
} from "./securityMonitor.js"


import {
  calculateHealthScore,
} from "./healthScore.js"


import {
  getRecoveryStatus,
} from "./recoveryManager.js"


import {
  getStableBuildStatus,
} from "./buildGuardian.js"


import {
  getPythonSpacemonkeyStatus,
} from "./pythonSpacemonkeyStatus.js"



function createFailureComponent(
  component,
  error,
) {

  return {

    status:
      "error",

    healthy:
      false,

    available:
      false,

    component,

    error: {

      message:
        error instanceof Error
          ? error.message
          : String(error),

    },

    checkedAt:
      new Date().toISOString(),

  }

}



async function safeCheck(
  component,
  operation,
) {

  try {

    const value =
      await operation()


    if (
      value === undefined ||
      value === null
    ) {

      return createFailureComponent(
        component,
        new Error(
          `${component} returned no data`,
        ),
      )

    }


    return value

  }
  catch(error) {

    console.error(
      `[SystemPulse] ${component} check failed:`,
      error,
    )


    return createFailureComponent(
      component,
      error,
    )

  }

}



function isComponentFailure(
  component,
) {

  return (

    component?.status === "error"

    ||

    (
      component?.healthy === false &&
      component?.available === false
    )

  )

}



async function getSystemPulse(){

  const initialization =
    await safeCheck(
      "brainModules",
      () =>
        ensureDefaultBrainModules(),
    )


  const capability =
    await safeCheck(
      "capability",
      () =>
        getCapabilityHealth(),
    )


  const runtime =
    await safeCheck(
      "runtime",
      () =>
        getRuntimePulse(),
    )


  const identity =
    await safeCheck(
      "identity",
      () =>
        getRuntimeIdentity(),
    )


  const modules =
    await safeCheck(
      "modules",
      () =>
        getModulePulse(),
    )


  const hardware =
    await safeCheck(
      "hardware",
      () =>
        getHardwareIdentity(),
    )


  const git =
    await safeCheck(
      "git",
      () =>
        getGitIdentity(),
    )


  const gitSync =
    await safeCheck(
      "gitSync",
      () =>
        getGitSyncStatus(),
    )


  const gitWatcher =
    await safeCheck(
      "gitWatcher",
      () =>
        getGitSyncWatcherStatus(),
    )


  const gitHistory =
    await safeCheck(
      "gitHistory",
      () =>
        getGitSyncHistory(),
    )


  const gitSummary =
    await safeCheck(
      "gitSummary",
      () =>
        getGitSyncSummary(),
    )


  const security =
    await safeCheck(
      "security",
      () =>
        getSecurityPulseStatus(),
    )


  const securityHealth =
    await safeCheck(
      "securityHealth",
      () =>
        getSecurityHealth(),
    )


  const recovery =
    await safeCheck(
      "recovery",
      () =>
        getRecoveryStatus(),
    )


  const lastKnownGood =
    await safeCheck(
      "lastKnownGood",
      () =>
        getStableBuildStatus(),
    )


  const pythonSpacemonkey =
    await safeCheck(
      "pythonSpacemonkey",
      () =>
        getPythonSpacemonkeyStatus(),
    )


  const healthScore =
    await safeCheck(
      "healthScore",
      () =>
        calculateHealthScore({

          modules,

          capability:
            capability?.summary ?? {},


          security:
            securityHealth,


          hardware,

          runtime,

          git,

        }),
    )



  const components = {

    initialization,

    capability,

    runtime,

    identity,

    hardware,

    modules,

    git,

    gitSync,

    gitWatcher,

    gitHistory,

    gitSummary,

    security,

    securityHealth,

    recovery,

    lastKnownGood,

    pythonSpacemonkey,

    healthScore,

  }



  const failedComponents =
    Object.entries(components)

      .filter(
        ([, component]) =>
          isComponentFailure(component),
      )

      .map(
        ([name]) =>
          name,
      )



  const totalComponents =
    Object.keys(components).length



  const failedCount =
    failedComponents.length



  const healthy =
    failedCount === 0



  let status =
    "healthy"



  if (
    failedCount > 0 &&
    failedCount < totalComponents
  ) {

    status =
      "degraded"

  }



  if (
    failedCount === totalComponents
  ) {

    status =
      "critical"

  }



  return {

    system:
      "Wood-Booster HQ",


    service:
      "System Pulse",


    mode:
      "fail-safe",


    status,


    healthy,


    recoveryAvailable:
      recovery?.canRestore === true,


    diagnostics: {

      totalComponents,


      healthyComponents:
        totalComponents -
        failedCount,


      failedComponents:
        failedCount,


      failures:
        failedComponents,

    },


    components,


    checkedAt:
      new Date().toISOString(),

  }

}



export {

  getSystemPulse,

}
