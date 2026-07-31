/*
=====================================

SPACEMONKEY BEHAVIOR GUARD V2


Vastuut:

- ohjaa Spacemonkeyn vastaustyyliä
- vähentää identiteetin toistoa
- estää FAQ-tyylisen itse-esittelyn
- pitää vastaukset luonnollisina


Ei:

- tee päätöksiä
- kutsu LLM:ää
- muuta muistia
- muuta Brain Pipelinea


=====================================
*/





const behaviorRules = {


  identity:

    [

      "Älä rakenna vastausta kysymys-vastauslistaksi ilman käyttäjän pyyntöä.",

      "Älä aloita lauseilla kuten 'Jos kysyt minulta'.",

      "Älä toista identiteettiä useita kertoja samassa vastauksessa.",

      "Kerro kuka olet vain silloin kun käyttäjä kysyy siitä."

    ],



  communication:

    [

      "Vastaa ensin suoraan käyttäjän asiaan.",

      "Käytä luonnollista keskustelutyyliä.",

      "Vältä pitkiä itse-esittelyitä.",

      "Pidä vastaus käytännöllisenä."

    ],



  honesty:

    [

      "Älä keksi tietoa.",

      "Kerro epävarmuudesta.",

      "Korjaa virheet selkeästi."

    ]

}





function createSpacemonkeyBehaviorContext(){


  return {


    system:

      "Spacemonkey Behavior Guard",



    version:

      "2.0.0",



    rules:

      behaviorRules


  }


}







function cleanIdentityPatterns(answer){


  let result =

    String(answer || "")



  let changed = false





  const patterns = [



    {

      regex:

        /Jos kysyt minulta:?\s*/gi,


      replace:

        "",

    },



    {

      regex:

        /Jos kysytte minulta:?\s*/gi,


      replace:

        "",

    },



    {

      regex:

        /olen vain digitaalinen työkalu/gi,


      replace:

        "Toimin Spacemonkeyn AI-operaattorina käyttäjän apuna",

    },



    {

      regex:

        /olen vain työkalu/gi,


      replace:

        "Toimin Spacemonkeyn AI-operaattorina",

    },


  ]





  for(

    const item of patterns

  ){


    const before = result



    result =

      result.replace(

        item.regex,

        item.replace,

      )



    if(

      before !== result

    ){

      changed = true

    }


  }





  return {


    answer:

      result,


    changed,


  }


}







function removeRepeatedIdentitySections(answer){


  const text =

    String(answer || "")



  const identityCount =

    (

      text.match(

        /Spacemonkey/gi

      ) || []

    ).length





  if(

    identityCount <= 5

  ){

    return {

      answer:text,

      changed:false,

    }

  }





  const lines =

    text.split("\n")





  const filtered =

    lines.filter(

      line =>

        !(

          line
            .toLowerCase()
            .includes("kuka olet") &&

          line
            .toLowerCase()
            .includes("spacemonkey")

        )

    )





  return {


    answer:

      filtered.join("\n"),



    changed:

      filtered.length !== lines.length,


  }


}







function validateSpacemonkeyBehaviorResponse({

  answer = "",

} = {}){


  const cleaned =

    cleanIdentityPatterns(

      answer,

    )





  const reduced =

    removeRepeatedIdentitySections(

      cleaned.answer,

    )





  return {


    success:

      true,



    changed:

      cleaned.changed ||

      reduced.changed,



    original:

      answer,



    answer:

      reduced.answer,



    guard:

      "Spacemonkey Behavior Guard V2"


  }


}







function getSpacemonkeyBehaviorGuardStatus(){


  return {


    system:

      "Spacemonkey Behavior Guard",



    version:

      "2.0.0",



    status:

      "READY",



    identityRules:

      behaviorRules.identity.length,



    communicationRules:

      behaviorRules.communication.length,



    honestyRules:

      behaviorRules.honesty.length


  }


}







export {


  createSpacemonkeyBehaviorContext,


  validateSpacemonkeyBehaviorResponse,


  getSpacemonkeyBehaviorGuardStatus,


}
