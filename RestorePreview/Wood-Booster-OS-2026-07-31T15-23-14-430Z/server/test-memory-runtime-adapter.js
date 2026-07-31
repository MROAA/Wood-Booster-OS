/*
=====================================
MEMORY RUNTIME ADAPTER TEST
=====================================
*/


import {
  createMemoryRuntimeContext,
} from "./services/aiBrainV2/services/memoryRuntimeAdapter.js"



const memoryContext = {

  context:
`
MEMORY CONTEXT

Käyttäjän ja AI:n aiemmin tallennetut tiedot:

- Spacemonkey AI syntyi 24.07.2026.
- Spacemonkey syntyi 24.07.2026.
`,

  memoryCount:
    2,

}



const result =
  createMemoryRuntimeContext({

    memoryContext,

  })



console.log(
  result,
)
