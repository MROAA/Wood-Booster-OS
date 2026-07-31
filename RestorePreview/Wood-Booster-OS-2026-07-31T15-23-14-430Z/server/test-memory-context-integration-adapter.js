/*
=====================================
MEMORY CONTEXT INTEGRATION ADAPTER TEST
=====================================
*/


import {
  integrateMemoryContext,
} from "./services/aiBrainV2/services/memoryContextIntegrationAdapter.js"



const runtimeContext = {

  requestId:
    "integration-test-001",


  memoryEnabled:
    true,


  memoryContext:
`
MEMORY CONTEXT

- Spacemonkey AI syntyi 24.07.2026.
`,

}



const result =
  integrateMemoryContext({

    runtimeContext,

  })



console.log(
  result,
)
