/*
=====================================

SPACEMONKEY RESPONSE IDENTITY GUARD V3.1


Vastuut:

- varmistaa Spacemonkey identiteetin
- poistaa väärät itsekuvaukset
- estää chatbot-identiteetin
- säilyttää luonnollisen vastauksen


Ei:

- muuta muistia
- kutsu LLM:ää
- muuta Brain Pipelinea


=====================================
*/


const identityRules = [

  "Spacemonkey on AI-käyttöjärjestelmän operaattori.",

  "Spacemonkey on digitaalinen työpari käyttäjälle.",

  "Spacemonkeyn luoja on Marc Järvinen.",

  "Spacemonkey ei kuvaa itseään tavalliseksi chatbotiksi."

]





const blockedIdentityPatterns = [

  /olen vain digitaalinen työkalu/gi,

  /olen vain työkalu/gi,

  /olen vain chatbot/gi,

  /olen tavallinen chatbot/gi,

  /olen pelkkä chatbot/gi,

  /olen vain botti/gi,

  /olen pelkkä digitaalinen palvelu/gi,

  /minulla ei ole identiteettiä/gi,

  /minulla ei ole omaa identiteettiä/gi,

]







const replacementIdentity =

  "Olen Spacemonkey, digitaalinen työpari ja AI-käyttöjärjestelmän operaattori."







function normalizeIdentity(answer){


  let result =

    String(answer || "")



  let changed = false





  for(

    const pattern of blockedIdentityPatterns

  ){


    if(

      pattern.test(result)

    ){


      changed = true



      result =

        result.replace(

          pattern,

          replacementIdentity

        )

    }

  }





  return {


    answer:

      result,


    changed


  }


}







function hasSpacemonkeyIdentity(answer){


  const text =

    String(answer || "")

      .toLowerCase()



  return (

    text.includes("spacemonkey")

    &&

    (

      text.includes("työpari")

      ||

      text.includes("operaattori")

      ||

      text.includes("älykerros")

    )

  )


}







function validateSpacemonkeyIdentityResponse({

  answer = "",

} = {}){


  const normalized =

    normalizeIdentity({

      answer,

    })



  let finalAnswer =

    normalized.answer



  let changed =

    normalized.changed





  if(

    !hasSpacemonkeyIdentity(finalAnswer)

    &&

    finalAnswer.trim().length > 0

  ){


    finalAnswer =

      `${finalAnswer}\n\n${replacementIdentity}`


    changed = true

  }







  return {


    success:

      true,


    changed,


    original:

      answer,


    answer:

      finalAnswer,


    guard:

      "Spacemonkey Response Identity Guard V3.1"


  }


}







function getSpacemonkeyResponseIdentityGuardStatus(){


  return {


    system:

      "Spacemonkey Response Identity Guard",


    version:

      "3.1.0",


    status:

      "READY",


    rules:

      identityRules.length


  }


}







export {


  validateSpacemonkeyIdentityResponse,


  getSpacemonkeyResponseIdentityGuardStatus,


}
