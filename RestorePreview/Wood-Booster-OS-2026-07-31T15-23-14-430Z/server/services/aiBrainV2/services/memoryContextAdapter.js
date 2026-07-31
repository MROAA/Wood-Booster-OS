/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY CONTEXT ADAPTER V1

Vastuut:

- muuttaa haetut muistot AI-kontekstiksi
- antaa yhtenäisen tekstimuodon
- erottaa muistot normaalista keskustelusta

Tämä EI:

- hae tietokantaa
- tallenna muistia
- päätä muistojen oikeellisuutta

=====================================
*/


function createMemoryContext({
  memories = [],
} = {}) {


  if (
    !Array.isArray(memories) ||
    memories.length === 0
  ){

    return {

      enabled:
        false,

      context:
        "",

      memoryCount:
        0,

    }

  }



  const context =

    memories

      .map(
        memory =>

          [
            `- ${memory.content}`,

          ].join("\n")

      )

      .join("\n")



  return {

    enabled:
      true,


    memoryCount:
      memories.length,


    context:
`
MEMORY CONTEXT

Käyttäjän ja AI:n aiemmin tallennetut tiedot:

${context}
`,

  }

}




export {
  createMemoryContext,
}
