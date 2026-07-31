# Wood-Booster AI Brain V2 – Arkkitehtuuridokumentti

Päivitetty: Vaihe 3 jälkeen (decisionOverrideBridge kytketty ja vahvistettu)

## 1. Ydinpipeline

Tiedosto: server/services/aiBrainV2/brainPipeline.js
Funktio: runBrainPipeline({ message, source, runtimeContext })

Nykyinen suoritusjärjestys:

1. Viesti normalisoidaan ja validoidaan
2. ensureDefaultBrainModules() varmistaa moduulit ladatuiksi
3. analyzeInteraction() -> interaction stage
4. executeBrainModuleById("reasoning") -> reasoning stage
5. enrichReasoningResult() (reasoningCapabilityBridge) rikastaa reasoning-tuloksen capabilityContextilla
6. executeBrainModuleById("decision") -> decision stage
   - saa runtimeContextissa: reasoningAnalysis, capabilityContext
7. applyCapabilityOverride() (decisionOverrideBridge) tarkistaa raa'an decisionOutputin
   ja ohittaa "conversation" oletusvalinnan jos capability-kerros loysi vahvan osuman
8. Jos decision === "clarify" -> pipeline pysahtyy turvallisesti (clarification_required)
9. Muuten targetModule suoritetaan executeBrainModuleById(targetModule) -> execution stage
10. Palautetaan finalOutput + kaikki stage-tulokset (jaljitettavyys)

Jokainen stage tallentuu stages-objektiin: interaction, reasoning, decision, execution.

HUOM: aiBrain.js-tiedostoa EI ole olemassa. Pipelinen ydin on brainPipeline.js.

## 2. Capability-kerros

Sijainti: server/services/aiBrainV2/services/moduleCapability/

### moduleCapabilityResolver.js
- Lukee moduulit moduleDataLayer.js:sta
- Pisteyttaa moduulit avainsanaosumien perusteella (MODULE_INTENTS)
- Palauttaa matches[]: {id, name, score, description}
- STATUS: Testattu, toimii (Vaihe 2)

### moduleCapabilityAdapter.js
- Kutsuu resolveria
- Muotoilee tuloksen capabilities[]-muotoon: {moduleId, moduleName, confidence, description}
- getPrimaryCapability() palauttaa parhaan osuman
- STATUS: Testattu, toimii (Vaihe 2)

### decisionCapabilityContext.js
- Rakentaa decisionContext-objektin: {availableCapabilities, primaryCapability, source, version}
- STATUS: Testattu, toimii (Vaihe 2)

### decisionModuleAdapter.js
- Muotoilee decisionContext:n Decision Modulelle sopivaksi input-objektiksi
- getPrimaryDecisionModule() apufunktio
- STATUS: Testattu, toimii (Vaihe 2)

### decisionCapabilityBridge.js
- enrichDecisionRuntimeContext() lisaisi capabilityn suoraan runtimeContextiin
- STATUS: Testattu (Vaihe 2), mutta EI KAYTOSSA pipelinessa (dead code, jatkuvasti)

### reasoningCapabilityBridge.js
- enrichReasoningResult() yhdistaa reasoning-tuloksen + capabilityContextin
- STATUS: Testattu, KAYTOSSA brainPipeline.js:ssa

### decisionOverrideBridge.js (UUSI, Vaihe 3)
- applyCapabilityOverride({ decisionOutput, capabilityContext })
- Vastuu: jos Decision Module paatyi epavarmaan "conversation" oletusvalintaan JA
  capability-kerros loysi vahvan osuman (confidence >= 10) tunnetulle kohdemoduulille,
  ohittaa valinnan ja vaihtaa targetModule-kentan oikeaksi.
- Ei koskaan ohita jo tehtya tasmallista valintaa (esim. credentials, action).
- Ei koskaan muuta decisionModule.js:aa.
- Mappaus capability-tunnisteesta kohdemoduuliin: CAPABILITY_TO_TARGET_MODULE
  - "memory-learning" -> "memory-learning" (KORJATTU Vaihe 3:ssa, oli virheellisesti "memory")
  - "memory" -> "memory"
  - "credentials" -> "credentials"
  - "action" -> "action"
  - "conversation" -> "conversation"
  - "spacemonkey" -> "spacemonkey_identity"
- STATUS: Testattu erikseen JA testattu koko pipelinen lapi. TOIMII.
- KYTKETTY: brainPipeline.js:aan (rivit ~471-509, muuttuja nimeltä decisionOutput,
  raaka tulos valilla nimella rawDecisionOutput)

## 3. Tarkka loydos: memory-learning vs memory

Jarjestelmassa on kaksi eri muistiin liittyvaa moduulia:
- "memory" (memoryModule.js): hallitsee HYVAKSYTTYJA muistoja ja odottavia ehdotuksia
  (listaa, hyvaksy, hylkaa). EI osaa luoda uutta muistiehdotusta raakatekstista.
- "memory-learning" (memoryLearningModule.js): luo UUSIA muistiehdotuksia kayttajan
  suorista muistipyynnoista (esim. "muista tama asia").

decisionOverrideBridge.js mappasi alun perin capability-tunnisteen "memory-learning"
vaarin kohdemoduuliin "memory". Korjattu osoittamaan oikeaan "memory-learning"-moduuliin.

## 4. Nykyinen datavirta capabilityn osalta

message
  -> reasoning (executeBrainModuleById)
  -> enrichReasoningResult(reasoningResult.output, message)
       -> kutsuu sisaisesti createDecisionModuleInput()
            -> decisionCapabilityContext -> moduleCapabilityAdapter -> moduleCapabilityResolver
  -> enrichedReasoning.capabilityContext
  -> decision runtimeContext.capabilityContext (informatiivinen, decisionModule.js ei kayta sita)
  -> decision (executeBrainModuleById) -> rawDecisionOutput
  -> applyCapabilityOverride(rawDecisionOutput, enrichedReasoning.capabilityContext) -> decisionOutput
  -> targetModule (mahdollisesti ohitettu) suoritetaan

## 5. Moduulit (execution-kohteet)

services/aiBrainV2/modules/:
- reasoningModule.js
- decisionModule.js (suojattu, ei muutettu)
- conversationModule.js (tunnettu legacy-bugi: kutsuu server/services/aiBrain.js:n
  runAIBrain-funktiota, joka viittaa maarittelemattomaan filterKnowledgeByTruth-funktioon.
  EI KORJATTU, koska aiBrain.js on suojattu eika liity capability-tyohon.)
- memoryModule.js (luettu, ei muutettu. Vaatii runtimeContext.prisma toimiakseen.)
- memoryLearningModule.js (luettu tunnistetta varten. Vaatii myos runtimeContext.prisma.)
- truthModule
- credentialsModule
- actionModule
- spacemonkeyModule

Naita EI muuteta ilman erillista analyysia (arkkitehtuurisaanto), lukuun ottamatta
tiedostoja jotka olemme itse luoneet capability-kerrokseen.

## 6. MVP-tila talla hetkella

Reasoning -> Capability -> Decision: TEHTY JA TESTATTU
Decision Override capability-osuman perusteella: TEHTY JA TESTATTU (Vaihe 3, uusi tiedosto)
Decision -> Execution (oikea moduuli valitaan): TEHTY, vahvistettu toimivaksi.
  HUOM: testeissa kaytetty runtimeContext ei sisalla Prisma-yhteytta, joten
  execution epaonnistuu tuotanto-Prisman puuttumiseen, ei koodivirheeseen.
Debug-tulostus (valittu moduuli, syy, confidence, capability, overrideApplied): EI VIELA TEHTY
Integraatiotesti koko ketjulle oikealla Prisma-yhteydella: SEURAAVA VAIHE (Vaihe 4)

## 7. Tunnetut, koskemattomat erilliset loydokset

- conversationModule.js -> aiBrain.js legacy-bugi (filterKnowledgeByTruth).
  Vaikuttaa vain jos targetModule paatyy "conversation":iin ilman capability-osumaa.
- memoryModule.js ja memoryLearningModule.js molemmat vaativat runtimeContext.prisma.
  Testiskripteissa tama pitaa antaa erikseen Vaihe 4:ssa.

## 8. Seuraavat MVP-vaiheet (suunnitelma)

- Vaihe 4: Decision -> Execution oikealla Prisma-yhteydella (varmistetaan etta
  memory-learning-moduuli suorittaa loppuun asti onnistuneesti)
- Vaihe 5: Integraatiotesti koko ketjulle (runBrainPipeline) useilla eri viesteilla
- Vaihe 6: Debug-tulostus lisataan pipelineen (valittu moduuli, syy, confidence,
  kaytetty capability, overrideApplied/overrideReason)
