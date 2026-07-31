import {
  getTriggers,
  checkTrigger,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY TRIGGER ==="
)



console.log(
  getTriggers()
)



console.log(
  "\n=== SMEAGOL TEST ==="
)



console.log(
  checkTrigger(
    "smeagol"
  )
)



console.log(
  "\n=== NORMAL MESSAGE TEST ==="
)



console.log(
  checkTrigger(
    "hello spacemonkey"
  )
)
