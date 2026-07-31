import {
  createCapabilityContext,
  getPrimaryCapability,
} from "./services/aiBrainV2/services/moduleCapability/moduleCapabilityAdapter.js"



const message =
  "Haluan muistaa uuden tuotteen suunnittelun"



console.log(
  "\nCAPABILITY CONTEXT\n",
)


console.dir(
  createCapabilityContext(
    message,
  ),
  {
    depth:
      null,

    colors:
      true,
  },
)



console.log(
  "\nPRIMARY CAPABILITY\n",
)


console.dir(
  getPrimaryCapability(
    message,
  ),
  {
    depth:
      null,

    colors:
      true,
  },
)
