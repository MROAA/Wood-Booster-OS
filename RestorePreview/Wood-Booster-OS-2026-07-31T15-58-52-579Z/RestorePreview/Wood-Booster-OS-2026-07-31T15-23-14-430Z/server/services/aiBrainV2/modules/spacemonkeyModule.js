/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY MODULE V2

Vastuut:
- tunnistaa Spacemonkeyta koskevat pyynnöt
- näyttää Spacemonkey Coren määritelmän
- näyttää identiteettirajat
- näyttää synergiaperiaatteet
- näyttää AI Constitutionin yhteenvedon
- kuvaa ihmisen ja koneen erillistä kasvua
- tarjoaa Knowledge Layer näkyvyyden

Tämä tiedosto ei:
- muuta Spacemonkey Core -periaatteita
- kirjoita tietokantaan
- tallenna pysyvää muistia
- lue yksityisiä tiedostoja
- käsittele salaisia tunnisteita
- kutsu kielimallia
- käsittele HTTP-pyyntöjä
- analysoi käyttäjän persoonaa
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"


import {
  getSpacemonkeyCore,
  getSpacemonkeyCoreSummary,
} from "../system/spacemonkeyCore.js"


import {
  getAIConstitution,
  getAIConstitutionSummary,
} from "../system/aiConstitution.js"


import {
  getSpacemonkeyKnowledge,
} from "../spacemonkey/spacemonkeyKnowledgeProvider.js"



const SPACEMONKEY_ACTIONS = {

  SHOW_SUMMARY:
    "show_summary",

  SHOW_DEFINITION:
    "show_definition",

  SHOW_IDENTITY_BOUNDARIES:
    "show_identity_boundaries",

  SHOW_SYNERGY_PRINCIPLES:
    "show_synergy_principles",

  SHOW_GROWTH_MODEL:
    "show_growth_model",

  SHOW_CONSTITUTION:
    "show_constitution",

}
const SUMMARY_PHRASES = [
  "näytä spacemonkey",
  "spacemonkey yhteenveto",
  "spacemonkey status",
  "spacemonkey tila",
]


const DEFINITION_PHRASES = [
  "mikä on spacemonkey",
  "mitä spacemonkey tarkoittaa",
  "selitä spacemonkey",
  "kerro spacemonkeysta",
  "kerro spacemonkey",
  "kerro mikä spacemonkey on",
  "mikä spacemonkey on",
  "selitä mikä spacemonkey on",
]

const IDENTITY_PHRASES = [
  "näytä identiteettirajat",
  "spacemonkey identiteetti",
  "mitkä ovat identiteettirajat",
  "ihmisen ja tekoälyn identiteetti",
  "marc ja tekoäly",
]


const SYNERGY_PHRASES = [
  "näytä synergiaperiaatteet",
  "mitä synergia tarkoittaa",
  "ihmisen ja koneen synergia",
  "spacemonkey synergia",
  "synergia ei symbioosi",
]


const GROWTH_PHRASES = [
  "miten ihminen ja kone kasvavat",
  "näytä kasvumalli",
  "spacemonkey kasvumalli",
  "ihmisen kasvu ja koneen kasvu",
  "miten järjestelmä kasvaa",
]


const CONSTITUTION_PHRASES = [
  "näytä ai constitution",
  "näytä constitution",
  "näytä tekoälyn perustuslaki",
  "mitkä ovat tekoälyn säännöt",
  "näytä ai brain säännöt",
]



function normalizeMessage(
  message,
) {

  return String(
    message ||
    "",
  )
    .trim()
    .toLowerCase()

}



function containsPhrase(
  message,
  phrases,
) {

  return phrases.some(
    (phrase) =>
      message.includes(
        phrase,
      ),
  )

}



function analyzeSpacemonkeyRequest(
  message,
) {

  const normalizedMessage =
    normalizeMessage(
      message,
    )


  if (!normalizedMessage) {

    return {

      matched:
        false,

      confidence:
        0,

      reason:
        "Viesti on tyhjä.",

      action:
        null,

    }

  }


  if (
    containsPhrase(
      normalizedMessage,
      CONSTITUTION_PHRASES,
    )
  ) {

    return {

      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää AI Constitutionia koskevan pyynnön.",

      action:
        SPACEMONKEY_ACTIONS
          .SHOW_CONSTITUTION,

    }

  }


  if (
    containsPhrase(
      normalizedMessage,
      IDENTITY_PHRASES,
    )
  ) {

    return {

      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää identiteettirajoja koskevan pyynnön.",

      action:
        SPACEMONKEY_ACTIONS
          .SHOW_IDENTITY_BOUNDARIES,

    }

  }


  if (
    containsPhrase(
      normalizedMessage,
      SYNERGY_PHRASES,
    )
  ) {

    return {

      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää synergiaperiaatteita koskevan pyynnön.",

      action:
        SPACEMONKEY_ACTIONS
          .SHOW_SYNERGY_PRINCIPLES,

    }

  }


  if (
    containsPhrase(
      normalizedMessage,
      GROWTH_PHRASES,
    )
  ) {

    return {

      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää ihmisen ja koneen kasvumallia koskevan pyynnön.",

      action:
        SPACEMONKEY_ACTIONS
          .SHOW_GROWTH_MODEL,

    }

  }


  if (
    containsPhrase(
      normalizedMessage,
      DEFINITION_PHRASES,
    )
  ) {

    return {

      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää Spacemonkeyn määritelmää koskevan pyynnön.",

      action:
        SPACEMONKEY_ACTIONS
          .SHOW_DEFINITION,

    }

  }


  if (
    containsPhrase(
      normalizedMessage,
      SUMMARY_PHRASES,
    )
  ) {

    return {

      matched:
        true,

      confidence:
        0.95,

      reason:
        "Viesti sisältää Spacemonkeyn yhteenvetopyynnön.",

      action:
        SPACEMONKEY_ACTIONS
          .SHOW_SUMMARY,

    }

  }


  return {

    matched:
      false,

    confidence:
      0,

    reason:
      "Viesti ei sisällä tunnistettua Spacemonkey-pyyntöä.",

    action:
      null,

  }

}
function createNumberedList(
  entries,
  valueKey =
    "principle",
) {

  return entries.map(
    (
      entry,
      index,
    ) => {

      const value =
        entry[valueKey] ||
        ""

      const explanation =
        entry.explanation
          ? ` ${entry.explanation}`
          : ""


      return `${index + 1}. ${value}${explanation}`

    },
  )

}



function createSummaryAnswer() {

  const spacemonkeySummary =
    getSpacemonkeyCoreSummary()


  const constitutionSummary =
    getAIConstitutionSummary()


  return [

    "Spacemonkey Core on aktiivinen.",

    "",

    spacemonkeySummary.definition,

    "",

    `Spacemonkey Core: ${spacemonkeySummary.version}`,

    `AI Constitution: ${constitutionSummary.version}`,

    `Identiteettirajoja: ${spacemonkeySummary.identityBoundaryCount}`,

    `Synergiaperiaatteita: ${spacemonkeySummary.synergyPrincipleCount}`,

    `Perustuslaillisia sääntöjä: ${constitutionSummary.ruleCount}`,

  ].join("\n")

}



function createDefinitionAnswer(
  core,
) {

  return [

    "Spacemonkey",

    "",

    core.definition,

    "",

    "Spacemonkey ei ole Marc.",

    "Spacemonkey ei ole tekoäly.",

    "Spacemonkey ei ole kielimalli.",

    "",

    "Se tarkoittaa ihmisen ja koneen yhteistyöstä syntyvää modulaarista synergiarakennetta.",

  ].join("\n")

}



function createIdentityBoundaryAnswer(
  core,
) {

  return [

    "Spacemonkeyn identiteettirajat:",

    "",

    ...createNumberedList(
      core.identityBoundaries,
    ),

  ].join("\n")

}



function createSynergyAnswer(
  core,
) {

  return [

    "Spacemonkeyn synergiaperiaatteet:",

    "",

    ...createNumberedList(
      core.synergyPrinciples,
    ),

  ].join("\n")

}



function createGrowthModelAnswer(
  core,
) {

  const human =
    core.growthModel.human


  const machine =
    core.growthModel.machine


  const synergy =
    core.growthModel.synergy


  return [

    "Spacemonkeyn kasvumalli",

    "",

    "IHMINEN",

    `Kasvun lähteet: ${human.growthSources.join(", ")}.`,

    human.responsibility,

    "",

    "KONE",

    `Kasvun lähteet: ${machine.growthSources.join(", ")}.`,

    machine.responsibility,

    "",

    "SYNERGIA",

    `Kasvun lähteet: ${synergy.growthSources.join(", ")}.`,

    synergy.responsibility,

  ].join("\n")

}



function createConstitutionAnswer(
  constitution,
) {

  const rules =
    constitution.rules
      .sort(
        (
          firstRule,
          secondRule,
        ) =>
          firstRule.order -
          secondRule.order,
      )
      .map(
        (rule) =>
          `${rule.order}. ${rule.title}: ${rule.rule}`,
      )


  return [

    "AI Constitution V1",

    "",

    ...rules,

  ].join("\n")

}





function createSpacemonkeyModule() {

  return createBrainModule({

    id:
      "spacemonkey",


    name:
      "Spacemonkey Module",


    version:
      "2.0.0",


    description:
      "Tarjoaa Spacemonkey Coren, identiteettirajojen, synergian, kasvumallin, AI Constitutionin ja Knowledge Layer näkyvyyden.",


    priority:
      90,



    canHandle({
      request,
    }) {

      const analysis =
        analyzeSpacemonkeyRequest(
          request?.message,
        )


      return {

        matched:
          analysis.matched,


        confidence:
          analysis.confidence,


        reason:
          analysis.reason,


        metadata:
          analysis.matched
            ? {
                action:
                  analysis.action,
              }
            : null,

      }

    },



    async execute({
      message,
      request,
      runtimeContext,
    }) {


      const analysis =
        analyzeSpacemonkeyRequest(
          message,
        )


      if (!analysis.matched) {

        throw new Error(
          "Spacemonkey Module ei tunnistanut pyyntöä.",
        )

      }



      const core =
        getSpacemonkeyCore()



      const constitution =
        getAIConstitution()



      const knowledge =
        getSpacemonkeyKnowledge({
          runtimeContext,
        })



      let answer =
        ""



      if (
        analysis.action ===
        SPACEMONKEY_ACTIONS
          .SHOW_SUMMARY
      ) {

        answer =
          createSummaryAnswer()

      }



      if (
        analysis.action ===
        SPACEMONKEY_ACTIONS
          .SHOW_DEFINITION
      ) {

        answer =
          createDefinitionAnswer(
            core,
          )

      }



      if (
        analysis.action ===
        SPACEMONKEY_ACTIONS
          .SHOW_IDENTITY_BOUNDARIES
      ) {

        answer =
          createIdentityBoundaryAnswer(
            core,
          )

      }



      if (
        analysis.action ===
        SPACEMONKEY_ACTIONS
          .SHOW_SYNERGY_PRINCIPLES
      ) {

        answer =
          createSynergyAnswer(
            core,
          )

      }



      if (
        analysis.action ===
        SPACEMONKEY_ACTIONS
          .SHOW_GROWTH_MODEL
      ) {

        answer =
          createGrowthModelAnswer(
            core,
          )

      }



      if (
        analysis.action ===
        SPACEMONKEY_ACTIONS
          .SHOW_CONSTITUTION
      ) {

        answer =
          createConstitutionAnswer(
            constitution,
          )

      }



      if (!answer) {

        throw new Error(
          "Spacemonkey Module sai tuntemattoman toiminnon.",
        )

      }



      return {

        type:
          "spacemonkey_result",


        mode:
          analysis.action,


        answer,


        coreVersion:
          core.version,


        constitutionVersion:
          constitution.version,


        knowledge: {

          enabled:
            knowledge.enabled,


          sources:
            knowledge.sources,


          characters:
            knowledge.characters,

        },


        requestId:
          request?.requestId ||
          null,


        source:
          runtimeContext?.source ||
          "ai-brain-v2",

      }

    },

  })

}



export {

  SPACEMONKEY_ACTIONS,

  analyzeSpacemonkeyRequest,

  createSpacemonkeyModule,

}
