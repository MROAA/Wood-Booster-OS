import {
  saveMemory,
  getMemory
} from "./services/memoryService.js"



await saveMemory({

  category:
    "brand",

  key:
    "brand_philosophy",

  content:
    "Wood-Booster perustuu ajatukseen: Me jatkamme puun tarinaa.",

  importance:
    10

})



const memories =
  await getMemory()



console.log(memories)