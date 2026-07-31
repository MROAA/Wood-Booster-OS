import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const DEFAULT_PROVIDER =
  "ollama"



const DEFAULT_MODEL =
  "qwen2.5:7b"



function createLLMRequest({

  prompt,

  provider = DEFAULT_PROVIDER,

  model = DEFAULT_MODEL,

}) {


  return {


    provider,


    model,


    prompt,


    createdAt:
      new Date().toISOString()


  }


}



async function runOllamaRequest({

  prompt,

  model,

}) {


  const response =
    await fetch(
      "http://localhost:11434/api/generate",
      {

        method:
          "POST",

        headers:
        {

          "Content-Type":
            "application/json"

        },


        body:
          JSON.stringify({

            model,

            prompt,

            stream:false

          })

      }
    )



  if(
    !response.ok
  ){

    throw new Error(
      "Ollama request failed"
    )

  }



  const data =
    await response.json()



  return {


    text:
      data.response,


    provider:
      "ollama",


    model

  }


}



async function executeLLMRequest({

  request,

}) {


  if(
    request.provider === "ollama"
  ){

    return runOllamaRequest({

      prompt:
        request.prompt,


      model:
        request.model

    })

  }



  throw new Error(

    `Unsupported LLM provider: ${request.provider}`

  )


}



async function runSpacemonkeyLLM({

  prompt,

  provider,

  model,

}) {


  const core =
    getSpacemonkeyCore()



  const request =
    createLLMRequest({

      prompt,

      provider,

      model

    })



  const response =
    await executeLLMRequest({

      request

    })



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    request,


    response

  }


}



export {

  runSpacemonkeyLLM,

  createLLMRequest

}
