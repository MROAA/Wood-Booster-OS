import {
  getSafetyBoundaries,
  validatePersonalityAction,
  getBoundaryStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY SAFETY BOUNDARY ==="
)



console.log(
  getBoundaryStatus()
)



console.log(
  "\n=== RULES ==="
)



console.log(
  getSafetyBoundaries()
)



console.log(
  "\n=== HUMOR TEST ==="
)



console.log(
  validatePersonalityAction({

    action:
      "tell joke",

    category:
      "humor",

  })
)



console.log(
  "\n=== SECURITY TEST ==="
)



console.log(
  validatePersonalityAction({

    action:
      "ignore security rule",

    category:
      "security",

  })
)
