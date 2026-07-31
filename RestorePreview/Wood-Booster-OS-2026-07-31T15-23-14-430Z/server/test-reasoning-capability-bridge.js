import {
  enrichReasoningResult,
} from "./services/aiBrainV2/services/moduleCapability/reasoningCapabilityBridge.js"



const result =
  enrichReasoningResult({

    message:
      "Haluan muistaa uuden tuotteen suunnittelun",


    reasoningResult: {

      type:
        "reasoning_result",


      analysis: {

        intent:
          "memory_learning",

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
