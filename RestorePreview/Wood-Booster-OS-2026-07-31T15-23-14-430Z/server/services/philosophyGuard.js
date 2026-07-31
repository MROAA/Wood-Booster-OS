/*
==================================================

WOOD-BOOSTER PHILOSOPHY GUARD v4

Tarkistaa:

- brändiarvot
- filosofia vastaukset
- identiteettikysymykset

Viralliset arvot:

1. Aitous
2. Laatu
3. Käsityö
4. Puun tarina

HUOM:

Voice Profile EI ole arvoja.

==================================================
*/





export function validatePhilosophyAnswer(

  question,

  answer

) {



  const warnings = []





  const q =

    String(question || "")

      .toLowerCase()





  const a =

    String(answer || "")

      .toLowerCase()









  /*
  =====================================
  ONKO FILOSOFIAKYSYMYS?
  =====================================
  */


  const isPhilosophyQuestion =


    q.includes("filosofia") ||

    q.includes("arvot") ||

    q.includes("identiteetti") ||

    q.includes("periaatteet") ||

    q.includes("ajatus") ||

    q.includes("mihin uskotte")







  if (!isPhilosophyQuestion) {


    return {


      valid:true,


      warnings:[],


      score:100


    }


  }









  /*
  =====================================
  VIRALLISET ARVOT

  Näitä ei saa muuttaa.

  =====================================
  */


  const officialValues = [


    "aitous",


    "laatu",


    "käsityö",


    "puun tarina"


  ]








  const missingValues = []






  for (

    const value of officialValues

  ) {


    if (

      !a.includes(value)

    ) {


      missingValues.push(value)


    }


  }







  if (

    missingValues.length > 0

  ) {


    warnings.push({

      type:

        "missing_core_values",


      message:

        `Vastauksesta puuttuvat viralliset arvot: ${missingValues.join(", ")}`


    })


  }









  /*
  =====================================
  TARKISTA ARVOJEN VÄÄRÄT NIMET

  Tarkistetaan vain jos sana
  esiintyy arvolistauksessa.

  Ei rangaista selityksiä.

  Esim:

  OK:
  "Laatu tarkoittaa laadukkuutta"

  VIRHE:
  "Arvomme ovat laadukkuus"

  =====================================
  */





  const lines =

    a.split("\n")







  const forbiddenValueNames = [


    "aitoutta",


    "laadukkuus",


    "pitkäikäisyys",


    "puun kunnioittaminen",


    "puun kunnioitus",


    "luovuus",


    "innovaatio",


    "innovatiivisuus",


    "rohkeus",


    "tehokkuus",


    "luottamus",


    "persoonallisuus"


  ]








  for (

    const line of lines

  ) {



    const trimmed =

      line.trim()








    /*
    Tutkitaan vain listakohtia.

    Esim:

    1. Laadukkuus

    2. Luovuus

    */




    const isValueLine =


      /^[0-9]+[.)]/.test(trimmed) ||

      trimmed.startsWith("-") ||

      trimmed.startsWith("*")







    if (!isValueLine) {


      continue


    }









    for (

      const value of forbiddenValueNames

    ) {



      if (

        trimmed.includes(value)

      ) {


        warnings.push({

          type:

            "invalid_value_variant",


          message:

            `${value} ei ole Wood-Boosterin virallinen arvo. Käytä virallista muotoa.`


        })


      }


    }



  }









  /*
  =====================================
  ESTÄÄ VOICE PROFILEN MUUTTUMISEN
  ARVOIKSI

  =====================================
  */





  const voiceWords = [


    "rauhallisuus",


    "uteliaisuus",


    "ihmisläheisyys",


    "pitkäjänteisyys",


    "ymmärrys",


    "selkeys",


    "käytännöllisyys"


  ]








  for (

    const word of voiceWords

  ) {


    if (

      a.includes(word)

    ) {



      warnings.push({

        type:

          "voice_as_value",


        message:

          `${word} kuuluu puhetapaan, ei virallisiin arvoihin.`


      })


    }


  }









  /*
  =====================================
  TULOS
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

        warnings.length * 20

      )


  }


}