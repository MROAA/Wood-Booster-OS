/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY CONTEXT INTEGRATION ADAPTER V2

Vastuut:

- muuttaa Memory Runtime Context
  contextBuilderille sopivaan muotoon

Tämä EI:

- hae muistia
- tallenna muistia
- muuta Brain Pipelinea

=====================================
*/


function integrateMemoryContext({
  runtimeContext = {},
} = {}) {


  if (
    !runtimeContext ||
    !runtimeContext.memoryEnabled
  ) {

    return {

      ...runtimeContext,

      memoryItems:
        [],

    }

  }



  return {

    ...runtimeContext,


    memoryItems:
      Array.isArray(
        runtimeContext.memoryItems,
      )
        ? runtimeContext.memoryItems
        : [],

  }

}



export {
  integrateMemoryContext,
}
