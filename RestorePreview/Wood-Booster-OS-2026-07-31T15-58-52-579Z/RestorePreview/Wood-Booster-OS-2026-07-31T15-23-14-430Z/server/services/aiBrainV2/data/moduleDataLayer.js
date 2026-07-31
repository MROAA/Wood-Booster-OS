/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE DATA LAYER

Vastuut:
- lukee AI Brain V2:n rekisteröidyt moduulit
- muuttaa moduulit yhtenäiseen tietomuotoon
- muodostaa moduuleista tietokerroksen
- tarjoaa moduulit AI Brainin kontekstille
- ei suorita moduuleja
- ei muuta moduulirekisteriä
- ei valitse moduulia
=====================================
*/


import {
  ensureDefaultBrainModules,
  getBrainModuleInfo,
} from "../index.js"


const MODULE_DATA_LAYER_VERSION =
  "1.0.0"


function normalizeText(value) {
  return String(
    value || "",
  ).trim()
}


function normalizeNumber(
  value,
  fallback = 0,
) {
  const numberValue =
    Number(value)

  if (
    !Number.isFinite(
      numberValue,
    )
  ) {
    return fallback
  }

  return numberValue
}


function normalizeModule(
  moduleDefinition,
) {
  const id =
    normalizeText(
      moduleDefinition?.id,
    )

  const name =
    normalizeText(
      moduleDefinition?.name,
    ) ||
    id ||
    "Unknown module"

  return {
    id,

    name,

    version:
      normalizeText(
        moduleDefinition?.version,
      ) ||
      "1.0.0",

    description:
      normalizeText(
        moduleDefinition
          ?.description,
      ),

    priority:
      normalizeNumber(
        moduleDefinition?.priority,
        100,
      ),

    enabled:
      moduleDefinition?.enabled !==
      false,

    type:
      normalizeText(
        moduleDefinition?.type,
      ) ||
      "brain-module",

    capabilities:
      Array.isArray(
        moduleDefinition
          ?.capabilities,
      )
        ? moduleDefinition
            .capabilities
            .map(normalizeText)
            .filter(Boolean)
        : [],

    metadata: {
      source:
        "brain-module-registry",

      executable:
        true,

      dataLayer:
        true,
    },
  }
}


function sortModules(
  modules,
) {
  return [...modules].sort(
    (
      firstModule,
      secondModule,
    ) => {
      const priorityDifference =
        firstModule.priority -
        secondModule.priority

      if (
        priorityDifference !== 0
      ) {
        return priorityDifference
      }

      return firstModule.name
        .localeCompare(
          secondModule.name,
          "fi",
        )
    },
  )
}


function buildModuleCategories(
  modules,
) {
  const categories =
    new Map()

  for (
    const moduleDefinition
    of modules
  ) {
    const category =
      moduleDefinition.type ||
      "brain-module"

    const currentCount =
      categories.get(
        category,
      ) || 0

    categories.set(
      category,
      currentCount + 1,
    )
  }

  return Array.from(
    categories.entries(),
  ).map(
    (
      [
        id,
        moduleCount,
      ],
    ) => ({
      id,

      moduleCount,
    }),
  )
}


function buildModuleKnowledgeItems(
  modules,
) {
  return modules.map(
    (
      moduleDefinition,
    ) => ({
      id:
        `module:${moduleDefinition.id}`,

      source:
        "module-data-layer",

      category:
        "system-module",

      priority:
        moduleDefinition.priority,

      content: [
        `Moduulin tunniste: ${moduleDefinition.id}`,
        `Moduulin nimi: ${moduleDefinition.name}`,
        `Versio: ${moduleDefinition.version}`,
        `Tila: ${
          moduleDefinition.enabled
            ? "aktiivinen"
            : "pois käytöstä"
        }`,
        `Tyyppi: ${moduleDefinition.type}`,
        moduleDefinition.description
          ? `Kuvaus: ${moduleDefinition.description}`
          : "",
        moduleDefinition
          .capabilities
          .length > 0
          ? (
            "Kyvykkyydet: " +
            moduleDefinition
              .capabilities
              .join(", ")
          )
          : "",
      ]
        .filter(Boolean)
        .join("\n"),

      metadata: {
        moduleId:
          moduleDefinition.id,

        moduleName:
          moduleDefinition.name,

        moduleVersion:
          moduleDefinition.version,

        enabled:
          moduleDefinition.enabled,

        executable:
          true,
      },
    }),
  )
}


function createEmptyModuleDataLayer(
  error = null,
) {
  return {
    success:
      error === null,

    id:
      "wood-booster-module-data-layer",

    name:
      "Wood-Booster Module Data Layer",

    version:
      MODULE_DATA_LAYER_VERSION,

    source:
      "brain-module-registry",

    status:
      error
        ? "error"
        : "empty",

    totalModules:
      0,

    activeModules:
      0,

    disabledModules:
      0,

    categories:
      [],

    modules:
      [],

    knowledge:
      [],

    error:
      error
        ? {
            message:
              normalizeText(
                error.message ||
                error,
              ),
          }
        : null,

    generatedAt:
      new Date()
        .toISOString(),
  }
}


function buildModuleDataLayer({
  includeDisabled = true,
} = {}) {
  try {
    ensureDefaultBrainModules()

    const registeredModules =
      getBrainModuleInfo({
        includeDisabled,
      })

    const modules =
      sortModules(
        registeredModules.map(
          normalizeModule,
        ),
      )

    const activeModules =
      modules.filter(
        (
          moduleDefinition,
        ) =>
          moduleDefinition.enabled,
      )

    const disabledModules =
      modules.filter(
        (
          moduleDefinition,
        ) =>
          !moduleDefinition.enabled,
      )

    return {
      success:
        true,

      id:
        "wood-booster-module-data-layer",

      name:
        "Wood-Booster Module Data Layer",

      version:
        MODULE_DATA_LAYER_VERSION,

      source:
        "brain-module-registry",

      status:
        modules.length > 0
          ? "ready"
          : "empty",

      totalModules:
        modules.length,

      activeModules:
        activeModules.length,

      disabledModules:
        disabledModules.length,

      categories:
        buildModuleCategories(
          modules,
        ),

      modules,

      knowledge:
        buildModuleKnowledgeItems(
          modules,
        ),

      error:
        null,

      generatedAt:
        new Date()
          .toISOString(),
    }
  } catch (error) {
    return createEmptyModuleDataLayer(
      error,
    )
  }
}


function getModuleDataLayerSummary(
  options = {},
) {
  const dataLayer =
    buildModuleDataLayer(
      options,
    )

  return {
    success:
      dataLayer.success,

    id:
      dataLayer.id,

    name:
      dataLayer.name,

    version:
      dataLayer.version,

    status:
      dataLayer.status,

    totalModules:
      dataLayer.totalModules,

    activeModules:
      dataLayer.activeModules,

    disabledModules:
      dataLayer.disabledModules,

    categories:
      dataLayer.categories,

    error:
      dataLayer.error,

    generatedAt:
      dataLayer.generatedAt,
  }
}


function findModuleData(
  moduleId,
) {
  const normalizedId =
    normalizeText(
      moduleId,
    ).toLowerCase()

  if (!normalizedId) {
    return null
  }

  const dataLayer =
    buildModuleDataLayer({
      includeDisabled:
        true,
    })

  return (
    dataLayer.modules.find(
      (
        moduleDefinition,
      ) =>
        moduleDefinition.id
          .toLowerCase() ===
        normalizedId,
    ) ||
    null
  )
}


export {
  MODULE_DATA_LAYER_VERSION,
  buildModuleDataLayer,
  findModuleData,
  getModuleDataLayerSummary,
}
