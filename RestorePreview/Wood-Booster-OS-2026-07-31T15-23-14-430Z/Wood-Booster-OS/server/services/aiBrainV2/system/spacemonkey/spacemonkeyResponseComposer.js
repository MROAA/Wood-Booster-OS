const responseHistory = []



function composeResponse({

  message,

  identity,

  personality,

  memory,

  decision,

  plan

}) {


  const remembered =

    memory?.recalled?.memories || []



  const memoryText =

    remembered.length > 0

      ?

      "Hyödynsin aikaisempaa tietoa käyttäjästä."

      :

      "Minulla ei ollut aikaisempaa tietoa tästä aiheesta."



  let response = ""



  if(
    message.toLowerCase().includes("muista")
  ){

    response =

`Tallensin tämän tiedon muistiin.

${message}

Jatkossa huomioin tämän vastauksissani.`

  }

  else

  {


    response =

`Analysoin pyynnön.

${message}

${memoryText}

Toimin vaiheittain ja tarkistan ratkaisun ennen etenemistä.`

  }



  const result = {


    response,


    style:

    {

      tone:
        personality?.communication?.defaultTone || "rauhallinen",


      language:
        personality?.communication?.language || "suomi"

    },


    identity:

    identity?.name || "Spacemonkey",


    memoryUsed:

      remembered.length > 0,


    decisionStatus:

      decision?.status || null,


    planStatus:

      plan?.status || null,


    createdAt:

      new Date().toISOString()

  }



  responseHistory.push(

    result

  )



  return result

}



function getResponseHistory(){

  return [

    ...responseHistory

  ]

}



function getResponseStatus(){

  return {

    engine:
      "Spacemonkey Response Composer",


    version:
      "0.1.0",


    responses:
      responseHistory.length

  }

}



export {

  composeResponse,

  getResponseHistory,

  getResponseStatus

}
