/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY RUNTIME INJECTION ADAPTER V1

Vastuut:

- lisää muistikontextin runtimeContextiin
- pitää nykyisen runtime-rakenteen ehjänä

Tämä EI:

- muuta Brain Pipelinea
- tallenna muistia
- hae tietokantaa

=====================================
*/


function injectMemoryRuntimeContext({
  runtimeContext = {},
  memoryRuntimeContext = null,
} = {}) {


  if (
    !memoryRuntimeContext ||
    !memoryRuntimeContext.memoryEnabled
  ) {

    return {

      ...runtimeContext,

      memoryEnabled:
        false,

    }

  }



  return {

    ...runtimeContext,


    memoryEnabled:
      true,


    memoryContext:
      memoryRuntimeContext.memoryContext,


    memoryCount:
      memoryRuntimeContext.memoryCount || 0,

  }

}



export {
  injectMemoryRuntimeContext,
}
