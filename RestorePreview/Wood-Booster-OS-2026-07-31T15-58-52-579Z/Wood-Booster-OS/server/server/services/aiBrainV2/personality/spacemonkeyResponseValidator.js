import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function checkResponseExists({

  response,

}) {


  return {


    valid:
      Boolean(response),


    reason:
      response
        ? "Response exists"
        : "Empty response"

  }


}



function detectUncertainty({

  response,

}) {


  const text =
    String(response || "")
      .toLowerCase()



  const uncertaintyWords = [

    "ehkä",

    "luultavasti",

    "todennäköisesti",

    "en tiedä",

    "voi olla"

  ]



  const detected =
    uncertaintyWords.filter(

      word =>
        text.includes(word)

    )



  return {


    containsUncertainty:

      detected.length > 0,


    detected

  }


}



function checkTruthAlignment({

  response,

}) {


  const text =
    String(response || "")
      .toLowerCase()



  const dangerousPatterns = [

    "olen täysin varma",

    "100% varmasti",

    "taattu ratkaisu"

  ]



  const detected =
    dangerousPatterns.filter(

      pattern =>
        text.includes(pattern)

    )



  return {


    aligned:
      detected.length === 0,


    warnings:
      detected

  }


}



function checkSpacemonkeyPrinciples({

  response,

}) {


  const text =
    String(response || "")
      .toLowerCase()



  const principles = {


    truth:

      !text.includes(
        "varmasti tiedän kaiken"
      ),


    responsibility:

      true,


    simplicity:

      true,


    usefulness:

      text.length > 10

  }



  return principles

}



function calculateQualityScore({

  existence,

  truth,

  principles,

}) {


  let score = 0



  if(existence.valid){

    score += 0.25

  }


  if(truth.aligned){

    score += 0.35

  }


  if(principles.truth){

    score += 0.15

  }


  if(principles.usefulness){

    score += 0.25

  }



  return score

}



function validateSpacemonkeyResponse({

  response,

}) {


  const core =
    getSpacemonkeyCore()



  const existence =
    checkResponseExists({

      response

    })



  const uncertainty =
    detectUncertainty({

      response

    })



  const truth =
    checkTruthAlignment({

      response

    })



  const principles =
    checkSpacemonkeyPrinciples({

      response

    })



  const qualityScore =
    calculateQualityScore({

      existence,

      truth,

      principles

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    approved:
      qualityScore >= 0.75 &&
      truth.aligned,


    qualityScore,


    validation:


    {

      existence,

      uncertainty,

      truth,

      principles

    },


    validatedAt:
      new Date().toISOString()


  }


}



export {

  validateSpacemonkeyResponse,

  checkTruthAlignment

}
