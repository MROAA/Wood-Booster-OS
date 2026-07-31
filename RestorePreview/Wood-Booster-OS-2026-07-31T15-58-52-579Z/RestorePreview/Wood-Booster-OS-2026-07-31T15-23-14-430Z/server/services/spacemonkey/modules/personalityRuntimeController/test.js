import {
  createPersonalityContext,
  getPersonalityStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY RUNTIME CONTROLLER ==="
)



console.log(
  getPersonalityStatus()
)



console.log(
  "\n=== NORMAL MESSAGE ==="
)



console.log(
  createPersonalityContext(
    "Voitko auttaa minua oppimaan Pythonia?"
  )
)



console.log(
  "\n=== FRUSTRATION MESSAGE ==="
)



console.log(
  createPersonalityContext(
    "Vittu tämä ei toimi"
  )
)
