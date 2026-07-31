# Wood-Booster OS — Arkkitehtuurikartta (Vaihe 2)
2026-07-29 — laadittu koodista jäljittäen, ei oletuksista

---

## 1. NYKYINEN JÄRJESTELMÄ (todennettu, aidosti ajossa)

### 1.1 Kaksi rinnakkaista AI-ketjua — tämä on tärkein löydös

Järjestelmässä on **kaksi erillistä, molemmat aidosti aktiivista** AI-reittiä. Ne eivät tällä hetkellä kutsu toisiaan.

**Reitti A — `/api/agents/chat`** (vanhempi, Rakenteet 17.7.txt kuvaa tätä)
```
POST /api/agents/chat
  -> routes/agentChat.js
      -> services/agentExecutor.js
          -> agentRouter.js          (valitsee: product / workshop / pricing / crm)
          -> agents/workshopAgent.js, productAgent.js, pricingAgent.js
          -> truthBundle.js          (productTruth, workshopTruth, brandTruth,
                                       businessTruth, decisionTruth)
          -> grounding/groundingEngine.js   (estää AI:ta keksimästä ohjeita)
          -> spacemonkey/identityBridge.js + identityGuard.js
          -> spacemonkeyGodFileLoader.js
```
Tämä on Truth/Grounding-painotteinen: agentti + totuuslähde + estä hallusinointi.

**Reitti B — `/api/ai-brain-v2`** (uudempi, moduulirekisteripohjainen)
```
POST /api/ai-brain-v2/chat
  -> routes/ai-brain-v2.js
      -> services/aiBrainV2/index.js
          -> moduleRegistry.js + brainRuntime.js
          -> registerDefaultModules.js rekisteröi 9 moduulia:
             spacemonkeyModule, credentialsModule, decisionModule,
             reasoningModule, finnishLanguageModule, memoryLearningModule,
             actionModule, memoryModule, conversationModule
```
Tämä on moduulipohjainen, laajennettava, ja lähempänä promptisi tavoiterakennetta.

**Miksi tämä on huomionarvoista:** promptisi tavoiterakenteessa AI Brain on yksi
keskuskone, jonka alla Knowledge/Memory/Truth/Decision/Agent/Tool/Security-kerrokset
elävät. Todellisuudessa nämä kerrokset ovat jakautuneet kahden erillisen,
toisistaan tietämättömän järjestelmän kesken. Kumpikaan ei ole "väärä" — ne
vain ratkaisevat eri ongelmaa (A = groundattu agenttivastaus, B = laajennettava
moduulialusta) eivätkä puhu toisilleen.

### 1.2 Kerroskartta: promptin tavoite vs. todellinen sijainti

| Tavoitekerros | Missä oikeasti asuu nyt | Tila |
|---|---|---|
| **Knowledge Layer** | `server/ai-knowledge/` (180+ tiedostoa) luetaan `services/knowledgeReader.js`:llä. Myös `aiBrainV2/knowledge/` (candidateExtractor, validator, pipeline, proposalService) | ✅ Aidosti kytketty, hyväkuntoinen |
| **Memory Layer** | `services/memoryModule.js`, `memoryLearningModule.js`, `aiBrainV2/services/memory*.js`, `aiBrainV2/engines/memoryIntentEngine.js` + Prisma-taulut (AiMemory, MemoryProposal) | ✅ Kytketty Reitti B:hen |
| **Truth Layer** | `services/truthBundle.js`, `truthRouter.js`, `*Truth.js`-tiedostot, `grounding/` | ✅ Kytketty Reitti A:han, EI kytketty Reitti B:hen |
| **Decision Layer** | `aiBrainV2/modules/decisionModule.js`, `agentRules.js`, `agentLaws/*.js` (8 "lakia": core, decision, hallucination, memory, output, promptInjection, role, security, source) | ✅ Kytketty, mutta hajautunut kahteen paikkaan |
| **Agent Layer** | `agentRouter.js` + `agents/{product,workshop,pricing}Agent.js` | ✅ Kytketty, vain Reitti A:ssa |
| **Tool Layer** | — | ❌ **Ei ole olemassa.** Ei tool-rekisteriä, ei tool-callingia missään koodissa (varmistettu grepillä koko repon läpi) |
| **Security Layer** | `capabilityPermissionLayer.js`, `credentialsModule/credentialsService.js`, `agentLaws/securityLaw.js`, `promptInjectionLaw.js` | ⚠️ Osittainen, ei yhtenäinen rajapinta |
| **Module System / Projects** | `routes/projects.js` + Prisma (Project, ProjectMaterial, ProjectFile, WorkflowStep) | ✅ |
| **Module System / Customers** | Prisma-migraatiot `add_customers`, `add_customer_projects` | ✅ |
| **Module System / Materials** | `routes/inventory.js` + `ai-knowledge/products/materials.txt` | ✅ |
| **Module System / Personal Knowledge** | `ai-knowledge/Marc Järvinen.txt`, `system/MARC_IDENTITY.txt` | ✅ |
| **Module System / System Knowledge** | `ai-knowledge/system/*.txt` (~60 tiedostoa) | ✅ |
| **Operaattori (Spacemonkey)** | `services/spacemonkey/spacemonkeyServerIntegrationRunner.js` → `spacemonkeySystemIntegration.js` → mounttaa dynaamisesti suuren osan `routes/spacemonkey*.js`-reiteistä | ✅ Kytketty, mutta rinnakkain molempien AI-reittien kanssa, ei selkeästi niiden "yläpuolella" niin kuin promptisi kuva esittää |

### 1.3 Frontend

`src/pages/`: Dashboard, Projects, ProjectDetails, Customers, CustomerDetails,
Materials, Inventory, Purchases, AIBrain, AIChat, AIGenerator, AIWorkspace,
Agents, Knowledge, Memory, MemoryReview, Spacemonkey, SystemCenter,
CapabilityCenter, ExecutionCenterV2, Tools, Settings.

Sivuja on jo enemmän kuin `Rakenteet 17.7.txt`:ssä lueteltu — projekti on
edennyt muistiinpanojesi jälkeen. `Tools.jsx` on olemassa frontendissä, mutta
sille ei ole vastaavaa backend-rajapintaa (ks. Tool Layer yllä).

---

## 2. PUUTTUVAT / KESKENERÄISET OSAT

1. **Tool Layer puuttuu kokonaan backendistä.** Frontendissä on `Tools.jsx`,
   mutta ei tool-rekisteriä, ei tool-execution-rajapintaa, ei tool-calling-
   mekanismia AI Brainissa. Tämä on suurin todellinen aukko promptisi
   tavoiterakenteeseen nähden.

2. **Reitti A ja Reitti B eivät tiedä toisistaan.** Truth/Grounding-kerros
   (paras suoja hallusinaatiota vastaan) on vain Reitti A:ssa. Uudempi,
   laajennettava moduulialusta (Reitti B) ei hyödynnä sitä. Jos AI Brain V2
   kasvaa pääjärjestelmäksi, se menettää groundausturvan ellei Truth Layer
   kytketä siihen.

3. **Security Layer on hajanainen.** `agentLaws/securityLaw.js` ja
   `promptInjectionLaw.js` ovat olemassa, mutta niitä ei ole koottu
   promptisi kuvaamaksi yhtenäiseksi `security/permissions, validation,
   sandbox`-kokonaisuudeksi.

4. **Spacemonkey ei ole muodollisesti "operaattori AI Brainin yläpuolella".**
   Se on tällä hetkellä kolmas rinnakkainen järjestelmä, joka mountataan
   `index.js`:ssä samalla tasolla kuin muut reitit — ei niin että se
   ohjaisi tai reitittäisi kumpaakaan AI-ketjua.

---

## 3. INTEGRAATIOSUUNNITELMA (turvallinen, ei rikkova)

Periaate: **ei yhdistetä Reitti A:ta ja B:tä yhdellä isolla refaktorilla.**
Sen sijaan rakennetaan silta, joka antaa Reitti B:n (moduulialusta, joka on
lähempänä tavoitearkkitehtuuriasi) käyttää Reitti A:n Truth/Grounding-kerrosta
palvelun kautta — kumpikaan olemassa oleva reitti ei muutu.

**Askel 1 (pienin toimiva muutos, promptisi Vaihe 4:n periaatteen mukaisesti):**
Uusi tiedosto `services/aiBrainV2/modules/truthModule.js`, joka:
- tuo `getTruthBundle` tiedostosta `truthBundle.js` (vain luku, ei muutu)
- tuo `buildGroundedContext` tiedostosta `grounding/groundingEngine.js`
- rekisteröityy `registerDefaultModules.js`-listaan yhtenä uutena moduulina
- EI muuta `agentExecutor.js`:ää, `truthBundle.js`:ää eikä mitään Reitti A:n
  tiedostoa

Tämä on juuri sellainen eristetty, poistettavissa oleva, testattavissa oleva
muutos jota alkuperäinen briiffisi vaatii — yksi uusi tiedosto, yksi rivi
lisäys rekisteröintilistaan, ei mitään olemassa olevaa riittelevää koodia.

**Kun Askel 1 on testattu ja toimii**, seuraavat kandidaatit (ei vielä tehty,
päätetään yksi kerrallaan):
- `toolModule.js` — Tool Layerin ensimmäinen versio, luultavasti aluksi
  yksi konkreettinen työkalu (esim. "hae projektin tila") ennen yleistä
  rekisteriä
- Security-kerroksen kokoaminen agentLaws-tiedostoista yhdeksi rajapinnaksi,
  jota molemmat reitit voivat kutsua

---

## Yhteenveto

Perusta on parempi kuin kansiorakenne antaa ymmärtää: Knowledge, Memory,
Truth, Decision ja Agent -kerrokset ovat kaikki olemassa ja toimivat — ne
ovat vain kahdessa erillisessä järjestelmässä eivätkä yhdessä. Puuttuu
oikeastaan vain kaksi asiaa: Tool Layer (ei ole vielä alkanutkaan) ja silta
Reitti A:n ja B:n välillä. Kumpaakaan ei tarvitse rakentaa isolla
uudelleenkirjoituksella.
