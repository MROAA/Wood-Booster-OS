import {
  getStyleRules,
  applySentenceStyle,
} from "./index.js"



console.log(
  "=== SPACEMONEY SENTENCE STYLE MODIFIER ==="
)



console.log(
  getStyleRules()
)



console.log(
  "\n=== STYLE TEST ==="
)



for (
  let i = 0;
  i < 20;
  i++
){

  console.log(
    applySentenceStyle(
      "Rakennan seuraavan moduulin."
    )
  )

}
