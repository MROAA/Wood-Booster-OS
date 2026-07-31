import {
  getBehaviors,
  checkBehavior,
} from "./index.js"



console.log(
  "=== SPACEMONEY BEHAVIOR RESPONSE MODIFIER ==="
)



console.log(
  getBehaviors()
)



console.log(
  "\n=== TEST: EN OSAA ==="
)



for (
  let i = 0;
  i < 200;
  i++
){

  const result =
    checkBehavior(
      "en osaa tätä vielä"
    )


  if (
    result.triggered
  ){

    console.log(
      result
    )

    break

  }

}



console.log(
  "\n=== NORMAL MESSAGE ==="
)



console.log(
  checkBehavior(
    "opeta minulle javascript"
  )
)
