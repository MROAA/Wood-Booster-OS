const spacemonkeyModules = [

  {

    id:
      "spacemonkey-core",

    name:
      "Spacemonkey Core",

    version:
      "1.0.0",

    type:
      "identity",

    responsibility:
      "Maintains Spacemonkey identity and core principles",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-runtime",

    name:
      "Spacemonkey Runtime",

    version:
      "1.0.0",

    type:
      "runtime",

    responsibility:
      "Creates active intelligence context",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-reasoning",

    name:
      "Spacemonkey Reasoning Engine",

    version:
      "1.0.0",

    type:
      "reasoning",

    responsibility:
      "Analyzes problems and creates understanding",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-decision",

    name:
      "Spacemonkey Decision Engine",

    version:
      "1.0.0",

    type:
      "decision",

    responsibility:
      "Evaluates choices and recommendations",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-planner",

    name:
      "Spacemonkey Planner Bridge",

    version:
      "1.0.0",

    type:
      "planning",

    responsibility:
      "Transforms decisions into structured plans",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-execution",

    name:
      "Spacemonkey Execution Bridge",

    version:
      "1.0.0",

    type:
      "execution",

    responsibility:
      "Prepares controlled execution requests",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-reflection",

    name:
      "Spacemonkey Reflection Engine",

    version:
      "1.0.0",

    type:
      "learning",

    responsibility:
      "Evaluates results and extracts lessons",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-health",

    name:
      "Spacemonkey Health Monitor",

    version:
      "1.0.0",

    type:
      "system",

    responsibility:
      "Checks system readiness",

    status:
      "active"

  },


  {

    id:
      "spacemonkey-adapter",

    name:
      "Spacemonkey AI Brain Adapter",

    version:
      "1.0.0",

    type:
      "integration",

    responsibility:
      "Connects Spacemonkey with AI Brain",

    status:
      "active"

  }

]



function getSpacemonkeyModules(){

  return spacemonkeyModules

}



function getSpacemonkeyModule(id){

  return spacemonkeyModules.find(

    module =>
      module.id === id

  )

}



function getSpacemonkeyModuleStatus(){


  return {


    total:

      spacemonkeyModules.length,


    active:

      spacemonkeyModules.filter(

        module =>
          module.status === "active"

      ).length,


    modules:
      spacemonkeyModules

  }


}



export {

  getSpacemonkeyModules,

  getSpacemonkeyModule,

  getSpacemonkeyModuleStatus

}
