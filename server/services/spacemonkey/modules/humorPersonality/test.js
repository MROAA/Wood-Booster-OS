import {
  getHumorSettings,
  generateHumor,
} from "./index.js"



console.log(
  "=== SPACEMONEY HUMOR PERSONALITY ==="
)



console.log(
  getHumorSettings()
)



console.log(
  "\n=== HUMOR TEST ==="
)



for (
  let i = 0;
  i < 100;
  i++
){

  const result =
    generateHumor()


  if (
    result.triggered
  ){

    console.log(
      result
    )

    break

  }

}
