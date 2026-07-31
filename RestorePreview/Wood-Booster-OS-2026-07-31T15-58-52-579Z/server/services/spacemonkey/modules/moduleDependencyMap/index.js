const MODULE_ID = "module-dependency-map"


const dependencies = [

  {
    module: "identity-layer",
    dependsOn: [],
  },


  {
    module: "knowledge-layer",
    dependsOn: [
      "identity-layer",
    ],
  },


  {
    module: "capability-layer",
    dependsOn: [
      "knowledge-layer",
    ],
  },


  {
    module: "memory-intelligence",
    dependsOn: [
      "knowledge-layer",
    ],
  },


  {
    module: "reflection-intelligence",
    dependsOn: [
      "memory-intelligence",
      "knowledge-layer",
    ],
  },


  {
    module: "runtime-awareness",
    dependsOn: [
      "capability-layer",
      "memory-intelligence",
    ],
  },


  {
    module: "system-diagnostics",
    dependsOn: [
      "runtime-awareness",
      "memory-intelligence",
    ],
  },

]



function getDependencyMap(){

  return {

    moduleId: MODULE_ID,

    generated:
      new Date().toISOString(),

    count:
      dependencies.length,

    dependencies,

  }

}



function getModuleDependencies(moduleId){

  const result =
    dependencies.find(
      item =>
        item.module === moduleId
    )


  return result || null

}



function getStartupOrder(){

  return [

    "identity-layer",

    "knowledge-layer",

    "capability-layer",

    "memory-intelligence",

    "reflection-intelligence",

    "runtime-awareness",

    "system-diagnostics",

  ]

}



export {

  MODULE_ID,

  getDependencyMap,

  getModuleDependencies,

  getStartupOrder,

}
