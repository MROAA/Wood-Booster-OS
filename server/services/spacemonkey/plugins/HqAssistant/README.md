# HQ Assistant

Boosterverse-plugin, jonka avulla Spacemonkey vastaa Wood-Booster HQ:n
keskustelussa oikeista tiedoista rekisteröityjen, vain lukevien
kyvykkyyksien kautta. Nykyinen versio (2026-10-21) osaa kuusi asiaa:

| Kyvykkyys | Mitä tekee | Workflow |
|---|---|---|
| `hq.projects.unfinished` | Keskeneräiset projektit (tila ≠ Valmis) ja avoimien työvaiheiden määrä | `hq-list-unfinished-projects-workflow` |
| `hq.projects.summary` | Avatun projektin yhteenveto oikean projektitunnisteen perusteella | `hq-summarize-project-workflow` |
| `dev.python.inspect` | Projektin .py-tiedoston rakenne ja syntaksi, sekä Dev Studion katselmointi jos kielimalli on asennettu | `inspect-python-workflow` + `review-python-workflow` (PythonDeveloper) |
| `dev.project.find-files` | Tiedostohaku nimen perusteella Developer Agentilla (Agent Runtime), sisältöä ei lueta | agentti `developer-agent` |
| `spacemonkey.agents.inventory` | Spacemonkeyn agentit lähteistään: Agent Runtime kuntotietoineen, kehotepersoonat, pluginit, agenttiluokat | `list-spacemonkey-agents-workflow` |
| `hq.atlas.overview` | Project Atlas: mitä HQ:ssa on rakennettu (toteutettu, kehitteillä, suunniteltu, epävarma) todisteista, ja halutessa avatun näkymän ja projektin tilanne | `hq-atlas-overview-workflow` |

## Tarkoitus

Käyttäjä kysyy, ja Spacemonkey hakee vastauksen HQ:n oikeasta
projektitietokannasta tai tiedostosta. Kielimalli ei arvaa vastausta,
eikä se valitse tai kutsu työkalua.

## Vastuut

- `tools/hqProjectsTool.js`: ainoa koodi, joka koskee HQ:n
  projektitauluihin. Se tekee vain `findMany`/`findUnique`/`count`-kyselyjä
  ja nimeää jokaisen kentän erikseen. Asiakkaan sähköposti ja
  puhelinnumero eivät koskaan päädy vastaukseen.
- `skills/`, `workflows/`: kumpikin workflow ajaa yhden skillin
  (samoin kuin PythonDeveloperin explain/review).
- `capabilities/hqAssistantCapabilities.js`: kuvaukset (workspace,
  oikeustaso `read|draft|execute|privileged`, `mutates`,
  `requiresApproval`, suorittaja eli workflow't tai agentti, riippuvuudet,
  lähteet). Oikeustasot ovat `security/accessLevels.js`:n V6-tasot
  (`observe`, `workspace`, `project-draft`, `approved-execution`,
  `privileged-os` ja `external-publishing`), eivätkä ne muodosta portaikkoa. Lisäksi
  `validateChatCapability()`. Kuvausta, joka ei läpäise validointia, ei
  rekisteröidä.
- `permissions/`: `hq.projects.read`.

Keskustelupuolen planner, oikeustarkistus ja vastausten muotoilu ovat
tiedostossa `server/services/chatModes/hqAssistant.js`. Reitti on
olemassa oleva `POST /api/agents/chat` (`server/routes/agentChat.js`).

## Kulku

```
POST /api/agents/chat
  -> planHqAssistantTurn()        deterministinen, suomenkieliset hahmot
  -> checkCapabilityPermission()  vain workspace "hq" + taso "observe"
  -> checkCapabilityHealth()      workflow't tai agentti rekisteröity ja kunnossa
  -> WorkflowEngine -> Skill -> hq-projects / file / spacemonkey-agents -> ToolBus
     tai AgentRuntime.run() -> Developer Agent (vain luku -polku)
```

Muutospyyntö ("lisää", "korjaa", "muuta"…) ei koskaan päädy tänne. Se
jatkaa nykyisille poluille (action planner, `/koodi`-varmistus), joilla
on oma hyväksyntäkiertonsa.

## Riippuvuudet

- Spacemonkey Runtime Bootstrap rekisteröi pluginin ja luo
  `CapabilityRegistry`n (`toolbus/CapabilityRegistry.js`).
- PythonDeveloper-plugin tarjoaa workflow't `inspect-python-workflow`
  ja `review-python-workflow`.
- Prisma tulee ToolBusin runtime-argumenttina (`{ prisma }`).
- Katselmointimalli selvitetään `server/services/ollamaModelResolver.js`:llä.
  Jos mallia ei ole asennettu, tarkistus palauttaa silti rakenteen ja
  syntaksin ja kertoo, että kielimallin katselmointi jäi tekemättä.

## Julkinen API

- `registerHqAssistantPlugin({ toolBus, skillEngine, workflowEngine, pluginManager, capabilityRegistry, logger })`
- `GET /api/agents/capabilities`: HQ-kyvykkyydet oikeustasoineen ja
  toimintakuntoineen.
- `GET /api/agents/inventory`: agentti-inventaario JSON-muodossa.
- `GET /api/agents/atlas`: Project Atlas JSON-muodossa.
- Keskusteluvastauksen `toolRun`-kenttä: `capabilityId`, `name`,
  `access`, `outcome` (`ok`, `ok-without-model`, `needs-project`,
  `needs-file`, `failed`, `denied`, `unavailable`, `not-registered`),
  `mutated: false` ja `sources`.

## Esimerkit

- "Mitkä projektini ovat keskeneräisiä?"
- Projektin sivulla: "Tee tästä yhteenveto" (käyttää
  `runtimeContext.activeProject.id`:tä)
- "Tarkista tiedosto agent.py"
- "Etsi tiedostot nimellä ChatPanel"
- "Mitä agentteja sinulla on?"
- "Mitä Wood-Booster HQ:ssa on rakennettu ja mitä projektissani tapahtuu?"

## Testit

```
cd server
node --test services/spacemonkey/plugins/HqAssistant/tests/ \
  services/spacemonkey/plugins/PythonDeveloper/tests/inspectPythonCodeSkill.test.js \
  services/chatModes/hqAssistant.test.js routes/agentChat.hq.test.js
```

Prisma-korvike (`tests/fakePrisma.js`) heittää virheen jokaisesta
kirjoituksesta, joten testit todistavat, ettei vain luku -polku kirjoita
mitään. Reittitesti ohjaa Ollaman suljettuun porttiin, joten se ei
koskaan lataa kielimallia.

## Ei vielä (myöhemmät sprintit)

Kirjoittavat HQ-toiminnot (tarjousluonnokset, projektien muutokset)
odottavat palvelintason valtuutusta (Security Sprint, Human Approval
Gateway). Siihen asti nämä kyvykkyydet ovat vain luku -tasoa.
