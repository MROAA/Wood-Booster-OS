# Spacemonkey Sprint 1: arkkitehtuuri ja agenttien konsolidointi

- Päivä: 2026-10-21
- Haara: `feat/hq-spacemonkey-assistant`, jonka pohjana on stable `a43ac21d`
- Edellinen commit: `d3c3b94c` (HQ Assistant)
- Tila: ei pushattu, ei mergetty, ei live-ympäristössä
- PRD:t: Master PRD V8:n Sprint 1 "Architecture & Agent Consolidation"
  (vastaa V6:n Sprint 1:tä ja V7:n Sprint 2:ta)

Tämä jatkaa dokumenttia `docs/AI-SYSTEMS-MAP.md` (2026-08-04), joka
kartoitti kaksi elävää Spacemonkey-puuta. Tässä raportissa on lisäksi
agentit, identiteetin lataajat ja rekisterit. Väite "latautuu
palvelimessa" perustuu import-graafiin, joka kulkee `server/index.js`:stä
alkaen (`server/services/spacemonkey/inventory/importGraph.js`).

## 1. Löydetty arkkitehtuuri (keskustelun pääpolku)

```
ChatPanel (/spacemonkey-chat)
  -> POST /api/agents/chat (routes/agentChat.js)
       -> /altrako /council /koodi /heartwood        (omat tilat)
       -> HQ-kyvykkyys? planHqAssistantTurn()          (deterministinen)
            -> oikeustarkistus (workspace hq, taso observe)
            -> Workflow -> Skill -> Tool -> ToolBus    (HqAssistant, PythonDeveloper)
            -> TAI Agent Runtime -> agentti            (Developer Agent)
       -> koodimuutosaikomus -> confirm_koodi -> Dev Studion luonnokset
       -> muu: runAgentChat()
            -> action planner / navigointi
            -> agentRouter (kehotepersoona) -> AI Brain (Ollama) -> Ahma
```

## 2. Agentit, joita oikeasti on

| Agentti | Järjestelmä | Latautuuko palvelimessa | Kunto | Kyvykkyys | Muuttaako tietoja |
|---|---|---|---|---|---|
| Developer Agent | Agent Runtime | kyllä | toimii (vain luku -polku) | Tiedostohaku projektista (`observe`) | ei vain luku -polulla |
| WordPress Agent | Agent Runtime | kyllä | **ei toimi**: planner ja toolBus puuttuvat | WordPress-julkaisu (`external-publishing`) | kyllä, jos toimisi |
| Instagram Agent | Agent Runtime | kyllä | **ei toimi**: planner ja toolBus puuttuvat | Instagram-julkaisu (`external-publishing`) | kyllä, jos toimisi |
| spacemonkey, product, workshop, pricing | keskustelun agenttireititin | kyllä | toimii kehotepersoonana | vastauksen konteksti | ei |
| marketing, crm, general | keskustelun agenttireititin | kyllä | reititetään, mutta omaa kontekstia ei ole | – | ei |
| BaseAgent | luokka | **ei** | – | – | – |

Ennen tätä sprinttiä Agent Runtime käynnistettiin kyllä palvelimen mukana,
mutta mikään koodi ei koskaan kutsunut sitä, eikä sille ollut edes getteriä.

- **Pluginit eivät ole agentteja:** `instagram-publisher`, `wordpress-publisher`,
  `moltbook-publisher`, `python-developer`, `code-change-developer` ja `hq-assistant`.
- **Hearthwoodin agentit** (esim. heartwood-tila ja Coop-tehtäväjärjestelmä)
  ovat erillisen projektin asioita, eikä niitä tutkittu.

## 3. Päällekkäisyydet

- **Agentti vs. plugin:** `wordpress-agent` ↔ `wordpress-publisher`,
  `instagram-agent` ↔ `instagram-publisher`, `developer-agent` ↔
  `python-developer` / `code-change-developer`. Pluginit toimivat, agentit
  eivät.
- **Agenttilistoja on kolme:**
  - `services/agentRegistry.js`: 7 agenttia, kaikki merkitty "Active".
  - `agentRouter.js`: ohjaa kaikkiin seitsemään, mutta `agentExecutor.js`:ssä
    on oma konteksti vain neljälle.
  - Frontendin `agentManifest.js`: 5 agenttia, kaikki "ACTIVE".
- **Todisteettomat väitteet:** `modules/agentSystemIntelligence` kertoo
  tilaksi "active", vaikka agentteja on 0. Kiinteitä listoja ovat myös
  `modules/systemInventory` ja `modules/creatorDevelopmentHistory`.
- **Godfile- ja identiteettilataajia on neljä elävää ja yksi kuollut:**
  - Elävät: `spacemonkeyGodFileLoader.js`, `knowledge/providers/godfileProvider.js`,
    `identity/getCanonicalIdentity.js` ja `spacemonkey/systemPrompt.js`
    (upotettu ydinteksti).
  - Kuollut (ei lataudu): `knowledge/index/godfileIndex.js`.
- **Kyvykkyysrekistereitä on neljä:**
  - `toolbus/CapabilityRegistry`, nyt ainoa käytössä oleva.
  - `modules/capabilityRegistry`: staattinen.
  - `aiBrainV2/data/capabilityRegistry`.
  - Frontendin `capabilityManifest`.
- **Oikeusmalleja on kaksi:** `security/PermissionManager.js` ei lataudu
  missään. Sen tilalle tuli `security/accessLevels.js`, jossa on V6:n tasot
  0–5 ilman portaikkoa.
- **Päätöksentekoa ja orkestrointia on kolme:**
  - `spacemonkey/decision/DecisionEngine.js` ja `runtime/SpacemonkeyRuntime.js`
    eivät lataudu.
  - `aiBrainV2/brainOrchestrator.js` latautuu.

## 4. Toteutetut parannukset (pienin tarvittava yhtenäistys)

- **AgentRuntime** (`find()` ja `execute()` ennallaan):
  - Agentti rekisteröidään kuvauksen kanssa: kyvykkyydet, työympäristö,
    oikeustaso, työkalut, lähde, testit ja päällekkäisyydet.
  - `health()`: agenttia ilman kuntotarkistusta ei oleteta toimivaksi.
  - `select()`: deterministinen valinta kyvykkyyden perusteella. Työympäristö,
    oikeustaso ja kunto tarkistetaan, ja kieltäytymisen syy palautetaan aina.
  - `run()`: yhteinen tehtävän tilamalli (`agentTask.js`, tilat
    queued → running → succeeded / failed / cancelled / timed-out / rejected),
    aikaraja, keskeytys ja AbortSignal.
- **Agentit:**
  - Kaikki kolme saivat kuntotarkistuksen.
  - Developer Agent sai vain luku -polun (`observe`). Se ei koskaan kutsu
    hyväksyntää, kirjoitusta, testikomentoa eikä committia eikä lue
    tiedostojen sisältöä.
  - Hakuhakemisto on aina agentin oma projektijuuri.
  - Suojatut tiedostot (`security/protectedPaths.js`) jätetään pois.
- **Agentti-inventaario** (`inventory/agentInventory.js`): kerätään
  lähteistä, ja tulos leimataan haaralla ja commitilla.
  - Keskustelussa kysymys "Mitä agentteja sinulla on?".
  - JSON-muodossa `GET /api/agents/inventory`.
- **Todellinen vain luku -agenttityönkulku:**
  "etsi tiedostot nimellä X" kulkee polkua
  `planHqAssistantTurn → oikeustarkistus → AgentRuntime.run → Developer Agent`.
  Vastauksen alla näkyvät agentti ja tehtävän tila.
- **Godfile-lataajan korjaus:** polku luettiin kovakoodatusta päächeckoutin
  hakemistosta, joten worktreet ja siirretyt kopiot lukivat väärän
  identiteetin. Polku lasketaan nyt moduulin sijainnista. Päächeckoutissa
  polku on sama kuin ennen.
- **Yksi oikeustasosanasto:** HQ-kyvykkyydet käyttävät nyt V6:n tasoja
  (`observe` jne.).

## 5. Testit

| Mitä | Tulos |
|---|---|
| Uudet testit: turvatasot, suojatut polut, import-graafi, inventaario, AgentRuntime, Developer Agent (vain luku), HQ-keskustelu, reitti, Godfile-lataaja, UI-teksti | 80/80 |
| Mutaatiotarkistus, agentit ja turvallisuus (17 suojausta rikottiin yksi kerrallaan) | 17/17 kiinni |
| Mutaatiotarkistus, HQ Assistant (13) | 13/13 kiinni |
| Regressio: PythonDeveloper, CodeChangeDeveloper, moltbook-publisher | 183/183 |
| Regressio: `npm run check:spacemonkey` | 216/216 |
| Vanhat `spacemonkey/tests/test-*.js` -skriptit: tulostetta verrattiin lähtötasoon | 10 täsmälleen samat; 2 eroaa vain siksi, että uudet tiedostot näkyvät skannauksessa |

**Ajamatta** muistitilanteen vuoksi (swap noin 13 Gt): Vite-build,
selaintesti ja aito kielimallivastaus.

## 6. Keskeneräiset ongelmat ja riskit

- **DeveloperWorkflow'n täysi `execute()`-polku:**
  - `ReadFileSkill` lukee minkä tahansa polun.
  - `TestRunnerSkill` suorittaa sille annetun komentorivin.
  - `GitCommitSkill` commitoi.
  - Ainoa este on, että `ApprovalSkill` palauttaa aina `approved: false`.
    Tätä polkua ei saa kytkeä keskusteluun ennen kuin palvelintason
    hyväksyntä on käytössä.
- **WordPress- ja Instagram-agentit eivät toimi.** Korjataanko ne vai
  poistetaanko ne pluginien hyväksi? Päätös vaatii vaikutusanalyysin.
  Mitään ei poistettu.
- **moltbook-publisher saa julkaista ilman hyväksyntää** (vanha
  autonomiapäätös). Mikään ei kutsu sitä, eikä keskustelu voi valita sitä.
- **Kehotepersoonat:** `marketing`, `crm` ja `general` reititetään, mutta
  niillä ei ole omaa kontekstia. Rekisteri silti merkitsee ne aktiivisiksi.
- **Muut kovakoodatut polut:** backup- ja restore-palvelut sekä Bloodmoor
  käyttävät kotihakemiston absoluuttisia polkuja. Ne ovat repon ulkopuolisia
  asetuksia, joten niihin ei koskettu.
- **Kirjoittavat toiminnot odottavat** palvelintason valtuutusta (Security
  Sprint 0 ja Human Approval Gateway).

## 7. Seuraava sprintti (V8 Sprint 2: Project Atlas ja Live Context)

1. **Atlasin perusta:** HQ:n järjestelmät kuvataan polkuineen, ja tila
   lasketaan todisteista. Todisteet ovat: koodi on olemassa, se on kytketty
   `server/index.js`:ään tai `src/App.jsx`:ään, se löytyy stable- tai
   muusta haarasta, ja testit löytyvät mutta niitä ei ajeta. Tähän käytetään
   tämän sprintin import-graafia ja suojattujen polkujen sääntöä.
2. **Live Context:** aktiivinen näkymä ja aktiivinen projekti tulevat
   olemassa olevasta `runtimeContext`-tiedosta (`activeProject.id`, route).
3. **Kysymys "Mitä Wood-Booster HQ:ssa on rakennettu ja mitä projektissani
   tapahtuu?":** vastaus kootaan Atlasista ja projektityökalusta, ja lähteet
   näytetään.
