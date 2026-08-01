import {
  getSecurityPulseStatus,
  getSecurityHealth,
} from "./services/aiBrainV2/services/systemPulse/securityMonitor.js"


console.log(
  "=== SYSTEM PULSE SECURITY TEST ===",
)


console.dir(
  getSecurityPulseStatus(),
  {
    depth:
      null,
  },
)


console.log(
  "\n=== SECURITY HEALTH ===",
)


console.dir(
  getSecurityHealth(),
  {
    depth:
      null,
  },
)
