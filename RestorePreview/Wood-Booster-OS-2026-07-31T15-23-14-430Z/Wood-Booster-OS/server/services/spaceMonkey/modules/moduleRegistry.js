const moduleRegistry = []


function registerModule(
  moduleDefinition,
) {
  if (
    !moduleDefinition ||
    typeof moduleDefinition !== "object"
  ) {
    return
  }

  moduleRegistry.push(
    moduleDefinition,
  )
}


function getModules() {
  return [
    ...moduleRegistry,
  ]
}


function getModuleIds() {
  return moduleRegistry.map(
    (moduleDefinition) =>
      moduleDefinition.id,
  )
}


export {
  registerModule,
  getModules,
  getModuleIds,
}
