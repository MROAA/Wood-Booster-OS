export function validateResponseStyle(
  answer
) {


  const warnings = []



  if (!answer || !answer.trim()) {


    return {

      valid: false,

      warnings: [

        {

          type:
            "empty_response",

          message:
            "Vastaus on tyhjä."

        }

      ],

      score: 0

    }

  }





  const text =
    answer.toLowerCase()





  /*
  =====================================
  PITUUS
  =====================================
  */


  const sentences =

    answer

      .split(/[.!?]/)

      .map(
        sentence =>
          sentence.trim()
      )

      .filter(
        sentence =>
          sentence.length > 0
      )





  if (
    sentences.length > 12
  ) {


    warnings.push({

      type:
        "too_long",

      message:
        "Vastaus on liian pitkä."

    })


  }









  /*
  =====================================
  LIIAN MONTA LISTAKOHTAA
  =====================================
  */


  const listMatches =

    answer.match(
      /^(\s*[-*]|\s*\d+\.)/gm
    )



  const listCount =

    listMatches
      ? listMatches.length
      : 0





  if (
    listCount > 5
  ) {


    warnings.push({

      type:
        "too_many_list_items",

      message:
        "Vastaus sisältää liian monta listakohtaa."

    })


  }









  /*
  =====================================
  KONSULTTIKIELI
  =====================================
  */


  const corporateWords = [


    "strateginen",

    "strategia",

    "synergia",

    "skaalautuva",

    "ratkaisukeskeinen",

    "asiakaslähtöinen",

    "markkinajohtaja",

    "innovatiivinen",

    "innovatiivisuus",

    "vallankumouksellinen",

    "tehokkuus",

    "tehokas toimintamalli",

    "ekosysteemi",

    "optimoida",

    "optimaalinen"


  ]





  for (
    const word of corporateWords
  ) {


    if (
      text.includes(word)
    ) {


      warnings.push({

        type:
          "corporate_language",

        message:
          `Vältä konsulttikieltä: ${word}`

      })


    }


  }









  /*
  =====================================
  TURHA ITSESELOSTUS
  =====================================
  */


  const metaPhrases = [


    "olen tekoäly",

    "tekoälynä",

    "kielimallina",

    "vastaukseni perustuu",

    "tässä vastauksessa",

    "kuten aiemmin mainitsin"


  ]





  for (
    const phrase of metaPhrases
  ) {


    if (
      text.includes(phrase)
    ) {


      warnings.push({

        type:
          "meta_language",

        message:
          `Vältä tekoälyn itsekommentointia: ${phrase}`

      })


    }


  }









  /*
  =====================================
  TOISTO
  =====================================
  */


  const repeatedPhrases = [


    "tavoitteena on",

    "me pyrimme",

    "wood-booster pyrkii",

    "tärkeä osa"

  ]





  for (
    const phrase of repeatedPhrases
  ) {


    const count =

      (
        text.match(
          new RegExp(
            phrase,
            "g"
          )
        )
        ||
        []
      ).length




    if (
      count > 2
    ) {


      warnings.push({

        type:
          "repetition",

        message:
          `Liikaa toistoa: ${phrase}`

      })


    }


  }









  /*
  =====================================
  LOPPUTULOS
  =====================================
  */


  return {


    valid:
      warnings.length === 0,


    warnings,


    score:

      Math.max(

        0,

        100 -
        (
          warnings.length * 15
        )

      )


  }


}