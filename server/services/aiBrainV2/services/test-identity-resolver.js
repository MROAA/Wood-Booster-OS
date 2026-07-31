import {
  resolveIdentityContext
} from "../context/resolvers/identityResolver.js"



const testKnowledge = [

  {
    id:
      "CORE IDENTITY.txt",

    category:
      "identity",

    content:
      "Spacemonkey identity"

  },


  {
    id:
      "PYTHON MASTER ENGINE.txt",

    category:
      "programming",

    content:
      "Python"

  },


  {
    id:
      "PERSONALITY ENGINE CORE.txt",

    category:
      "identity",

    content:
      "Personality"

  }

]



console.dir(

  resolveIdentityContext({

    knowledge:
      testKnowledge

  }),

  {
    depth:null
  }

)
