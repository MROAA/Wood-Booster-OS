/*
WOOD-BOOSTER HQ

STABLE BUILD CHECK

Vastuut:

- ajaa Vite buildin
- tunnistaa onnistuneen buildin
- luo vakaan palautuspisteen

Ei:

- muuta lähdekoodia
- tee palautuksia
*/


import {
  execFile,
} from "child_process"



import {
  createStableBuildCheckpoint,
} from "../server/services/aiBrainV2/services/systemPulse/stableBuildController.js"



function runCommand(
  command,
  args,
){

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      execFile(
        command,
        args,
        {
          cwd:
            process.cwd(),

          maxBuffer:
            1024 * 1024 * 100,
        },

        (
          error,
          stdout,
          stderr,
        ) => {

          if(error){

            reject({

              stdout,

              stderr,

              error:
                error.message,

            })

            return

          }


          resolve(stdout)

        },
      )

    },
  )

}



async function main(){

  console.log(
    "🔨 Running stable build check..."
  )


  try {


    await runCommand(
      "vite",
      [
        "build",
      ],
    )


    console.log(
      "✅ Build successful"
    )


    let commit =
      "unknown"


    try {

      commit =
        (
          await runCommand(
            "git",
            [
              "rev-parse",
              "HEAD",
            ],
          )
        ).trim()

    }
    catch(error){

      console.error(
        "⚠️ Could not determine git commit",
        error,
      )

    }


    const checkpoint =
      await createStableBuildCheckpoint({

        version:
          process.env.npm_package_version ||
          "unknown",


        commit,

      })



    console.log(
      checkpoint,
    )



    if(
      !checkpoint.success
    ){

      console.error(
        "❌ Stable build checkpoint failed"
      )


      process.exit(
        1,
      )

    }



    console.log(
      "🟢 Stable build registered"
    )


    process.exit(
      0,
    )


  }

  catch(error){


    console.error(
      "❌ Build failed",
      error,
    )


    process.exit(
      1,
    )

  }

}


main()
