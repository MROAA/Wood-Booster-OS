/*
=====================================
WOOD-BOOSTER AI BRAIN V2

TRUTH MODULE V1

Vastuut:
- tunnistaa kysymykset, joihin vanha
  Truth Layer (truthBundle.js) tietää
  virallisen vastauksen
- hakee Truth Bundlen olemassa olevalla,
  muuttumattomalla truthBundle.js:llä
- palauttaa faktat AI Brain v2:lle

Tämä tiedosto ei:
- muuta truthBundle.js:ää
- muuta workshopTruth.js:ää tai muita
  Truth-tiedostoja
- muuta agentExecutor.js:ää
- kutsu kielimallia
- kirjoita tietokantaan

Tämä on silta, ei uudelleenkirjoitus:
sama Truth Layer jota /api/agents/chat
jo käyttää, nyt myös AI Brain v2:n
käytettävissä.
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"

import {
  getTruthBundle,
} from "../../truthBundle.js"




function normalizeRequestMessage(
  request,
) {
  return String(
    request?.message ||
    "",
  ).trim()
}




function fetchTruthBundle(
  request,
) {
  const message =
    normalizeRequestMessage(
      request,
    )

  if (!message) {
    return null
  }

  return getTruthBundle(
    message,
  )
}




function hasTruthMatches(
  truthBundleResult,
) {
  return (
    truthBundleResult !== null &&
    Array.isArray(
      truthBundleResult?.truths,
    ) &&
    truthBundleResult.truths.length > 0
  )
}




function createTruthModule() {

  return createBrainModule({

    id:
      "truth",


    name:
      "Truth Module",


    version:
      "1.0.0",


    description:
      "Tarjoaa olemassa olevan Truth Layerin " +
      "(truthBundle.js) AI Brain v2:lle muuttamatta sitä.",


    priority:
      70,



    canHandle({

      request,

    }) {

      const truthBundleResult =
        fetchTruthBundle(
          request,
        )

      const matched =
        hasTruthMatches(
          truthBundleResult,
        )

      return {

        matched,

        confidence:
          matched
            ? 0.95
            : 0,

      }

    },



    async execute({

      request,

    }) {

      const truthBundleResult =
        fetchTruthBundle(
          request,
        )

      return {

        type:
          "truth_result",


        requestId:
          request.requestId,


        source:
          "truthBundle.js",


        truths:
          hasTruthMatches(
            truthBundleResult,
          )
            ? truthBundleResult.truths
            : [],

      }

    },

  })

}




export {
  createTruthModule,
}
