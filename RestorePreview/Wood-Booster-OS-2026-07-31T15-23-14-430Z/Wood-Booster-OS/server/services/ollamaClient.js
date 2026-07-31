const OLLAMA_URL =
  "http://localhost:11434/api/generate"



/**
 * Wood-Booster AI Brain
 *
 * Ollama Client
 *
 * Kommunikoi paikallisen Ollama-palvelimen kanssa.
 */


export async function generateWithOllama({

  prompt,

  model = "qwen2.5:7b"

}) {


  try {


    console.log(
      "Sending request to Ollama:",
      model
    )



    const response =
      await fetch(
        OLLAMA_URL,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },


          body: JSON.stringify({

            model,

            prompt,

            stream: false

          })

        }
      )




    if (!response.ok) {

      throw new Error(
        `Ollama error: ${response.status}`
      )

    }



    const data =
      await response.json()



    return {

      success: true,

      response:
        data.response

    }



  } catch(error) {


    console.error(
      "OLLAMA CONNECTION ERROR:",
      error.message
    )


    return {

      success: false,

      error:
        error.message

    }

  }

}