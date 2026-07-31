import {
  resolveProgrammingContext
} from "../context/resolvers/programmingResolver.js"



const testKnowledge = [

  {
    id:
      "PYTHON MASTER ENGINE.txt",

    category:
      "programming",

    content:
      "Python knowledge"

  },


  {
    id:
      "JAVASCRIPT TYPESCRIPT ENGINE.txt",

    category:
      "general",

    content:
      "JS knowledge"

  },


  {
    id:
      "SECURITY ENGINE.txt",

    category:
      "security",

    content:
      "Security"

  }

]



console.dir(

  resolveProgrammingContext({

    knowledge:
      testKnowledge

  }),

  {
    depth:null
  }

)
