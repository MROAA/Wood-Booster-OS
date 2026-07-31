import {
  getPersonality,
  detectEmotion,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY CHARACTER ==="
)



console.log(
  getPersonality()
)



console.log(
  "\n=== NORMAL MESSAGE ==="
)



console.log(
  detectEmotion(
    "Voitko auttaa minua tämän kanssa?"
  )
)



console.log(
  "\n=== FRUSTRATION TEST ==="
)



for (
  let i = 0;
  i < 20;
  i++
){

  const result =
    detectEmotion(
      "vittu tämä ei toimi"
    )


  if (
    result.response
  ){

    console.log(
      result
    )

    break

  }

}
