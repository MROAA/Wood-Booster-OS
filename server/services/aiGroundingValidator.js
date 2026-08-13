/*
==================================================

WOOD-BOOSTER AI GROUNDING VALIDATOR

Tarkistaa:

- perustuuko vastaus annettuun tietoon
- keksiikö AI uusia faktoja
- pysyykö vastaus tiedon rajojen sisällä

Ei hallitse brändi-identiteettiä.
Ei hallitse arvoja.

==================================================
*/





export function validateGrounding({

  answer,

  knowledge = []

}) {


  const warnings = []



  const text =

    String(answer || "")

      .toLowerCase()





  /*
  =====================================
  TYHJÄ VASTAUS
  =====================================
  */


  if (

    !text.trim()

  ) {


    return {


      valid:false,


      warnings:[

        {

          type:

            "empty_answer",


          message:

            "AI palautti tyhjän vastauksen."

        }

      ],


      score:0


    }


  }









  /*
  =====================================
  KERÄÄ TIETOLÄHTEET
  =====================================
  */


  const sources =

    knowledge.map(item =>


      String(

        item.content ||

        item.text ||

        item.file ||

        ""

      )

      .toLowerCase()


    )









  /*
  =====================================
  JOS EI KNOWLEDGEÄ

  Ei voida todistaa virhettä.

  =====================================
  */


  if (

    sources.length === 0

  ) {


    return {


      valid:true,


      warnings:[],


      score:100


    }


  }









  /*
  =====================================
  TARKISTA AVAINSANOJA

  =====================================
  */


  const importantClaims = [

    "valmistaa",

    "valmistamme",

    "käyttää",

    "käytämme",

    "asiakas",

    "tuote",

    "materiaali",

    "puu",

    "käsityö"

  ]





  let groundedTerms = 0





  for (

    const claim of importantClaims

  ) {


    if (

      text.includes(claim)

    ) {


      const exists =

        sources.some(source =>

          source.includes(claim)

        )



      if (exists) {


        groundedTerms++


      }


    }


  }









  /*
  =====================================
  ARVIOINTI
  =====================================
  */


  if (

    groundedTerms === 0

  ) {


    warnings.push({

      type:

        "possible_ungrounded_answer",


      message:

        "Vastauksessa ei löytynyt yhteyttä saatavilla olevaan tietoon."

    })


  }









  return {


    valid:

      warnings.length === 0,


    warnings,



    score:

      Math.max(

        0,

        100 -

        warnings.length * 20

      )


  }


}