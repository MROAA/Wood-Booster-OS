/*
WOOD-BOOSTER HQ

SPACEMONKEY

BOOSTERVERSE COGNITIVE RUNTIME BOOTSTRAP

Vastuut:

- luo yhden Boosterverse SDK Runtime-instanssin
- rekisteröi attention/awareness/cognitive/context/memory/planner
  -moduulit siihen
- kutsuu runtime.initialize() kerran käynnistyksen yhteydessä, jotta
  moduulit saavat alkutilansa (esim. attention: { primary: null, ... })

Ei:

- kutsu runtime.start():a - se käynnistäisi jatkuvan tick-silmukan
  (oletuksena kerran sekunnissa) joka päivittäisi kaikkia kuutta
  moduulia jatkuvasti taustalla koko palvelimen elinkaaren ajan. Se on
  oma, isompi päätös eikä osa tätä kevyttä käynnistystä.

  Sen sijaan kutsutaan registry.startAll():a suoraan (sama metodi jota
  Runtime.start() itsekin kutsuisi) - tämä ajaa jokaisen moduulin
  oman start()-koukun oikeasti (Runtime.initialize() yksin ei riitä:
  ModuleRegistry.updateAll() ohittaa moduulit jotka eivät ole
  "started"-tilassa, joten pelkkä initialize() jättäisi POST /tick:in
  merkityksettömäksi no-opiksi). registry.startAll() itsessään ei
  koskaan käynnistä tick-silmukkaa - se on yksinomaan
  Runtime.start()-metodin oma lisäys, jota ei kutsuta täällä. Näin
  ks. routes/spacemonkeyCognitiveRuntime.js:n POST /tick oikeasti
  päivittää moduulien tilan pyynnöstä, mutta mitään ei tapahdu
  ilman sitä pyyntöä.
*/

import { Runtime } from "./sdk/index.js"

import AttentionEngine from "./modules/attention/AttentionEngine.js"
import AwarenessEngine from "./modules/awareness/AwarenessEngine.js"
import CognitiveEngine from "./modules/cognitive/CognitiveEngine.js"
import ContextEngine from "./modules/context/ContextEngine.js"
import MemoryEngine from "./modules/memory/MemoryEngine.js"
import PlannerEngine from "./modules/planner/PlannerEngine.js"


let cognitiveRuntime = null

let initializePromise = null


function getCognitiveRuntime() {

  if (!cognitiveRuntime) {

    cognitiveRuntime = new Runtime({
      id: "boosterverse-cognitive-runtime",
      name: "Boosterverse Cognitive Runtime",
      autoSnapshot: false,
    })

    cognitiveRuntime.registerModules([
      AwarenessEngine,
      AttentionEngine,
      CognitiveEngine,
      ContextEngine,
      MemoryEngine,
      PlannerEngine,
    ])

  }

  return cognitiveRuntime

}


async function ensureCognitiveRuntimeInitialized() {

  const runtime =
    getCognitiveRuntime()

  if (!initializePromise) {

    initializePromise =
      runtime.initialize()
        .then(()=>

          runtime.registry.startAll()

        )

  }

  await initializePromise

  return runtime

}


export {
  getCognitiveRuntime,
  ensureCognitiveRuntimeInitialized,
}
