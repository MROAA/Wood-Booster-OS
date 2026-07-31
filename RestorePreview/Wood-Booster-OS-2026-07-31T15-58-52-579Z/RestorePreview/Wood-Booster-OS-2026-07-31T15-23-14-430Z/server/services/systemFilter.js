import {
  getSystemFiles,
} from "./systemLoader.js"



/*
==================================================

WOOD-BOOSTER AI SYSTEM ROUTER

Järjestää systeemitason tiedon.

CORE:
aina mukana

DOMAIN:
tarvittaessa

AGENTS:
vain erillisillä pyynnöillä

==================================================
*/





const alwaysLoad = [

  "CORE_IDENTITY",

  "SYSTEM_RESPONSE_STYLE",

  "SYSTEM_TRUTH",

]







const categoryRules = [

  {

    name:
      "development",


    keywords:[

      "code",
      "koodi",
      "javascript",
      "react",
      "frontend",
      "backend",
      "server",
      "api",
      "bug",
      "error",
      "prisma"

    ],


    include:[

      "DEVELOPER",

      "IMPLEMENTATION",

      "API",

    ]

  },





  {

    name:
      "products",


    keywords:[

      "tuote",
      "tuotteet",
      "pöytä",
      "puu",
      "huonekalu",
      "materiaali",
      "valmistus",
      "suunnittelu"

    ],


    include:[

      "PRODUCT",

      "MATERIAL",

      "WORKSHOP",

      "BUSINESS"

    ]

  },






  {

    name:
      "finance",


    keywords:[

      "hinta",
      "hinnoittelu",
      "kate",
      "raha",
      "myynti",
      "talous",
      "finance"

    ],


    include:[

      "FINANCIAL",

      "BUSINESS",

      "DECISION"

    ]

  },







  {

    name:
      "brand",


    keywords:[

      "brändi",
      "filosofia",
      "arvot",
      "identiteetti",
      "tarina"

    ],


    include:[

      "BRAND",

      "PHILOSOPHY"

    ]

  },







  {

    name:
      "agents",


    keywords:[

      "agentti",
      "agent",
      "ceo",
      "strategia"

    ],


    include:[

      "AGENT"

    ]

  }

]









export async function filterSystemFiles(message) {


  const allFiles =

    await getSystemFiles()





  const text =

    message.toLowerCase()





  let selected = []








  /*
  =====================================
  1. CORE SYSTEM
  =====================================
  */


  selected.push(

    ...allFiles.filter(file =>

      alwaysLoad.some(tag =>

        file.name
          .toUpperCase()
          .includes(tag)

      )

    )

  )









  /*
  =====================================
  2. DOMAIN MATCHING
  =====================================
  */


  for (

    const rule of categoryRules

  ) {


    const matched =

      rule.keywords.some(keyword =>

        text.includes(keyword)

      )




    if (!matched) continue






    const files =

      allFiles.filter(file =>


        rule.include.some(tag =>

          file.name
            .toUpperCase()
            .includes(tag)

        )

      )



    selected.push(

      ...files

    )



    console.log(

      "SYSTEM CATEGORY:",

      rule.name

    )


  }









  /*
  =====================================
  3. ESTÄÄN AGENTTIVUOTO
  =====================================
  */


  const isAgentQuestion =

    categoryRules

      .find(rule =>

        rule.name === "agents"

      )

      ?.keywords

      .some(keyword =>

        text.includes(keyword)

      )






  if (!isAgentQuestion) {


    selected =

      selected.filter(file =>


        !file.name

          .toUpperCase()

          .includes("AGENT")


      )


  }









  /*
  =====================================
  4. DUPLICATE POISTO
  =====================================
  */


  selected =

    Array.from(

      new Map(

        selected.map(file => [

          file.name,

          file

        ])

      ).values()

    )









  console.log(

    "SYSTEM FILTER:",

    selected.length,

    "/",

    allFiles.length

  )



  console.log(

    selected.map(

      file => file.name

    )

  )





  return selected

}
