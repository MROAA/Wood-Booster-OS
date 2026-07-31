import {
  getCybersecurityCapability,
  findCybersecurityCapability,
  getCapabilitiesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY CYBERSECURITY CAPABILITY ==="
)



console.log(
  getCybersecurityCapability()
)



console.log(
  "\n=== THREAT MODELING ==="
)



console.log(
  findCybersecurityCapability(
    "threat-modeling"
  )
)



console.log(
  "\n=== AI SECURITY ==="
)



console.log(
  getCapabilitiesByCategory(
    "ai"
  )
)
