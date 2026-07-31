function startModule(
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
    typeof moduleDefinition.start
    !== "function"
  ) {
    return {
      success: true,
      status: "no-starter",
      moduleId:
        moduleDefinition.id || null,
    }
  }

  return moduleDefinition.start()
}


function startModules(
  modules = [],
) {
  if (!Array.isArray(modules)) {
    return []
  }

  return modules.map(
    (moduleDefinition) =>
      startModule(
        moduleDefinition,
      ),
  )
}


export {
  startModule,
  startModules,
}
