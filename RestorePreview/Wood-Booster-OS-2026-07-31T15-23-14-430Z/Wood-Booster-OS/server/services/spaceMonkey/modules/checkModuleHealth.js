function checkModuleHealth(
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
    typeof moduleDefinition.health
    !== "function"
  ) {
    return {
      success: true,
      status: "no-health-check",
      moduleId:
        moduleDefinition.id || null,
    }
  }

  return moduleDefinition.health()
}


function checkModulesHealth(
  modules = [],
) {
  if (!Array.isArray(modules)) {
    return []
  }

  return modules.map(
    (moduleDefinition) =>
      checkModuleHealth(
        moduleDefinition,
      ),
  )
}


export {
  checkModuleHealth,
  checkModulesHealth,
}
