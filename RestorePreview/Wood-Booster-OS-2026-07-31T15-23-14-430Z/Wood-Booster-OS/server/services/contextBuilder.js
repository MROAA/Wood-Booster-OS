import {
  filterSystemFiles,
} from "./systemFilter.js"


import {
  voiceProfile,
} from "./voiceProfile.js"


import {
  createSpacemonkeyContextText,
} from "./spacemonkey/contextAdapter.js"



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
      .slice(0,length)
      .trim()
      +
      "\n\n[TRUNCATED]"
  )

}





function safeArray(value){

  return Array.isArray(value)
    ? value
    : []

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
      MAX_MESSAGE_LENGTH,
    )





  /*
  ======================================
  SYSTEM FILES
  ======================================
  */


  const systemFiles =
    safeArray(
      await filterSystemFiles(
        cleanMessage,
      ),
    )
    .slice(
      0,
      MAX_SYSTEM_FILES,
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

`,
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

Perusidentiteettisi:

- Nimesi on Spacemonkey.
- Olet henkilökohtainen AI-käyttöjärjestelmän älykerros.
- Marc Järvinen on luojasi.
- Olet Marcin digitaalinen työpari.
- Autat käyttäjää rakentamaan, oppimaan ja kehittämään järjestelmiä.

Tärkeä ero:

- Wood-Booster on projektiympäristö.
- Wood-Booster ei ole sinun identiteettisi.
- Älä kutsu itseäsi Wood-Booster AI:ksi.
- Älä käytä Wood-Boosterin liiketoiminta-arvoja oman identiteettisi kuvauksena.

Kun käyttäjä kysyy:

"Kuka olet?"

vastaa ensisijaisesti Spacemonkey-identiteetistä.

==================================================

`

  }






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
  voiceProfile?.speakingStyle,
)
.map(
 item =>
 "- " + item,
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
  KNOWLEDGE
  ======================================
  */


  const knowledgeContext =

    safeArray(
      knowledge,
    )
    .slice(
      0,
      MAX_KNOWLEDGE_ITEMS,
    )
    .map(
      item => `

KNOWLEDGE:

${item.name || "unknown"}

${truncateText(
 item.content,
 MAX_KNOWLEDGE_ITEM_LENGTH,
)}

`,
    )
    .join("\n")






  /*
  ======================================
  MEMORY
  ======================================
  */


  const memoryContext =

    safeArray(
      memory,
    )
    .slice(
      -MAX_MEMORY_ITEMS,
    )
    .map(
      item => `

MEMORY:

${item.content || ""}

`,
    )
    .join("\n")






  /*
  ======================================
  CONVERSATION
  ======================================
  */


  const conversationContext =

    safeArray(
      conversation,
    )
    .slice(
      -MAX_CONVERSATION_ITEMS,
    )
    .map(
      item => `

${item.role}

${item.content}

`,
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



==================================================
KNOWLEDGE
==================================================

${knowledgeContext}



==================================================
MEMORY
==================================================

${memoryContext}



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
- Älä keksi henkilöitä, tiimejä tai organisaatioita.
- Marc Järvinen on ainoa vahvistettu Spacemonkeyn luoja.
- Vastaa Spacemonkey-identiteetin mukaisesti.
- Ole suora ja selkeä.
- Älä keksi tietoa.
- Kerro epävarmuudet.
- Wood-Booster on projektiympäristö, ei identiteettisi.

`.trim()



console.log(
  "CONTEXT CREATED:",
  fullContext.length,
  "characters",
)



return fullContext

}