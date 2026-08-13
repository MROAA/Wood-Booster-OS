# Spacemonkey-järjestelmien kartta

*Kirjoitettu: 2026-08-04. Tämä on kartoitusdokumentti, ei korjaussuunnitelma.*

## Selkokielinen tiivistelmä

Wood-Boosterissa pyörii tällä hetkellä **kaksi erillistä, molemmat oikeasti
käytössä olevaa tekoäly-järjestelmää**, jotka eivät täysin "tiedä" toisistaan.
Toinen hoitaa turvallisuutta, oikeuksia, muistia, päätöksentekoa ja
tietopankkia (44 reittiä). Toinen hoitaa identiteettiä, tilaa,
"tietoisuutta" ja itse chat-toimintoa (8 reittiä). Ne on yhdistetty
muutamalla käsin kirjoitetulla siltatiedostolla, ei siistillä
kerrosrakenteella. Useat käsitteet — muisti, persoona, tieto, identiteetti —
esiintyvät **molemmissa** järjestelmissä eri nimillä. Tämä on
todennäköisin syy siihen, että vastaukset (myös suomen kielen laatu)
vaikuttavat epäjohdonmukaisilta: mallille annettava konteksti voi tulla
kahdesta osittain päällekkäisestä lähteestä samanaikaisesti.

**Tämä dokumentti ei korjaa mitään.** Se on kartta, jonka päälle
seuraava vaihe voi suunnitella oikean korjauksen — arvailun sijaan tiedon
perusteella.

## Järjestelmätaulukko

| Puu | Tiedostoja | Kytketty mistä | Vastuualue |
|---|---|---|---|
| `server/services/spacemonkey/` (pienellä alkukirjaimella) | 439 | `spacemonkeyServerIntegrationRunner.js` (index.js:n rivi 74) + **44 mounted reittiä** | Turvallisuus, oikeudet, muisti, päätöksenteko, suoritus, tietopankki, snapshotit, ajonaikaisuus, kyvykkyydet |
| `server/services/aiBrainV2/system/spacemonkey/` | 146 | **8 mounted reittiä** + `ai-brain-chat.js` | Identiteetti, tila, ydin, "tietoisuus", chat |
| `server/services/aiBrainV2/spacemonkey/` (pieni silta) | 5 | Ei suoraan reittiä, adapteri kahden ison puun välillä | Tieto/konteksti-silta |
| `server/services/llmSystem/modules/spacemonkey/spacemonkeyModule.js` | 1 (204 riviä) | **Ei mistään** — katso alla | Ei vahvistettavissa, koska ei käytössä |

**Tarkennus verrattuna alkuperäiseen suunnitelmaan:** suunnitteluvaiheessa
oletettiin `llmSystem`-polun `spacemonkeyModule.js`:n olevan kolmas
oikeasti käytössä oleva kytkentäpiste. Tarkka jäljitys (jokainen import-
polku käytiin läpi manuaalisesti) osoitti tämän vääräksi: koko
`services/llmSystem/`-kansio on itsenäinen, oma moduulijärjestelmänsä
(oma `moduleLoader.js`, `moduleRegistry.js`, `llmOrchestrator.js`), johon
mikään `server/index.js`:stä tai mistään reitistä ei viittaa. Ainoa
ristiviittaus (`contextEngineInjectionAdapter.js`) kulkee `aiBrainV2`:sta
*sisään* `llmSystem`:iin, ei toisin päin, eikä itse
`contextEngineInjectionAdapter.js`:ää käytä mikään `llmSystem`:in
ulkopuolinen koodi. **Johtopäätös: tämä on neljäs, todennäköisesti
kuollut/kytkemätön spacemonkey-aiheinen sivujärjestelmä**, ei kolmas
elävä. Ei toimenpiteitä tässä vaiheessa (dokumentaatio-only-vaihe), mutta
kannattaa ottaa mukaan seuraavan siivouskierroksen "varmasti kuollut
koodi" -listalle samalla tarkistusmenetelmällä kuin isokirjaiminen
`spaceMonkey/`-poistossa käytettiin.

## Alirakenteet

### `server/services/spacemonkey/` (439 tiedostoa)

| Alikansio | Tiedostoja | Sisältö |
|---|---|---|
| `modules/` | 298 | 122 alikyvykkyyskansiota. Painottuu `personality*`-, `security*`-, `creator*`/`creatorIntelligence*`- ja `metaIntelligence`-nimisiin kognitiivisiin moottoreihin. `metaIntelligence/` yksin sisältää 69 tiedostoa. |
| `core/` | 7 | `coreRegistry.js`, `coreSnapshot.js`, `creatorCore.js`, `languageCore.js`, `personalityCore.js`, `philosophyCore.js`, `safetyCore.js` |
| `public/` | 2 | `publicContext.js`, `publicGuard.js` |
| `adapters/` | 1 | `cognitivePipelineAdapter.js` |
| (irralliset juuritiedostot) | ~130 | Käynnistys/elinkaari, API-katalogi/rekisteri, identiteettisilta/vartija, tietosovitin/lataaja, oppimisputki, snapshot/restore-ohjaimet |

**Havaittu epäsymmetria:** tässä puussa on kokonainen rinnakkainen
turvallisuuspino — 17 `security*`-alikansiota (`securityCore`,
`securityPolicyEngine`, `securityOrchestrator`, `securityDecisionRecord`,
`securityRuntimeMonitor` jne.) plus `permissionAwareness`,
`securityApprovalGateway`, `toolSecurityGateway` — jolla ei ole vastinetta
toisessa puussa.

### `server/services/aiBrainV2/system/spacemonkey/` (146 tiedostoa)

| Alikansio | Tiedostoja | Sisältö |
|---|---|---|
| `snapshots/` | 9 | Snapshot/restore-moottorit, audit, käytäntö, rekisteri |
| `identity/` | 8 | Ydinidentiteetti, genesis-identiteetti/alustus, identiteettirekisteri, lait, arvot — **sisältää duplikaatin, ks. alla** |
| `godfiles/` | 6 | `01_IDENTITY_GODFILE.md`, `02_PERSONALITY_GODFILE.md`, `03_VALUES_GODFILE.md`, `04_COMMUNICATION_GODFILE.md`, `05_DECISION_GODFILE.md`, `spacemonkey_identity.json` |
| `recovery/` | 4 | Palautuksen hyväksyntä/ohjain/palautusmoottori+suorittaja |
| `root/` | 3 | Tiedostojärjestelmä/tietokantasilta + manifesti |
| `dashboard/` | 1 | `spacemonkeySafetyDashboardService.js` |
| `persona/` | 1 | `spacemonkeyPersonaService.js` |
| (irralliset juuritiedostot) | ~114 | `spacemonkey*Engine.js`-tiedostoja: koodiputki/generointi/katselmointi, kognitiivinen sykli, päätöksenteko, muisti, suoritus, kojelauta, aktiviteetti |

**Vahvistettu bugilöydös:** `identity/`-kansiossa on kaksi tiedostoa,
jotka eroavat toisistaan vain kirjainkoolla: `spacemonkeylaws.js` ja
`spacemonkeyLaws.js`. Tarkistin molemmat suoraan (Askel 6:n
node --check-tarkistuksessa):
- `spacemonkeyLaws.js` (oikea kirjainkoko) on se, jota koodi oikeasti
  käyttää — 3 tiedostoa importtaa sitä
  (`spacemonkeyBehaviorGuard.js`, `spacemonkeyIdentity.js`,
  `spacemonkeyPersonalityEngine.js`).
- `spacemonkeylaws.js` (kaikki pienellä) **ei ole edes JavaScriptiä** —
  sisältö on selkokielistä tekstiä ("LAW 001..."), joka on vahingossa
  tallennettu `.js`-päätteisenä. Mikään ei viittaa siihen.
  Todennäköisesti aiemman käsin tehdyn kopioinnin jäänne.
  **Ei poistettu tässä vaiheessa** (rajattu koskemaan vain
  `.backup`/`.before-*`-nimeämiskäytäntöä), mutta hyvä kandidaatti
  seuraavaan siivouskierrokseen — Marcin päätettävissä erikseen.

## Siltatiedostot (kahden ison puun välillä)

Tarkka lista (`grep`-vahvistettu): `server/services/spacemonkey/`-puussa
seitsemän tiedostoa viittaa `aiBrainV2`-puuhun:

| Tiedosto | Mitä siirtää |
|---|---|
| `spacemonkeyKnowledgeIntegrationAdapter.js` | Tietopankkidataa `aiBrainV2/system/spacemonkey/spacemonkeyKnowledgeIntegration.js`:stä |
| `brainBridge.js` | Yhdistää `aiBrainV2/brainRuntime.js`:ään ja `aiBrainV2/services/memoryBrainBridge.js`:ään |
| `spacemonkeyMemoryIntegration.js` | Muistidataa `aiBrainV2/services/memoryRuntimeAdapter.js`:sta ja `memoryRuntimeInjectionAdapter.js`:sta |
| `spacemonkeyLoader.js` | Polkuviittaus `services/aiBrainV2/system/spacemonkey`-kansioon |
| `systemPrompt.js` | Lataa godfile-sisältöä `aiBrainV2/system/spacemonkey/spacemonkeyGodFileLoader.js`:n kautta |
| `spacemonkeySystemPulseIntegration.js` | System Pulse -tilaa |
| `adapters/cognitivePipelineAdapter.js` | `aiBrainV2/personality/spacemonkeyCognitivePipeline.js`:ään |

Lisäksi erillinen pieni silta `server/services/aiBrainV2/spacemonkey/`
(5 tiedostoa, ei alikansioita): `spacemonkeyKnowledgeProvider.js`,
`spacemonkeyBrainContextAdapter.js`, `spacemonkeyUnifiedContext.js` +
2 testitiedostoa. Tämä näyttää yrittävän tarjota "yhtenäisen kontekstin"
kahden puun välille, mutta on itse vain 5 tiedostoa — ei kata koko
päällekkäisyyttä.

## Päällekkäisyyskartta

Samat käsitteet esiintyvät kummassakin puussa **eri nimillä ja eri
toteutuksina**:

| Käsite | `services/spacemonkey/` (pienellä) | `aiBrainV2/system/spacemonkey/` |
|---|---|---|
| Muisti | `modules/memoryIntelligence/`, `creatorMemoryVault`, `personalityMemory` | `spacemonkeyMemoryConsolidation.js`, `spacemonkeyMemoryIntelligenceBridge.js`, useita muita `*Memory*Engine.js`-tiedostoja |
| Tieto/knowledge | `modules/knowledgeIntelligence/`, `creatorKnowledgeVault`, `creatorKnowledgeGraph`, `securityKnowledgeBase`, `personalKnowledgeBase` | `spacemonkeyKnowledgeIntegration.js` |
| Persoona/identiteetti | `core/personalityCore.js`, 18 `personality*`-alikansiota `modules/`:ssa | `identity/`-kansio kokonaan, `persona/spacemonkeyPersonaService.js`, `spacemonkeyPersonalityEngine.js` |
| Turvallisuus | Koko oma pino (17 `security*`-alikansiota) | Ei vastinetta — vain `05_DECISION_GODFILE.md` sivuaa aihetta |
| Suoritus/päätöksenteko | `modules/execution/`, `modules/decision*` | `spacemonkeyExecutionController.js`, `spacemonkeyDecisionEngine.js`, `spacemonkeyExecutionDecisionEngine.js` ym. — tälle puolelle keskittynyt vahvemmin |

**Tämä on todennäköisin syy epäjohdonmukaiseen käytökseen ja
suomen kielen laatuvaihteluun**, koska malliin syötettävä konteksti voi
koota tietoa kahdesta osittain ristiriitaisesta lähteestä riippuen siitä,
mikä reitti/moduuli sattuu käsittelemään kysymystä. **Korjaus (yhdistäminen
tai selkeä vastuunjako) on oma, myöhempi vaihe — ei tehdä tässä.**

## Mitä TÄSSÄ vaiheessa ei tehty

- Ei koodimuutoksia kumpaankaan isoon puuhun (`services/spacemonkey/`,
  `aiBrainV2/system/spacemonkey/`).
- Ei kosketa `Spacemonkey/PERSONAL/`-kansioon.
- Ei kosketa julkiseen WordPress-rajapintaan (`publicSpacemonkeyRouter`).
- Ei yhdistämis- tai refaktorointiyritystä — tämä dokumentti on kartta,
  ei korjaus.
- `spacemonkeylaws.js`-duplikaattia ja `services/llmSystem/`-järjestelmää
  ei poistettu, vaikka molemmat vaikuttavat kuolleelta/virheelliseltä —
  jätetty Marcin päätettäväksi seuraavassa siivouskierroksessa.
