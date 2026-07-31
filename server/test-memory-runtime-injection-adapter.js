/*
=====================================
MEMORY RUNTIME INJECTION ADAPTER TEST
=====================================
*/


import {
  injectMemoryRuntimeContext,
} from "./services/aiBrainV2/services/memoryRuntimeInjectionAdapter.js"



const runtimeContext = {

  requestId:
    "test-memory-001",

  source:
    "test",

}



const memoryRuntimeContext = {

  memoryEnabled:
    true,

  memoryContext:
`
MEMORY CONTEXT

- Spacemonkey AI syntyi 24.07.2026.
`,

  memoryCount:
    1,

}



const result =
  injectMemoryRuntimeContext({

    runtimeContext,

    memoryRuntimeContext,

  })



console.log(
  result,
)
