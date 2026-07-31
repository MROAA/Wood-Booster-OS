import {
  resolveMemoryContext
} from "../context/resolvers/memoryResolver.js"



const memories = [

  {
    key:
      "wood-booster-project",

    content:
      "Wood-Booster OS frontend rakennetaan Reactilla.",

    importance:
      10

  },


  {
    key:
      "python-learning",

    content:
      "Marc opettelee Python ohjelmointia.",

    importance:
      7

  },


  {
    key:
      "coffee",

    content:
      "Kahvi kuuluu työpäivään.",

    importance:
      3

  }

]



console.dir(

  resolveMemoryContext({

    message:
      "Mitä tiedät Wood-Booster projektista?",

    memories

  }),

  {
    depth:null
  }

)
