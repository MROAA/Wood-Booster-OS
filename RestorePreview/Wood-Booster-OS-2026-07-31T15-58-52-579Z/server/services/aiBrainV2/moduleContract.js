/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE CONTRACT

Tämä tiedosto määrittää yhteisen
rakenteen kaikille AI Brain -moduuleille.

Se ei:
- reititä viestejä
- suorita moduuleja
- käytä tietokantaa
- kutsu kielimallia
=====================================
*/


const DEFAULT_MODULE_VERSION =
  "1.0.0"

const DEFAULT_MODULE_PRIORITY =
  100


function normalizeModuleId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}


function normalizeModuleName(
  value,
  fallback,
) {
  const name =
    String(value || "")
      .trim()

  return name || fallback
}


function normalizeModuleVersion(value) {
  const version =
    String(value || "")
      .trim()

  return (
    version ||
    DEFAULT_MODULE_VERSION
  )
}


function normalizeModulePriority(value) {
  const priority =
    Number(value)

  if (!Number.isFinite(priority)) {
    return DEFAULT_MODULE_PRIORITY
  }

  return priority
}


function validateBrainModule(
  moduleDefinition,
) {
  if (
    !moduleDefinition ||
    typeof moduleDefinition !==
      "object" ||
    Array.isArray(moduleDefinition)
  ) {
    throw new TypeError(
      "AI Brain -moduulin täytyy olla objekti.",
    )
  }

  const id =
    normalizeModuleId(
      moduleDefinition.id,
    )

  if (!id) {
    throw new Error(
      "AI Brain -moduulilta puuttuu kelvollinen id.",
    )
  }

  if (
    typeof moduleDefinition.canHandle !==
    "function"
  ) {
    throw new TypeError(
      `AI Brain -moduulilta "${id}" puuttuu canHandle-funktio.`,
    )
  }

  if (
    typeof moduleDefinition.execute !==
    "function"
  ) {
    throw new TypeError(
      `AI Brain -moduulilta "${id}" puuttuu execute-funktio.`,
    )
  }

  return {
    ...moduleDefinition,

    id,

    name:
      normalizeModuleName(
        moduleDefinition.name,
        id,
      ),

    version:
      normalizeModuleVersion(
        moduleDefinition.version,
      ),

    description:
      String(
        moduleDefinition.description ||
        "",
      ).trim(),

    priority:
      normalizeModulePriority(
        moduleDefinition.priority,
      ),

    enabled:
      moduleDefinition.enabled !==
      false,
  }
}


function createBrainModule(
  moduleDefinition,
) {
  return validateBrainModule(
    moduleDefinition,
  )
}


function getBrainModuleSummary(
  moduleDefinition,
) {
  const validatedModule =
    validateBrainModule(
      moduleDefinition,
    )

  return {
    id:
      validatedModule.id,

    name:
      validatedModule.name,

    version:
      validatedModule.version,

    description:
      validatedModule.description,

    priority:
      validatedModule.priority,

    enabled:
      validatedModule.enabled,
  }
}


export {
  createBrainModule,
  getBrainModuleSummary,
  normalizeModuleId,
  validateBrainModule,
}
