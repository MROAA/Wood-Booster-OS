/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY RUNTIME ADAPTER V3

Vastuut:

- yhdistää muistikontextin runtime-muotoon
- välittää muistien metatiedot eteenpäin
- tarjoaa turvallisen rajapinnan AI Brainille

Tämä EI:

- kutsu kielimallia
- hae tietokantaa
- kirjoita muistia

=====================================
*/


function createMemoryRuntimeContext({
  memoryContext = null,
  memories = [],
} = {}) {


  if (
    !memoryContext ||
    !memoryContext.context
  ) {

    return {

      memoryEnabled:
        false,


      memoryContext:
        "",


      memoryCount:
        0,


      memoryItems:
        [],

    }

  }



  return {

    memoryEnabled:
      true,


    memoryContext:
      memoryContext.context,


    memoryCount:
      memoryContext.memoryCount || 0,


    memoryItems:
      Array.isArray(
        memories,
      )
        ? memories
        : [],

  }

}



export {
  createMemoryRuntimeContext,
}
