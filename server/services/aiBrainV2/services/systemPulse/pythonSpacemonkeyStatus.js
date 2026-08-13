/*
WOOD-BOOSTER HQ

SYSTEM PULSE

PYTHON SPACEMONKEY STATUS BRIDGE

Vastuut:

- kutsuu Python-Spacemonkeytä (src/spacemonkey/) turvallisesti
- palauttaa sen tilan Node-puolelle System Pulseen

Ei:

- suorita mielivaltaista Python-koodia
- muuta Python-puolen tilaa
- käynnistä pysyvää Python-prosessia
*/


import {
  execFile,
} from "child_process"

import path from "path"

import {
  fileURLToPath,
} from "url"



const PROJECT_ROOT =
path.resolve(
  path.dirname(
    fileURLToPath(import.meta.url),
  ),
  "../../../../..",
)



const STATUS_SCRIPT =
"spc_status.py"



function runPythonStatus(){

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      execFile(
        "python3",
        [
          STATUS_SCRIPT,
        ],
        {
          cwd:
            PROJECT_ROOT,

          timeout:
            5000,

          maxBuffer:
            1024 * 1024,
        },

        (
          error,
          stdout,
        ) => {

          if(error){

            reject(
              new Error(
                error.message,
              ),
            )

            return

          }


          try {

            resolve(
              JSON.parse(
                stdout,
              ),
            )

          }
          catch(parseError){

            reject(
              new Error(
                `Python-Spacemonkey palautti virheellisen JSON:in: ${
                  parseError.message
                }`,
              ),
            )

          }

        },
      )

    },
  )

}



export async function getPythonSpacemonkeyStatus(){

  try {

    const status =
      await runPythonStatus()


    if(
      status.error
    ){

      return {

        available:
          false,

        status:
          "facade_error",

        error:
          status.error,

        checkedAt:
          new Date()
            .toISOString(),

      }

    }


    return {

      available:
        true,

      status:
        "online",

      system:
        status,

      checkedAt:
        new Date()
          .toISOString(),

    }

  }

  catch(error){

    return {

      available:
        false,

      status:
        "unreachable",

      error:
        error.message,

      checkedAt:
        new Date()
          .toISOString(),

    }

  }

}
