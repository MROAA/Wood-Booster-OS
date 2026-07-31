import {
  resolveSecurityContext
} from "../context/resolvers/securityResolver.js"



const testKnowledge = [

  {
    id:
      "AI SECURITY ENGINE.txt",

    category:
      "security",

    content:
      "Security rules"

  },


  {
    id:
      "API KEY PROTECTION ENGINE.txt",

    category:
      "general",

    content:
      "API protection"

  },


  {
    id:
      "PYTHON MASTER ENGINE.txt",

    category:
      "programming",

    content:
      "Python"

  }

]



console.dir(

  resolveSecurityContext({

    knowledge:
      testKnowledge

  }),

  {
    depth:null
  }

)
