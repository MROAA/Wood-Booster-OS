# HQ Assistant Sprint 1: Spacemonkey HQ-keskustelussa (vain luku)

- Päivä: 2026-10-21
- Haara: `feat/hq-spacemonkey-assistant` (worktree `Wood-Booster-OS-hq-assistant`), pohjana stable `a43ac21d`
- Tila: commitoimatta, ei pushattu, ei live-ympäristössä

Tämä dokumentti kokoaa PRD:n "Unified AI Assistant & Development Studio
Integration" Sprint 1:n tulokset. Lisäksi se kertoo, mitä Ecosystem V3
-PRD:n kartoituksesta (Project Atlas) selvisi.

## 1. Inventaario: mitä oli jo olemassa

1. **Toimivat keskustelureitit.** `POST /api/agents/chat` (`server/routes/agentChat.js`)
   on HQ:n pääreitti, ja sitä käyttää `src/components/ai/ChatPanel.jsx` (`/spacemonkey-chat`).
   Saman `runAgentChat()`-funktion kautta kulkevat myös `ai-brain-chat.js` ja `ai-brain-v2.js`.
   Tilat `/altrako`, `/council`, `/koodi` ja `/heartwood` haarautuvat samasta reitistä.
   `ProjectTabs`-näkymässä on lisäksi erillinen `ProjectAIChat`.
2. **Ensisijainen reitti** on `/api/agents/chat`. Uutta reittiä ei tehty.
3. **Mallin valinta** on `aiBrain.js`:ssä: `OLLAMA_MODEL`, oletuksena `qwen2.5:7b`.
   Tätä mallia **ei ole asennettu**. Asennettuina ovat `qwen2.5-coder:14b`,
   `qwen2.5-coder:7b` ja `kahnwong/poro-2:8b-it`. Siksi jokainen vapaa
   HQ-kysymys päättyi "model not found" -virheeseen, ja käyttäjä näki
   pelkän "Ei vastausta." -tekstin. Lisäksi vastaus viimeistellään Ahmalla
   (poro, toinen malli).
4. **ToolBus-työkalut** (tämän haaran käynnistyksen jälkeen): `instagram-graph-publish`,
   `wordpress-rest-publish`, `moltbook-api`, `file`, `git` ja uusi `hq-projects`.
   Skillejä on 30, workflow'ta 29 ja plugineja 6.
5. **PythonDeveloper** rekisteröi FileToolin ja GitToolin sekä 11 skilliä
   ja workflow'ta. Luku-skillit (explain, review) rajaavat polun
   projektin sisäisiin `.py`-tiedostoihin. Kirjoittavat skillit kulkevat
   `PythonCodeDraft`-luonnoksen kautta. Luonnoksen `status: "approved"`
   tarkistetaan reitissä ja skillissä, ja kirjoitus menee vain
   `generated-python/`-hakemistoon. Tätä kiertoa ei muutettu.
6. **Hyväksyntä ja kirjoitus:** Dev Studion `PUT /api/python-drafts/:id/approve|write`.
   Hyväksyntä on käyttöliittymän nappi ilman kutsujan tunnistusta, joten
   se on neuvoa-antava. Human Approval Gateway on vasta kehitteillä
   turvallisuushaarassa.
7. **AI:n käytettävissä olevat HQ-liiketoimintapalvelut** ennen tätä
   sprinttiä: action planner (luo projekti, päivitä projektin tila,
   avaa välilehti) ja projektin avoimet työvaiheet Live Contextin
   kautta. Varsinaista tietohakua keskusteluun ei ollut.
8. **Muisti:** `Memory`-tauluun on tallennettu 31 riviä. `MemoryProposal`-ehdotuksista
   34 on hyväksytty, 15 merkitty kaksoiskappaleiksi ja 9 hylätty.
   Keskusteluhistoria on yksi `Conversation` ("Spacemonkey Chat") ja 248 viestiä.
   Muistilla ei ole työympäristökenttää: HQ:n ja Hearthwoodin muistit
   ovat samassa taulussa.
9. **Sama runtime useassa työympäristössä:** ToolBus, SkillEngine ja
   WorkflowEngine ovat moduulitason singletoneja ilman
   työympäristökäsitettä. Hearthwood Dev Studion analyysiputki
   (`hearthwood*.js`) on erillinen, eikä se käytä ToolBusia. Työympäristö
   tuodaan nyt kyvykkyyden kuvaukseen (`workspace: "hq"`), ja
   oikeustarkistus käyttää sitä.
10. **Yhdistettävissä ilman uudelleenkirjoitusta:** chat-reitti,
    `runtimeContext.activeProject` (ProjectDetails asettaa oikean
    projektitunnisteen), ToolBus, WorkflowEngine, PythonDeveloperin
    review-workflow ja käyttämätön `toolbus/CapabilityRegistry`.

## 2. Mitä lisättiin

- `plugins/HqAssistant/` (Boosterverse-plugin): vain luku -työkalu
  `hq-projects`, skillit ja workflow't keskeneräisille projekteille ja
  projektin yhteenvedolle, kyvykkyyskuvaukset ja niiden validointi sekä
  README.
- `plugins/PythonDeveloper/skills/inspectPythonCodeSkill.js` ja sen workflow:
  tiedoston rakenne ja syntaksi ilman kielimallia. Taito estää myös
  symlinkin, joka osoittaa projektin ulkopuolelle.
- `spacemonkeyRuntimeBootstrap.js`: luo `CapabilityRegistry`n, rekisteröi
  HQ Assistantin ja tarjoaa `getSpacemonkeyCapabilityRegistry()`-funktion.
- `services/chatModes/hqAssistant.js`: deterministinen planner,
  oikeustarkistus (vain `workspace: "hq"` + `access: "read"`),
  kuntotarkistus ja vastaukset suomeksi.
- `routes/agentChat.js`:
  - HQ-haara ajetaan ennen koodimuutostunnistusta.
  - Uusi reitti `GET /api/agents/capabilities`.
  - Keskustelumalli valitaan asennetuista malleista. Jos sopivaa mallia
    ei ole tai malli ei vastaa, käyttäjälle kerrotaan se selvästi.
- `services/ollamaModelResolver.js`: jaettu tarkistus siitä, mitkä mallit on asennettu.
- `ChatPanel.jsx` ja `toolRunText.js`: vastauksen alla näkyy, mitä
  työkalua käytettiin, oliko se vain luku ja että mitään ei muutettu.

Spacemonkey osaa nyt keskustelussa:

- "Mitkä projektini ovat keskeneräisiä?"
- Projektisivulla: "Tee tästä yhteenveto"
- "Tarkista tiedosto agent.py"

Muutospyynnöt ("lisää", "korjaa", "muuta"…) ohjautuvat edelleen nykyisille
poluille.

## 3. Testit

| Mitä | Tulos |
|---|---|
| HqAssistant-plugin + työkalu | 12/12 |
| inspect-python | 7/7 |
| hqAssistant (planner, oikeudet, malli puuttuu/virhe) | 15/15 |
| Reittitesti (oikea reititin + oikea bootstrap, Ollama suljettu) | 7/7 |
| toolRunText (käyttöliittymän teksti) | 4/4 |
| Mutaatiotarkistus (13 suojausta rikottiin yksi kerrallaan) | 13/13 kiinni |
| Regressio: PythonDeveloper + CodeChangeDeveloper | 174/174 |
| Regressio: `npm run check:spacemonkey` | 216/216 |
| Oikea data: live-tietokannan kopio (`sqlite .backup`) | 8 keskeneräistä = erillinen count, yhteenveto #35 ok, live-DB:n sha ennen = jälkeen |

**Ajamatta jäi muistitilanteen vuoksi** (swap noin 13 Gt): Vite-build,
selaintesti, aito kielimallin vastaus ja kelluva Spacemonkey-paneeli
HQ:n päänäkymään. Paneeli siirtyi Sprint 2:een.

## 4. Riskit ja avoimet asiat

- Palvelintason valtuutus (Security Sprint 0 ja Human Approval Gateway)
  on vielä mergeämättä. Tämän vuoksi kaikki keskustelun työkalut ovat
  vain luku -tasoa.
- `askOllama` (aiBrain) ja ChatPanelin fetch-kutsu eivät käytä aikakatkaisua.
- Kun yleinen keskustelu käyttää mallia `qwen2.5-coder:7b` ja Ahma käyttää
  poroa, muistissa on kaksi mallia (noin 10 Gt). Kuormitetulla koneella
  tämä on riski.
- Dev Studio -ikkunan haarassa `feat/hearthwood-visual-creator` on oma
  mallin valitsija heartwoodAssistantille. Mergen jälkeen sen voi siirtää
  käyttämään `ollamaModelResolver.js`:ää, jolloin päällekkäisyys poistuu.

## 5. Ekosysteemikartoitus (V2/V3 Sprint 1): havainnot

- **Hearthwood ei ole erillinen repository.** Se elää samassa
  `Wood-Booster-OS`-repossa ja samassa `dev.db`-tietokannassa
  (`HeartwoodTask`, `HeartwoodDecision`, `HearthwoodPatch`,
  `HearthwoodScreenLayout`). Projektiraja on siksi määriteltävä polkujen
  ja taulujen tasolla:
  - `src/services/heartwood/`
  - `src/pages/Hearthwood*`, `Heartwood*`
  - `src/components/hearthwood-studio/`
  - `server/routes/hearthwood*`, `heartwood*`
  - `server/services/hearthwood*`
- **Päällekkäiset ja todisteettomat inventaariot:**
  - `modules/systemInventory` ja `modules/creatorDevelopmentHistory` ovat
    kovakoodattuja listoja, joissa lukee esimerkiksi `status: "active"`
    ilman todisteita.
  - `modules/capabilityRegistry` on staattinen lista kuudesta
    "kyvykkyydestä".
  - `src/services/system/systemRegistry.js` on käsin ylläpidetty.
  - `architectureAudit` skannaa vain `spacemonkey/modules`-hakemiston.
  - Atlas ei saa käyttää näitä todisteina.
- **Kyvykkyysrekistereitä on neljä:** `toolbus/CapabilityRegistry`
  (nyt käytössä), `modules/capabilityRegistry`,
  `aiBrainV2/data/capabilityRegistry` ja frontendin `capabilityManifest`.
- **`server/routes`-hakemistossa on 190 tiedostoa.** Niistä noin 120 on
  `spacemonkey*`-reittejä (Creator Intelligence, Personality, Security
  …). Ne ovat kytkettyjä, mutta niiden toiminnasta ei ole todisteita.
- **Atlasin Sprint 1 -toteutusehdotus:**
  - `ProjectAtlas`-plugin.
  - Järjestelmät kuvataan polkuineen, ja tila lasketaan todisteista:
    koodi on olemassa, se on kytketty `server/index.js`:ään tai
    `src/App.jsx`:ään, se löytyy stablesta tai muista haaroista
    (`git cat-file --batch-check`), ja testit löytyvät mutta niitä ei ajeta.
  - Leima kertoo haaran ja commitin.
  - Suojatut polut suljetaan pois (`.env`, avaimet, tietokannat,
    `.hearthwood-security`, varmuuskopiot).
  - Chat-kyvykkyys `atlas.ecosystem.overview`.
  - Tilaa "testattu" ei anneta ilman ajettua testiä.

## 6. Moltbook ja Workspace Root (Operator V5): lähtötiedot

- `moltbook-publisher` on rekisteröity oikeuksilla `moltbook.publish` ja
  `requiresHumanApproval: false` (vanha autonomiapäätös). Yksikään reitti
  tai ajastin ei kutsu julkaisu-workflow'ta, eikä HQ-chat voi valita sitä.
- Tunnistetietojen säilytyspaikka on tarkistettava ennen Moltbook-työtä
  (havainto on välitetty turvallisuusikkunalle, ei tässä dokumentissa).
- Playwright `^1.62.1` on asennettu juuren riippuvuuksiin.
- Kaikki prosessit ajetaan käyttäjänä `marc`. Oma työtila ei siksi ole
  käyttöjärjestelmätason raja ennen turvallisuusikkunan Phase 2:ta (erillinen käyttäjä).

## 7. Kokeilu

```
cd server
node --test services/spacemonkey/plugins/HqAssistant/tests/ \
  services/spacemonkey/plugins/PythonDeveloper/tests/inspectPythonCodeSkill.test.js \
  services/chatModes/hqAssistant.test.js routes/agentChat.hq.test.js
```

Live-kokeilu vaatii hyväksynnän: merge stableen ja wb-noden
uudelleenkäynnistys. Sen jälkeen `/spacemonkey-chat`:
"Mitkä projektini ovat keskeneräisiä?"
