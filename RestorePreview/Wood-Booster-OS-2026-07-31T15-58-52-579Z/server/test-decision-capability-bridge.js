import {
  enrichDecisionRuntimeContext,
} from "./services/aiBrainV2/services/moduleCapability/decisionCapabilityBridge.js"



const result =
  enrichDecisionRuntimeContext({

    message:
      "Haluan muistaa uuden tuotteen suunnittelun",

    runtimeContext: {

      reasoningAnalysis: {

        intent:
          "memory",

        confidence:
          0.9,

      },

    },

  })



console.dir(
  result,
  {
    depth:
      null,

    colors:
      true,
  },
)
