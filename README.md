# 🪵 Wood-Booster HQ

> **AI ei ole sovellus käyttöjärjestelmän päällä. AI on osa käyttöjärjestelmän toimintalogiikkaa.**

Wood-Booster OS on modulaarinen AI-keskeinen käyttöjärjestelmä- ja työympäristöprojekti. Se ei ole pelkkä verkkosovellus, CRM, AI-chat tai Linux-jakelu — se yhdistää AI-agentit, työpöytäympäristön, projektinhallinnan, yritystoiminnan työkalut, muisti- ja tietämysjärjestelmän, automaation sekä järjestelmän itsehavainnoinnin ja palautumiskyvyn yhdeksi koherentiksi kokonaisuudeksi.

Pitkän aikavälin tavoite: henkilökohtainen AI-käyttöjärjestelmä, joka toimii käyttäjän ja tietokoneen välisenä älykkäänä operaattorikerroksena — ymmärtää tarkoituksen, käyttää työkaluja turvallisesti, muistaa kontekstin, tarkistaa tuloksensa ja palautuu virheistä.

---

## Arkkitehtuurin kerrosmalli

```text
┌───────────────────────────────────────────────┐
│                 USER / MARC                   │
├───────────────────────────────────────────────┤
│             SPACEMONKEY OPERATOR              │
├───────────────────────────────────────────────┤
│          SYSTEM PULSE / AI BRAIN              │
├───────────────────────────────────────────────┤
│              AGENT RUNTIME                    │
├───────────────────────────────────────────────┤
│        KNOWLEDGE / MEMORY / TRUTH             │
├───────────────────────────────────────────────┤
│         AUTOMATION / TOOLS / SERVICES         │
├───────────────────────────────────────────────┤
│          DESKTOP RUNTIME                      │
├───────────────────────────────────────────────┤
│      WINDOWS / APP / WORKSPACE MODEL          │
├───────────────────────────────────────────────┤
│       OS / SYSTEM SERVICES / HARDWARE         │
└───────────────────────────────────────────────┘
```

Jokaisella kerroksella on oma vastuunsa, ja kerrosten välinen kommunikaatio kulkee rajapintojen, event busien, palveluiden ja permission-kerrosten kautta. Ks. `docs/MASTER_PRD.md` osio 48 — järjestelmäongelmaa ei ratkaista lisäämällä logiikkaa väärään kerrokseen.

---

## Spacemonkey

Spacemonkey on Wood-Booster OS:n AI-operaattori. Se ei ole chatbot eikä yksittäinen agentti — se on käyttöjärjestelmä, joka kykenee ajattelemaan, suunnittelemaan, suorittamaan, oppimaan ja auttamaan päivittäisessä työssä.

Vastuualueita:

* käyttäjän kanssa kommunikointi
* tehtävien ymmärtäminen
* agenttien koordinointi
* järjestelmän tilan tulkinta
* päätösten muodostaminen
* toimintojen orkestrointi
* palautuminen
* järjestelmän tilan raportointi

Spacemonkey ei saa ohittaa järjestelmän turvallisuus- ja permission-kerroksia.

---

## Keskeiset osajärjestelmät

* **System Pulse** — järjestelmän jatkuvasti päivittyvä tietoisuuskerros (terveys, prosessit, virheet, palautumismahdollisuudet)
* **AI Brain** — kognitiivinen moottori: intentin tunnistus, kontekstin muodostus, reasoning, päätöksenteko
* **Truth Layer** — luotettavan tiedon kerros, joka erottaa tunnetun tiedon oletuksista
* **Memory** — Short-Term / Working / Long-Term / System Memory
* **Knowledge** — dokumentaatio, tuote- ja yritystieto (eri asia kuin Memory)
* **Agent Architecture & Runtime** — rajatun vastuualueen agentit, Spacemonkeyn koordinoimina
* **Desktop Runtime** — DesktopManager, WindowManager, WorkspaceManager, AppRegistry, Desktop Event Bus
* **Business Layer** — Dashboard, Projects, Customers, Inventory, Purchases, Quotes, Invoices
* **Automation Layer** — tapahtuma- ja aikataulupohjaiset automaatiot permission-tarkistuksen ja audit login kautta
* **Git Guardian** — projektin Git-turvakerros: snapshotit, turvalliset commitit, palautuminen
* **Stable Build & Recovery** — tunnetusti toimivan buildin seuranta ja validoitu palautuminen
* **Permission Architecture** — READ → WRITE → EXECUTE → SYSTEM → CRITICAL, kriittiset operaatiot aina erikseen validoiden

---

## Teknologiapino

**Frontend** — React, Vite, Tailwind CSS
**Backend** — Node.js, Express, Prisma, SQLite
**AI** — Ollama / paikalliset LLM:t, modulaarinen AI Brain, grounding, Truth Layer
**System** — Linux, shell, Python, C
**Desktop** — oma Desktop Runtime (WindowManager, WorkspaceManager, AppRegistry, Event Bus)

---

## Kehitysfilosofia

* **Modular** — jokaisella komponentilla selkeä vastuu
* **Observable** — järjestelmän tila on nähtävissä
* **Recoverable** — virheistä pystytään palautumaan
* **Verifiable** — toimintojen onnistuminen todennetaan
* **AI-first** — AI on osa arkkitehtuuria, ei jälkikäteen lisätty
* **Human-controlled** — käyttäjällä säilyy kontrolli kriittisissä operaatioissa
* **Local-first** — mahdollisimman paljon suoritetaan paikallisesti
* **Truth-grounded** — päätökset perustuvat järjestelmän todelliseen tilaan

---

## Nykyinen tila ja roadmap

**Tila:** Active Development. Merkittävä osa arkkitehtuurista on jo olemassa: AI Brain V2, Spacemonkey, System Pulse, Truth Layer, Memory, Knowledge, Agent Runtime, Desktop Runtime, Git-integraatio, Stable Build ja Recovery-arkkitehtuuri. Kaikkia moduuleja ei vielä pidetä tuotantovalmiina.

* **MVP** — toimiva frontend + backend, AI chat, System Pulse, agenttiarkkitehtuuri, Knowledge/Memory, Projects/CRM, Desktop Runtime, Git-integraatio, Stable Build, Recovery-perusta, audit logging
* **Phase 2** — täydellinen Desktop Shell, taskbar, start menu, window/workspace persistence, Git Guardian, automaatiomoottori, system permissions
* **Phase 3** — bootattava Wood-Booster OS, hardware/GPU awareness, offline AI, self-diagnostics, self-healing
* **Phase 4** — täysi AI Operating System: Spacemonkey, AI Brain/System Pulse, agentti- ja automaatioruntime, muisti/tietämys/permission-kerrokset, desktop- ja sovellusruntime saman järjestelmän sisällä

---

## Asennus

```bash
git clone https://github.com/MROAA/Wood-Booster-OS.git
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
npm start
```

---

## Lisädokumentaatio

* [`docs/MASTER_PRD.md`](docs/MASTER_PRD.md) — täysi tuotevisio ja järjestelmäarkkitehtuuri (kanoninen PRD)
* [`docs/blueprint/`](docs/blueprint/) — 13-osainen Master Blueprint (visio, konstituutio, Spacemonkey-koodeksi, tietoturva, roadmap ym.)
* [`CLAUDE.md`](CLAUDE.md) — kehitysperiaatteet ja arkkitehtuurisäännöt AI-avusteiselle kehitykselle
* [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) — git worktree -pohjainen kehitysworkflow

---

## Contributing

Kontribuutiot ovat tervetulleita. Arkkitehtuuri painottaa selkeää koodia, modulaarisuutta ja pitkän aikavälin ylläpidettävyyttä. Ks. `docs/GIT_WORKFLOW.md` ennen muutosten tekemistä.

---

## License

MIT License, ellei toisin mainita.

---

## Author

**Marc Järvinen**
Wood-Booster HQ:n luoja — rakentamassa AI-käyttöjärjestelmää autonomisten agenttien, älykkään automaation ja modulaarisen tekoälyn varaan.
