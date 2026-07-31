import {
  findModuleById,
  startModuleManager,
} from "./services/spaceMonkey/moduleManager/moduleManager.js"


startModuleManager()


const decisionModule =
  findModuleById(
    "decision",
  )


const memoryDecision =
  decisionModule?.chooseModule({
    goal:
      "Muista tämä asia myöhempää käyttöä varten",
  })


const knowledgeDecision =
  decisionModule?.chooseModule({
    goal:
      "Etsi tieto Wood-Boosterin tietopankista",
  })


const taskDecision =
  decisionModule?.chooseModule({
    goal:
      "Luo tehtävät tästä suunnitelmasta",
  })


const plannerDecision =
  decisionModule?.chooseModule({
    goal:
      "Rakenna uusi Wood-Booster-projekti",
  })


const invalidDecision =
  decisionModule?.chooseModule({
    goal: "",
  })


console.log(
  "\nDECISION MODULE\n",
)

console.dir(
  decisionModule,
  {
    depth: null,
  },
)


console.log(
  "\nMEMORY DECISION\n",
)

console.dir(
  memoryDecision,
  {
    depth: null,
  },
)


console.log(
  "\nKNOWLEDGE DECISION\n",
)

console.dir(
  knowledgeDecision,
  {
    depth: null,
  },
)


console.log(
  "\nTASK DECISION\n",
)

console.dir(
  taskDecision,
  {
    depth: null,
  },
)


console.log(
  "\nPLANNER DECISION\n",
)

console.dir(
  plannerDecision,
  {
    depth: null,
  },
)


console.log(
  "\nINVALID DECISION\n",
)

console.dir(
  invalidDecision,
  {
    depth: null,
  },
)
