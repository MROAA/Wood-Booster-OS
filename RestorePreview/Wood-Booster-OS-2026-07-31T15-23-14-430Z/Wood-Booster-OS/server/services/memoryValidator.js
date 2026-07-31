export function validateMemory(memory) {


  const warnings = []


  const text =
    (
      memory.key +
      " " +
      memory.content
    )
    .toLowerCase()



  const forbidden = [

    "innovaatio",

    "innovatiivinen",

    "vallankumouksellinen",

    "kestävä kehitys",

    "ympäristöystävällinen",

    "rohkeus"

  ]



  for(
    const word of forbidden
  ){

    if(
      text.includes(word)
    ){

      warnings.push({

        type:
          "forbidden_concept",

        message:
          `Muisti sisältää määrittelemättömän käsitteen: ${word}`

      })

    }

  }





  const valid =

    warnings.length === 0



  return {

    valid,

    warnings,

    score:

      valid
        ? 100
        : 100 - warnings.length * 20

  }


}