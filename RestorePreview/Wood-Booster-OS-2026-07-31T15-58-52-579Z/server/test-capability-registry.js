import {
  createCapabilityRegistry,
  getCapabilityByModuleId,
} from "./services/aiBrainV2/data/capabilityRegistry/capabilityRegistry.js"



console.log(
  "ALL CAPABILITIES"
)

console.dir(
  createCapabilityRegistry(),
  {
    depth:
      null,
  },
)



console.log(
  "MEMORY LEARNING"
)

console.dir(
  getCapabilityByModuleId(
    "memory-learning",
  ),
  {
    depth:
      null,
  },
)
