const responseHistory = []



function generateResponse({

  message,

  strategy,

  userProfile,

  plan,

  codePipeline

}) {


  const instructions =

    strategy?.instructions || []



  let response = ""





  if(
    strategy?.mode === "coding"
  ){


    let pipelineReport = ""



    if(
      codePipeline
    ){


      pipelineReport =

`
🐒 Spacemonkey Development Report

File:
${codePipeline.filePath || "Unknown"}

Quality:

${
  codePipeline.codeQuality?.score
  ||
  0
}/100


Quality Status:

${
  codePipeline.codeQuality?.status
  ||
  "unknown"
}


Release:

${
  codePipeline.releaseGate?.status
  ||
  "unknown"
}


Next Step:

${
  codePipeline.nextStep
  ||
  "unknown"
}

`


    }



    response =

`Käsittelen tämän koodimuutoksena.

${pipelineReport}


Toimin käyttäjäasetustesi mukaan:

${instructions
  .map(item => `- ${item}`)
  .join("\n")}


Pyyntö:

${message}


Suunnitelma:

${plan?.steps
  ?.map(
    (step,index)=>
      `${index + 1}. ${step.title}`
  )
  .join("\n")
  ||
  "Ei suunnitelmaa."
}`


  }


  else {


    response =

`Analysoin pyynnön.

${message}`


  }





  const result = {


    response,


    mode:

      strategy?.mode || "unknown",


    createdAt:

      new Date().toISOString()

  }



  responseHistory.push(

    result

  )



  return result

}





function getResponseGeneratorStatus(){


  return {


    engine:

      "Spacemonkey Response Generator",


    version:

      "0.2.0",


    responses:

      responseHistory.length

  }

}





export {

  generateResponse,

  getResponseGeneratorStatus

}
