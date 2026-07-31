/*
==================================================

WOOD-BOOSTER AI QUALITY CONTROL

Tarkistaa vastauksen yleisen luotettavuuden.

Huomioi:

- Brand Truth
- Business Truth
- Knowledge
- Memory
- mahdolliset keksityt luvut
- liian varmat väitteet

==================================================
*/



export function validateAIResponse({

  answer,

  knowledge = [],

  memories = [],

} = {}) {


  const warnings = []



  const lowerAnswer =

    String(answer || "")

      .toLowerCase()

      .trim()





  /*
  =====================================
  TYHJÄ VASTAUS
  =====================================
  */


  if (!lowerAnswer) {


    return createResult([

      {

        type:
          "empty_answer",

        message:
          "AI palautti tyhjän vastauksen.",

      },

    ])


  }





  /*
  =====================================
  MAHDOLLISET HALLUSINAATIOT
  =====================================
  */


  const blockedPatterns = [

    "perustettiin vuonna",

    "on varmasti",

    "tutkimusten mukaan",

    "todistetusti",

    "kaikki asiakkaat",

    "aina paras",

    "markkinajohtaja",

  ]





  for (

    const pattern of blockedPatterns

  ) {


    if (

      lowerAnswer.includes(pattern)

    ) {


      warnings.push({

        type:
          "possible_hallucination",

        message:
          `Vastaus sisältää liian varman väitteen: ${pattern}`,

      })


    }


  }





  /*
  =====================================
  KNOWLEDGE JA MEMORY TEKSTIKSI
  =====================================
  */


  const knowledgeText =

    knowledge

      .map(item =>

        String(

          item?.content ||

          item?.text ||

          ""

        )

      )

      .join(" ")

      .toLowerCase()





  const memoryText =

    memories

      .map(item =>

        String(

          item?.content ||

          ""

        )

      )

      .join(" ")

      .toLowerCase()





  const availableContext =

    `${knowledgeText} ${memoryText}`





  /*
  =====================================
  VIRALLISET WOOD-BOOSTER-TERMIT

  Näiden ei tarvitse löytyä tavallisesta
  Knowledge-listasta, koska ne kuuluvat
  Truth Layeriin.

  =====================================
  */


  const officialTerms = [

    "aitous",

    "laatu",

    "käsityö",

    "puun tarina",

    "me jatkamme puun tarinaa",

    "massiivipuu",

    "massiivipuinen",

    "massiivipuisia",

    "yksilöllinen",

    "uniikki",

  ]





  /*
  =====================================
  TARKISTETTAVAT YRITYSTERMIT
  =====================================
  */


  const businessTerms = [

    "epoksi",

    "jokipöytä",

    "hinnoittelu",

    "materiaalikustannus",

    "työkustannus",

    "kate",

    "toimitusaika",

  ]





  for (

    const term of businessTerms

  ) {


    if (

      lowerAnswer.includes(term)

      &&

      !availableContext.includes(term)

      &&

      !officialTerms.includes(term)

    ) {


      warnings.push({

        type:
          "unsupported_business_term",

        message:
          `${term} ei löytynyt käytettävissä olevasta tiedosta.`,

      })


    }


  }





  /*
  =====================================
  KEKSITYT TARKAT RAHASUMMAT

  Esimerkiksi:

  "Materiaalit maksavat 20 euroa"

  ilman tietolähdettä.

  =====================================
  */


  const euroClaims =

    lowerAnswer.match(

      /\b\d+(?:[.,]\d+)?\s*(?:€|euroa|eur)\b/g

    ) || []





  for (

    const claim of euroClaims

  ) {


    if (

      !availableContext.includes(

        claim.toLowerCase()

      )

    ) {


      warnings.push({

        type:
          "unsupported_price",

        message:
          `Tarkalle rahasummalle ei löytynyt lähdettä: ${claim}`,

      })


    }


  }





  /*
  =====================================
  KEKSITYT PROSENTIT
  =====================================
  */


  const percentageClaims =

    lowerAnswer.match(

      /\b\d+(?:[.,]\d+)?\s*%/g

    ) || []





  for (

    const claim of percentageClaims

  ) {


    if (

      !availableContext.includes(

        claim.toLowerCase()

      )

    ) {


      warnings.push({

        type:
          "unsupported_percentage",

        message:
          `Prosenttiluvulle ei löytynyt lähdettä: ${claim}`,

      })


    }


  }





  return createResult(

    warnings

  )


}





function createResult(warnings) {


  const approved =

    warnings.length === 0



  return {


    /*
    Molemmat palautetaan yhteensopivuuden vuoksi.

    Vanha koodi käyttää:
    quality.approved

    Uudempi aiBrain.js käyttää:
    quality.valid
    */


    approved,

    valid:
      approved,

    warnings,

    score:

      Math.max(

        0,

        100 -

        warnings.length * 15

      ),

  }


}