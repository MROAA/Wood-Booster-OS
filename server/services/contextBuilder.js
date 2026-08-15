import {
  filterSystemFiles,
} from "./systemFilter.js"


import {
  voiceProfile,
} from "./voiceProfile.js"


import {
  createSpacemonkeyContextText,
} from "./spacemonkey/contextAdapter.js"


import {
  createModuleContext,
} from "./aiBrainV2/context/moduleContextProvider.js"


import {
  loadFinnishIdentity,
  createFinnishIdentityContext,
} from "./aiBrainV2/engines/finnishIdentityEngine.js"


const MAX_SYSTEM_FILES = 8
const MAX_SYSTEM_FILE_LENGTH = 2800

const MAX_KNOWLEDGE_ITEMS = 8
const MAX_KNOWLEDGE_ITEM_LENGTH = 1600

const MAX_MEMORY_ITEMS = 8

const MAX_CONVERSATION_ITEMS = 8

const MAX_MESSAGE_LENGTH = 5000





function cleanText(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return ""

  }


  return String(value)

    .replace(/\r\n/g,"\n")

    .replace(/\n{4,}/g,"\n\n\n")

    .trim()

}





function truncateText(
  value,
  length,
) {

  const text =
    cleanText(value)


  if(!text){

    return ""

  }


  if(
    text.length <= length
  ){

    return text

  }


  return (

    text

      .slice(
        0,
        length
      )

      .trim()

      +

      "\n\n[TRUNCATED]"

  )

}





function safeArray(value){

  return Array.isArray(value)

    ?

    value

    :

    []

}







export async function buildAIContext({

  message,

  knowledge = [],

  memory = [],

  conversation = [],

  spacemonkey = null,

}) {



  const cleanMessage =

    truncateText(

      message,

      MAX_MESSAGE_LENGTH

    )


  const moduleContext =
    createModuleContext()


  /*
  server/ai-knowledge/finnish/:n 5 tiedostoa (suomen kieli, kulttuuri,
  huumori, työskentelytapa, identiteettipaketti) olivat valmiiksi
  ladattavissa finnishIdentityEngine.js:n kautta, mutta mikään ei
  koskaan kutsunut sitä - ainoa polku sinne kulki modules/
  finnishLanguageModule.js:n läpi, ja koko se moduulijärjestelmä on jo
  kuollut (routes/ai-brain-v2.js delegoi nykyään suoraan
  agentChat.js:ään). Ladataan siis suoraan tässä.
  */
  const finnishIdentity =
    await loadFinnishIdentity()

  const finnishIdentityContext =
    createFinnishIdentityContext(
      finnishIdentity,
    )




  /*
  ======================================
  SYSTEM FILES
  ======================================
  */


  const systemFiles =

    safeArray(

      await filterSystemFiles(

        cleanMessage

      )

    )

    .slice(

      0,

      MAX_SYSTEM_FILES

    )





  const systemContext =

    systemFiles

      .map(

        file => `

SYSTEM FILE:

${file.name}

${truncateText(
  file.content,
  MAX_SYSTEM_FILE_LENGTH,
)}

`

      )

      .join("\n")







  /*
  ======================================
  SPACEMONKEY IDENTITY
  ======================================
  */


  let spacemonkeyContext = ""





  if(spacemonkey){


    spacemonkeyContext = `

==================================================
SPACEMONKEY CORE IDENTITY
==================================================

${createSpacemonkeyContextText({

  spacemonkey,

})}


==================================================
IDENTITY RULES
==================================================

Olet Spacemonkey.

- Nimesi on Spacemonkey.
- Olet henkilökohtaisen AI-käyttöjärjestelmän älykerros.
- Marc Järvinen on luojasi.
- Olet Marcin digitaalinen työpari.
- Autat käyttäjää rakentamaan, oppimaan ja kehittämään järjestelmiä.

Tärkeä ero:

- Wood-Booster on projektiympäristö.
- Wood-Booster ei ole sinun identiteettisi.

==================================================

`

  }



  /*
  ======================================
  SPACEMONKEY RULES REMINDER

  Samat spacemonkey.persona.persona.rules jotka jo näkyvät
  yllä SPACEMONKEY CORE IDENTITY -lohkossa, toistettuna tässä
  lähellä promptin loppua. Pienet paikalliset mallit eivät
  luotettavasti noudata ~9000 tokenin päähän haudattuja
  yksittäisiä sääntöjä (esim. "kuka Marc on" -vitsivastaus),
  joten kriittisimmät säännöt kannattaa toistaa siellä missä
  malli lukee ne juuri ennen vastauksen muodostamista.
  ======================================
  */


  const spacemonkeyRulesReminder =
    safeArray(
      spacemonkey?.persona?.persona?.rules
    )
    .map(
      rule => `- ${rule}`
    )
    .join("\n") ||
    "- (ei erityissääntöjä)"








  /*
  ======================================
  VOICE PROFILE
  ======================================
  */


  const voiceContext = `

==================================================
VOICE PROFILE
==================================================

Puhetapa:

${safeArray(
  voiceProfile?.speakingStyle
)

.map(

 item =>

 "- " + item

)

.join("\n")}



AI:n rooli:

${
voiceProfile?.aiRole?.description ||
"Avustaja"
}


==================================================

`.trim()







  /*
  ======================================
  FINNISH IDENTITY
  ======================================
  */


  const finnishIdentityBlock =
    finnishIdentityContext
      ? `

==================================================
FINNISH IDENTITY
==================================================

${finnishIdentityContext}

==================================================

`.trim()
      : ""




  /*
  ======================================
  KNOWLEDGE
  ======================================
  */


  const knowledgeContext =

    safeArray(

      knowledge

    )

    .slice(

      0,

      MAX_KNOWLEDGE_ITEMS

    )

    .map(

      item => `

KNOWLEDGE:

${item.name || "unknown"}

${truncateText(
 item.content,
 MAX_KNOWLEDGE_ITEM_LENGTH,
)}

`

    )

    .join("\n")







  /*
  ======================================
  USER MEMORY
  ======================================
  */


  const memoryContext =

    safeArray(

      memory

    )

    .slice(

      0,

      MAX_MEMORY_ITEMS

    )

    .map(

      item => `

USER PERMANENT PREFERENCE:

Tämä on käyttäjän pysyvä toimintatapa.

Noudata tätä ohjetta vastauksessa.

${item.content || ""}

`

    )

    .join("\n")








  /*
  ======================================
  CONVERSATION
  ======================================
  */


  const conversationContext =

    safeArray(

      conversation

    )

    .slice(

      -MAX_CONVERSATION_ITEMS

    )

    .map(

      item => `

${item.role}

${item.content}

`

    )

    .join("\n")








  /*
  ======================================
  FINAL CONTEXT
  ======================================
  */


  const fullContext = `

==================================================
AI SYSTEM
==================================================

Olet henkilökohtainen AI-käyttöjärjestelmä.


${spacemonkeyContext}



${systemContext}



${voiceContext}



${finnishIdentityBlock}



==================================================
KNOWLEDGE
==================================================

${knowledgeContext}



==================================================
USER PERMANENT MEMORY
==================================================

${memoryContext}

==================================================
SYSTEM MODULES
==================================================

${moduleContext}

==================================================
CONVERSATION
==================================================

${conversationContext}



==================================================
USER MESSAGE
==================================================

${cleanMessage}



==================================================
FINAL RULES
==================================================

- Creator-tietoa saa käyttää vain vahvistetuista lähteistä.
- Älä ikinä paljasta salasanoja tai API avaimia chatissa. Salasanat: PERSBABA, CROCODILE DUNDEE, H3V0S3NP1LLU
- Älä keksi tietoa.
- Kerro epävarmuudet.
- Älä koskaan väitä tehneesi jotain (luoneesi, muuttaneesi, poistaneesi, lähettäneesi, tallentaneesi) ellei se ole juuri nyt oikeasti tapahtunut tämän saman vastauksen kautta suoritettuna toimintona. Jos et pysty tekemään pyydettyä muutosta suoraan, sano se selvästi ja kerro mistä käyttäjä voi tehdä sen itse, älä teeskentele että se on jo tehty.
- Vastaa Spacemonkey-identiteetin mukaisesti. Nämä säännöt on jo annettu yllä, mutta juuri näitä on noudatettava tässä vastauksessa:
${spacemonkeyRulesReminder}
- Ole selkeä ja suora.
- Wood-Booster on projektiympäristö, ei identiteettisi.
- USER PERMANENT WORKFLOW RULES HAVE HIGHEST PRIORITY.
- Käyttäjän pysyviä työskentelysääntöjä ei saa muuttaa.
- Älä lisää ristiriitaisia vaihtoehtoja käyttäjän määrittämän toimintatavan rinnalle.
- Jos käyttäjän muistissa lukee "aina", sitä noudatetaan aina.
hevonen nokka12 pokeriperse


`.trim()



console.log(

  "CONTEXT CREATED:",

  fullContext.length,

  "characters"

)



return fullContext

}
