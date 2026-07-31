import {
  canExecuteCapability,
} from "./services/aiBrainV2/services/capabilityExecution/capabilityExecutionManager.js"



const tests = [

  "memory-learning",

  "spacemonkey",

  "action",

  "conversation",

  "unknown-module",

]



for (
  const moduleId
  of tests
){

  console.log("\n====================")

  console.log(
    "TEST:",
    moduleId,
  )


  console.dir(
    canExecuteCapability(
      moduleId,
    ),
    {
      depth:null,
      colors:true,
    },
  )

}
