const responseHistory = []



function buildResponse({

  message,

  userProfile,

  memoryUsed = false,

  decision,

  plan

}) {


  let response = ""



  if(
    userProfile?.coding?.filePreference
    ===
    "kokonaiset tiedostot"
    &&
    message.toLowerCase().includes("koodi")
  ){

    response +=
`
Käsittelen tämän koodimuutoksena.

Toimin käyttäjäasetustesi mukaan:

- annan kokonaisen tiedoston
- etenemme MVP vaiheittain
- testaamme ennen seuraavaa vaihetta

`

  }


  else {

    response +=
`
Analysoin pyynnön.

`

  }



  response +=

`
Pyyntö:

${message}


Suunnitelma:

${plan?.steps?.map(

(step)=>

`${step.order}. ${step.title}`

).join("\n")}


`

  

  const result = {


    response:


      response.trim(),


    style:{

      tone:
        userProfile?.communication?.tone
        ||
        "rauhallinen ja asiantunteva",


      language:
        userProfile?.communication?.language
        ||
        "suomen kieli"

    },


    memoryUsed,


    decisionStatus:

      decision?.status
      ||
      "unknown",


    planStatus:

      plan?.status
      ||
      "unknown",


    createdAt:
      new Date().toISOString()

  }



  responseHistory.push(

    result

  )



  return result

}



function getResponseStatus(){

  return {

    engine:
      "Spacemonkey Response Engine",


    version:
      "0.1.0",


    responses:
      responseHistory.length

  }

}



export {

  buildResponse,

  getResponseStatus

}
