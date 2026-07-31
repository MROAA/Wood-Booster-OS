import {
  getSystemArchitecture
} from "./services/llmSystem/core/systemArchitecture.js"



console.log("")

console.log(
  "🏗️ WOOD-BOOSTER AI ARCHITECTURE TEST"
)

console.log(
  "=================================="
)





function runTest(){


  const architecture =
    getSystemArchitecture()



  console.log("")

  console.log(
    "SYSTEM:"
  )


  console.log(
    architecture.name
  )



  console.log("")

  console.log(
    "VERSION:"
  )


  console.log(
    architecture.version
  )



  console.log("")

  console.log(
    "LAYERS:"
  )



  Object.keys(
    architecture.layers
  )
  .forEach(
    layer => {

      console.log(
        "-",
        layer
      )

    }
  )



  console.log("")

  console.log(
    "PRINCIPLES:"
  )



  architecture.philosophy.principles
    .forEach(
      principle => {

        console.log(
          "-",
          principle
        )

      }
    )



  console.log("")

  console.log(
    "✅ ARCHITECTURE TEST COMPLETE"
  )


}





runTest()
