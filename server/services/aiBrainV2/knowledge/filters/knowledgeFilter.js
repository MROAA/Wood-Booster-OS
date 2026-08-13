function normalizeText(value){

  return String(value || "")
    .toLowerCase()

}




const providerFiles = [

  "SYSTEM_RULES",
  "MEMORY_CONTEXT",
  "PROJECT_KNOWLEDGE"

]






const intentRules = {


  personality: {

    words:[

      "persoonallisuus",
      "persoona",
      "personality",
      "behavior",
      "käyttäytyminen",
      "voice",
      "identiteetti",
      "identity",
      "kuka olet",
      "mikä olet"

    ],


    categories:[

      "identity"

    ]

  },



  security: {

    words:[

      "turvallisuus",
      "suoja",
      "suojaa",
      "security",
      "guard",
      "protection",
      "jailbreak"

    ],


    categories:[

      "security"

    ]

  },



  coding: {

    words:[

      "python",
      "koodi",
      "code",
      "ohjelma",
      "program",
      "javascript",
      "cpp"

    ],


    categories:[

      "coding"

    ]

  }

}







function detectIntent(message){

  const text =
    normalizeText(
      message
    )


  for(
    const intent
    of Object.values(
      intentRules
    )
  ){

    if(
      intent.words.some(
        word =>
          text.includes(word)
      )
    ){

      return intent

    }

  }


  return {

    words:[],

    categories:[]

  }

}








function calculateScore(
  message,
  entry
){


  const text =
    normalizeText(
      message
    )


  const filename =
    normalizeText(
      entry.id
    )


  const content =
    normalizeText(
      entry.content
    )



  const intent =
    detectIntent(
      message
    )



  let score = 0



  /*
  Providerit alas,
  eivät saa täyttää hakua
  */


  if(
    providerFiles.includes(
      entry.id
    )
  ){

    score -= 50

  }





  /*
  Oikea kategoria
  */


  if(
    intent.categories.includes(
      entry.category
    )
  ){

    score += 100

  }






  /*
  Hakusanat tiedostonimestä
  */


  for(
    const word
    of intent.words
  ){

    if(
      filename.includes(
        word
      )
    ){

      score += 50

    }


    if(
      content.includes(
        word
      )
    ){

      score += 10

    }

  }






  /*
  Kysymyksen sanat
  */


  const queryWords =
    text.split(
      " "
    )



  for(
    const word
    of queryWords
  ){

    if(
      word.length < 4
    ){

      continue

    }


    if(
      filename.includes(
        word
      )
    ){

      score += 20

    }


    if(
      content.includes(
        word
      )
    ){

      score += 5

    }

  }






  return score

}








function filterKnowledge(
  message,
  index
){

  return index

    .map(
      entry => ({

        entry,

        score:
          calculateScore(
            message,
            entry
          )

      })
    )


    .filter(
      item =>
        item.score > 0
    )


    .sort(
      (a,b)=>
        b.score -
        a.score
    )


    .slice(
      0,
      10
    )


    .map(
      item =>
        item.entry
    )

}







export {

  filterKnowledge

}
