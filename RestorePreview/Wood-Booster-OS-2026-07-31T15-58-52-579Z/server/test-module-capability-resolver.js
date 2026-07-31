import {
  resolveModuleCapabilities,
} from "./services/aiBrainV2/services/moduleCapability/moduleCapabilityResolver.js"



const result =
  resolveModuleCapabilities(
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
