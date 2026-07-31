import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function createRuntimeContext({
  message,
  systemContext = {},
  memory = [],
  knowledge = [],
}) {


  return {


    message,


    systemContext,


    memory,


    knowledge,


    createdAt:
      new Date().toISOString()


  }


}



function analyzeIntent(message){


  if(!message){

    return {

      intent:"unknown",

      confidence:0

    }

  }


  const text =
    String(message)
      .toLowerCase()



  if(
    text.includes("rakenna") ||
    text.includes("tee") ||
    text.includes("luo")
  ){

    return {

      intent:"creation",

      confidence:0.8

    }

  }



  if(
    text.includes("miksi") ||
    text.includes("selitä") ||
    text.includes("miten")
  ){

    return {

      intent:"analysis",

      confidence:0.8

    }

  }



  return {


    intent:"conversation",

    confidence:0.5


  }


}



function applySpacemonkeyPrinciples({

  message,

  context,

}){


  const core =
    getSpacemonkeyCore()



  return {


    identity:

      core.name,


    mode:

      "analysis",


    principles:

      [

        "Truth before confidence",

        "Understanding before action",

        "Protect system integrity",

        "Create meaningful progress"

      ],


    reasoningContext: {


      message,


      context


    }


  }


}



async function runSpacemonkeyRuntime({

  message,

  systemContext = {},

  memory = [],

  knowledge = []

}){


  const core =
    getSpacemonkeyCore()



  const context =
    createRuntimeContext({

      message,

      systemContext,

      memory,

      knowledge

    })



  const intent =
    analyzeIntent(
      message
    )



  const personalityContext =
    applySpacemonkeyPrinciples({

      message,

      context

    })



  return {


    success:true,


    agent:"spacemonkey",


    core:{


      name:
        core.name,


      version:
        core.version,


      status:
        core.status


    },


    intent,


    personalityContext,


    context


  }


}



export {

  runSpacemonkeyRuntime,

  createRuntimeContext

}
