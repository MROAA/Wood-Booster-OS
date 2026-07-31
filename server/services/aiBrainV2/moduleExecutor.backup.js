/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE EXECUTOR

Vastuut:
- hakee rekisteröidyn moduulin ID:llä
- tarkistaa moduulin olemassaolon
- tarkistaa moduulin aktiivisuuden
- suorittaa valitun moduulin
- palauttaa yhtenäisen tuloksen

Tämä tiedosto ei:
- reititä käyttäjän viestiä
- vertaile moduuleja
- rekisteröi moduuleja
- muodosta Reasoning-analyysiä
- tee Decision-päätöstä
=====================================
*/


import {
  getBrainModule,
} from "./moduleRegistry.js"

import {
  normalizeModuleId,
} from "./moduleContract.js"


function createModuleNotFoundResult({
  moduleId,
}) {
  return {
    success:
      false,

    status:
      "module_not_found",

    module:
      null,

    output:
      null,

    error: {
      code:
        "MODULE_NOT_FOUND",

      message:
        `AI Brain -moduulia "${moduleId}" ei löytynyt.`,
    },
  }
}


function createModuleDisabledResult({
  moduleDefinition,
}) {
  return {
    success:
      false,

    status:
      "module_disabled",

    module: {
      id:
        moduleDefinition.id,

      name:
        moduleDefinition.name,

      version:
        moduleDefinition.version,
    },

    output:
      null,

    error: {
      code:
        "MODULE_DISABLED",

      message:
        `AI Brain -moduuli "${moduleDefinition.id}" ei ole käytössä.`,
    },
  }
}


function createCompletedResult({
  moduleDefinition,
  output,
}) {
  return {
    success:
      true,

    status:
      "completed",

    module: {
      id:
        moduleDefinition.id,

      name:
        moduleDefinition.name,

      version:
        moduleDefinition.version,
    },

    output,

    error:
      null,
  }
}


function createExecutionErrorResult({
  moduleDefinition,
  error,
}) {
  return {
    success:
      false,

    status:
      "execution_error",

    module: {
      id:
        moduleDefinition.id,

      name:
        moduleDefinition.name,

      version:
        moduleDefinition.version,
    },

    output:
      null,

    error: {
      code:
        "MODULE_EXECUTION_FAILED",

      message:
        error instanceof Error
          ? error.message
          : String(error),
    },
  }
}


async function executeBrainModuleById({
  moduleId,
  message,
  request,
  runtimeContext = {},
  route = null,
} = {}) {
  const normalizedModuleId =
    normalizeModuleId(
      moduleId,
    )

  const moduleDefinition =
    getBrainModule(
      normalizedModuleId,
    )

  if (!moduleDefinition) {
    return createModuleNotFoundResult({
      moduleId:
        normalizedModuleId ||
        String(moduleId || ""),
    })
  }

  if (
    moduleDefinition.enabled ===
    false
  ) {
    return createModuleDisabledResult({
      moduleDefinition,
    })
  }

  try {
    const output =
      await moduleDefinition.execute({
        message:
          String(
            message ||
            request?.message ||
            "",
          ).trim(),

        request:
          request || {
            requestId:
              runtimeContext.requestId ||
              null,

            message:
              String(message || "")
                .trim(),
          },

        runtimeContext,

        route:
          route || {
            confidence:
              1,

            reason:
              "Moduuli valittiin suoraan ID:n perusteella.",

            metadata: {
              directExecution:
                true,
            },
          },
      })

    return createCompletedResult({
      moduleDefinition,
      output,
    })
  } catch (error) {
    return createExecutionErrorResult({
      moduleDefinition,
      error,
    })
  }
}


export {
  executeBrainModuleById,
}
