import {
  resolveProjectContext
} from "../context/resolvers/projectResolver.js"



const projects = [

  {
    name:
      "Wood-Booster OS",

    description:
      "AI käyttöjärjestelmä React frontendillä ja Node backendillä."

  },


  {
    name:
      "Aurora-jokipöytä",

    description:
      "Puusta valmistettu premium jokipöytä."

  },


  {
    name:
      "Python harjoittelu",

    description:
      "Python ohjelmoinnin opiskelu."

  }

]



console.dir(

  resolveProjectContext({

    message:
      "Mitä tiedät Wood-Booster projektista?",

    projects

  }),

  {
    depth:null
  }

)
