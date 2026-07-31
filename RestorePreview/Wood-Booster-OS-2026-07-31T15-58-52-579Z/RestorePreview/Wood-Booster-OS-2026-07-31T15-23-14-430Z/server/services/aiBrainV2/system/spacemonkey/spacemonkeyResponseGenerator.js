const responseHistory = []





function formatMemoryContext({

  memoryContext = []

} = {}) {


  if(
    !Array.isArray(memoryContext) ||
    memoryContext.length === 0
  ){

    return "Ei tallennettua käyttäjämuistia."

  }





  return memoryContext

    .slice(0,5)

    .map(

      memory =>

`- ${memory.content}`

    )

    .join("\n")

}







function generateResponse({

  message,

  strategy,

  userProfile,

  plan,

  codePipeline,

  memoryContext

}) {


  const instructions =

    strategy?.instructions || []



  let response = ""





  const memoryText =

    formatMemoryContext({

      memoryContext

    })







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



Aiempi muistini käyttäjästä:

${memoryText}



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


Aiempi muistini käyttäjästä:

${memoryText}


${message}`


  }





  const result = {


    response,


    mode:

      strategy?.mode || "unknown",


    memoryUsed:

      memoryContext?.length || 0,


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

      "0.3.0",


    responses:

      responseHistory.length

  }

}





export {

  generateResponse,

  getResponseGeneratorStatus

}
