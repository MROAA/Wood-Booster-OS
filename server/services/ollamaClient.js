const OLLAMA_BASE_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

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



/*
 * chat-tyylinen Ollama-kutsu (/api/chat, messages-taulukko, lukee
 * data.message.content) - eri rajapinta kuin generateWithOllama
 * yllä (/api/generate, pelkkä prompt-merkkijono, lukee
 * data.response), joten ei korvaa sitä vaan on oma rinnakkainen
 * export. Yhdistää 7 palvelutiedoston (codeChangeGenerator.js,
 * changePlanGenerator.js, pythonCodeGenerator.js,
 * pythonCodeRefactorer.js, pythonCodeDebugger.js,
 * pythonCodeExplainer.js, pythonCodeReviewer.js) aiemmin
 * identtisenä toistuneen paikallisen askOllama()-funktion yhdeksi
 * jaetuksi toteutukseksi - vain num_ctx vaihteli tiedostojen välillä,
 * joten se on ainoa parametroitu asetus.
 */
export async function chatWithOllama({

  model,

  systemPrompt,

  userMessage,

  numCtx = 4096,

}) {

  const response =
    await fetch(
      `${OLLAMA_BASE_URL}/api/chat`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          options: {
            temperature: 0.2,
            num_ctx: numCtx,
          },
        }),

      },
    )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Ollama error")
  }

  return String(data.message?.content || "").trim()

}