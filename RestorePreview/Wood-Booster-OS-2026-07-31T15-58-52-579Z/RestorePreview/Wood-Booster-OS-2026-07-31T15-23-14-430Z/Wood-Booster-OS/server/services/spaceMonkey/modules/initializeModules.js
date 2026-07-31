function initializeModule(
  moduleDefinition,
) {
  if (
    !moduleDefinition ||
    typeof moduleDefinition !== "object"
  ) {
    return {
      success: false,
      status: "invalid-module",
      moduleId: null,
    }
  }

  if (
    moduleDefinition.enabled === false
  ) {
    return {
      success: true,
      status: "disabled",
      moduleId:
        moduleDefinition.id || null,
    }
  }

  if (
    typeof moduleDefinition.initialize
    !== "function"
  ) {
    return {
      success: true,
      status: "no-initializer",
      moduleId:
        moduleDefinition.id || null,
    }
  }

  return moduleDefinition.initialize()
}


function initializeModules(
  modules = [],
) {
  if (!Array.isArray(modules)) {
    return []
  }

  return modules.map(
    (moduleDefinition) =>
      initializeModule(
        moduleDefinition,
      ),
  )
}


export {
  initializeModule,
  initializeModules,
}
