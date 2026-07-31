import {
  createDecisionCapabilityContext,
} from "./services/aiBrainV2/services/moduleCapability/decisionCapabilityContext.js"



const result =
  createDecisionCapabilityContext(
    "Haluan muistaa uuden tuotteen suunnittelun",
  )


console.dir(
  result,
  {
    depth:
      null,

    colors:
      true,
  },
)
