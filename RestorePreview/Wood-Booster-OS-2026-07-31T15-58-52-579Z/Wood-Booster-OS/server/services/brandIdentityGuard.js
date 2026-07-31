import {
  BRAND_TRUTH
} from "./brandTruth.js"





export function validateBrandIdentity(
  answer
){

  const warnings = []



  const text =
    String(answer || "")
      .toLowerCase()







  /*
  =====================================
  VIRALLISET ARVOT
  =====================================
  */


  const officialValues = [

    "aitous",

    "laatu",

    "käsityö",

    "puun tarina"

  ]









  /*
  =====================================
  EPÄILLYT KEKSITYT ARVOT
  =====================================
  */


  const suspiciousValues = [

    "luovuus",

    "innovaatio",

    "innovatiivisuus",

    "rohkeus",

    "tehokkuus",

    "kestävä kehitys",

    "ympäristöystävällisyys",

    "asiakaslähtöisyys",

    "vallankumouksellinen",

    "tulevaisuuden"

  ]









  for (

    const value of suspiciousValues

  ){

    if (

      text.includes(value)

    ){

      warnings.push({

        type:

          "unknown_brand_identity",


        message:

          `Mahdollinen keksitty brändiarvo: ${value}`

      })

    }

  }









  /*
  =====================================
  TARKISTA ETTÄ BRAND TRUTH ON OLEMASSA
  =====================================
  */


  if (

    !BRAND_TRUTH

  ){

    warnings.push({

      type:

        "missing_brand_truth",


      message:

        "BRAND_TRUTH puuttuu."

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

        warnings.length * 15

      )

  }


}