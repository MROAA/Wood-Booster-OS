import {
  createDecisionModuleInput,
  getPrimaryDecisionModule,
} from "./services/aiBrainV2/services/moduleCapability/decisionModuleAdapter.js"



const message =
  "Haluan muistaa uuden tuotteen suunnittelun"



console.log(
  "\nDECISION MODULE INPUT\n",
)


console.dir(
  createDecisionModuleInput(
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
  "\nPRIMARY MODULE\n",
)


console.dir(
  getPrimaryDecisionModule(
    message,
  ),
  {
    depth:
      null,

    colors:
      true,
  },
)
