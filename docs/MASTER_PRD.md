# Wood-Booster OS AI

## Product Requirements Document — Kokonaisvaltainen järjestelmäarkkitehtuuri ja tuotevisio

**Project:** Wood-Booster OS
**Product:** Wood-Booster OS AI / Wood-Booster HQ
**Operator:** Spacemonkey
**Repository:** `MROAA/Wood-Booster-OS`
**Status:** Active Development
**Document type:** Master Product Requirements Document
**Version:** 1.0
**Date:** 2026-08-12

---

# 1. Tuotteen määritelmä

Wood-Booster OS on modulaarinen AI-keskeinen käyttöjärjestelmä- ja työympäristöprojekti.

Sen tavoitteena ei ole olla pelkästään verkkosovellus, CRM, AI-chat tai Linux-jakelu.

Wood-Booster OS:n tarkoitus on yhdistää:

* AI-agentit
* työpöytäympäristö
* projektinhallinta
* yritystoiminnan työkalut
* muistijärjestelmä
* tietämysjärjestelmä
* automaatio
* järjestelmän itsehavainnointi
* palautuminen ja varmuuskopiointi
* ohjelmistokehityksen työkalut
* virtuaalinen Windows-tyyppinen käyttöympäristö
* bootattava OS/runtime
* Spacemonkey AI-operaattori

yhdeksi koherentiksi järjestelmäksi.

Wood-Booster OS:n keskeinen ajatus:

> **AI ei ole sovellus käyttöjärjestelmän päällä. AI on osa käyttöjärjestelmän toimintalogiikkaa.**

---

# 2. Vision

Wood-Booster OS:n pitkän aikavälin visiona on muodostaa henkilökohtainen AI-käyttöjärjestelmä, joka toimii käyttäjän ja tietokoneen välisenä älykkäänä operaattorikerroksena.

Järjestelmän tulee pystyä:

1. ymmärtämään käyttäjän tarkoitus
2. ymmärtämään järjestelmän nykyinen tila
3. käyttämään käytettävissä olevia työkaluja
4. suorittamaan turvallisesti sallittuja toimintoja
5. muistamaan olennaisen kontekstin
6. tarkistamaan toimintansa tulokset
7. palautumaan virhetilanteista
8. dokumentoimaan muutokset
9. automatisoimaan toistuvia tehtäviä
10. säilyttämään järjestelmän eheys

Tavoitteena on rakentaa järjestelmä, jossa käyttäjän ei tarvitse hallita jokaista teknistä yksityiskohtaa itse.

---

# 3. Perusperiaate

Wood-Booster OS rakennetaan kerroksittain.

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

Jokaisella kerroksella on oma vastuunsa.

Kerrosten välinen kommunikaatio tulee toteuttaa rajapintojen, event busien, palveluiden ja permission-kerrosten kautta.

---

# 4. Tuotteen päätavoitteet

## 4.1 AI-first käyttöjärjestelmä

AI:n tulee olla järjestelmän ydinkomponentti eikä erillinen lisäosa.

AI:n tulee ymmärtää:

* järjestelmän tila
* käyttäjän tarkoitus
* projektit
* tiedostot
* tietämys
* muistot
* käytettävissä olevat agentit
* työkalut
* käyttöoikeudet
* runtime-tila

---

## 4.2 Spacemonkey

Spacemonkey toimii Wood-Booster OS:n AI-operaattorina.

Spacemonkey vastaa korkeammalla tasolla:

* käyttäjän kanssa kommunikoinnista
* tehtävien ymmärtämisestä
* agenttien koordinoinnista
* järjestelmän tilan tulkinnasta
* päätösten muodostamisesta
* toimintojen orkestroinnista
* palautumisesta
* järjestelmän tilan raportoimisesta

Spacemonkey ei kuitenkaan saa ohittaa järjestelmän turvallisuus- ja permission-kerroksia.

---

# 5. System Pulse

System Pulse on Wood-Booster OS:n järjestelmän tietoisuuskerros.

Sen tarkoitus on muodostaa jatkuvasti päivittyvä kuva:

* järjestelmän terveydestä
* aktiivisista prosesseista
* moduuleista
* kyvykkyyksistä
* virheistä
* riippuvuuksista
* runtime-tilasta
* palautumismahdollisuuksista

System Pulse toimii Spacemonkeyn havaintokerroksena.

```text
System
   ↓
System Pulse
   ↓
System State
   ↓
Spacemonkey
   ↓
Decision
   ↓
Agent / Tool
```

---

# 6. AI Brain

AI Brain toimii Wood-Booster OS:n kognitiivisena moottorina.

Sen tehtäviä ovat:

* intentin tunnistaminen
* kontekstin muodostaminen
* truth-lähteiden valinta
* agentin valinta
* reasoning
* päätöksenteko
* työkalujen käyttö
* vastauksen muodostaminen

AI Brain ei saa keksiä järjestelmän faktoja.

AI:n tulee käyttää Truth Layeria silloin, kun järjestelmän sisäistä tietoa tarvitaan.

---

# 7. Truth Layer

Truth Layer on järjestelmän luotettavan tiedon kerros.

Truth-data voi sisältää esimerkiksi:

* Product Truth
* Workshop Truth
* Brand Truth
* Business Truth
* Decision Truth
* System Truth

AI:n tulee erottaa:

```text
KNOWN
│
├── Truth Layer
├── Runtime State
├── Memory
└── Knowledge

UNKNOWN
│
└── AI:n ei tule esittää oletusta faktana
```

Tavoitteena on vähentää hallucinaatioita ja varmistaa, että AI:n päätökset perustuvat järjestelmän todelliseen tilaan.

---

# 8. Memory System

Wood-Booster OS tarvitsee pitkäkestoisen muistikerroksen.

Memoryn tehtävänä on säilyttää relevantti konteksti.

Muistijärjestelmä voidaan jakaa esimerkiksi:

### Short-Term Memory

Nykyinen keskustelu ja aktiivinen tehtävä.

### Working Memory

Nykyisen session aikana käytettävä työskentelykonteksti.

### Long-Term Memory

Pysyvät käyttäjä-, projekti- ja järjestelmätiedot.

### System Memory

Järjestelmän historia, tapahtumat ja tärkeät runtime-tilat.

Memoryn ei tule muuttua hallitsemattomaksi tietovarastoksi.

Muistin tulee olla:

* haettavaa
* strukturoitua
* validoitavaa
* versionoitavaa
* poistettavaa
* tarvittaessa palautettavaa

---

# 9. Knowledge System

Knowledge Layer sisältää järjestelmän käyttöön tarkoitetun tiedon.

Knowledge voi sisältää:

* dokumentaation
* projektitiedot
* tuotetiedot
* teknisen dokumentaation
* yritystiedon
* ohjeet
* koodiin liittyvän tiedon
* käyttäjän lisäämät dokumentit

Knowledge ja Memory ovat eri asioita.

```text
Knowledge = mitä järjestelmä tietää

Memory = mitä järjestelmä muistaa
```

---

# 10. Agent Architecture

Wood-Booster OS käyttää erillisiä AI-agentteja eri tehtäväalueille.

Nykyinen agenttimalli sisältää muun muassa:

* Product Agent
* Workshop Agent
* Pricing Agent
* Marketing Agent
* CRM Agent
* Python Developer
* tekniset järjestelmäagentit

Agentti ei saa tehdä kaikkea.

Jokaisella agentilla tulee olla:

* selkeä vastuualue
* työkalut
* input
* output
* permission-rajoitukset
* validointi
* error handling

Agentit toimivat Spacemonkeyn koordinoimina.

---

# 11. Agent Runtime

Agent Runtime vastaa agenttien suorittamisesta.

Sen tehtäviä ovat:

1. vastaanottaa tehtävä
2. validoida tehtävä
3. valita agentti
4. rakentaa konteksti
5. antaa tarvittavat työkalut
6. suorittaa agentti
7. validoida tulos
8. palauttaa tulos
9. tallentaa tapahtuma

```text
User Request
      ↓
Intent
      ↓
Agent Router
      ↓
Agent Executor
      ↓
Tools
      ↓
Validation
      ↓
Result
      ↓
Memory / Event / UI
```

---

# 12. Desktop Runtime

Wood-Booster OS sisältää oman Desktop Runtime -arkkitehtuurin.

Sen tarkoituksena on erottaa työpöydän tila React-käyttöliittymästä.

Desktop Runtime koostuu muun muassa:

```text
DesktopManager
├── DesktopEventBus
├── WindowManager
├── WorkspaceManager
└── AppRegistry
```

DesktopManager toimii keskitettynä orkestrointikerroksena.

Se ei saa:

* renderöidä React-komponentteja
* suorittaa shell-komentoja
* käsitellä tiedostoja
* tehdä Git-operaatioita
* suorittaa AI-toimintoja

Nämä kuuluvat erillisille kerroksille.

---

# 13. Window Manager

WindowManager vastaa työpöydän ikkunoista.

Sen tulee hallita:

* ikkunoiden luominen
* sulkeminen
* fokusointi
* minimointi
* maksimointi
* palauttaminen
* sijainti
* koko
* appId
* windowId
* tila

Esimerkki:

```text
Application
    ↓
WindowManager
    ↓
Window
```

---

# 14. Workspace Manager

WorkspaceManager mahdollistaa virtuaaliset työtilat.

Työtiloja voidaan käyttää esimerkiksi:

```text
Workspace 1
  Development

Workspace 2
  Business

Workspace 3
  AI

Workspace 4
  System
```

Jokaisella workspace-ympäristöllä voi olla omat ikkunansa.

---

# 15. App Registry

AppRegistry toimii Wood-Booster OS:n sovellusrekisterinä.

Se kertoo runtime-kerrokselle:

* mitä sovelluksia järjestelmä tuntee
* sovelluksen ID:n
* nimen
* oletuskoon
* mahdolliset metadata-arvot
* sovelluksen käynnistämiseen liittyvät tiedot

Tämä mahdollistaa myöhemmin aidon OS-tyyppisen application modelin.

---

# 16. Desktop Event Bus

DesktopEventBus toimii runtime-komponenttien välisenä tapahtumakanavana.

Esimerkkejä tapahtumista:

```text
app.opened
app.window.closed
window.focused
window.minimized
window.maximized
workspace.changed
workspace.created
workspace.deleted
```

Event-driven arkkitehtuuri vähentää komponenttien välistä suoraa riippuvuutta.

---

# 17. React Frontend

React toimii Wood-Booster OS:n käyttöliittymäkerroksena.

Sen tehtävänä ei ole omistaa koko käyttöjärjestelmän tilaa.

Frontend toimii ensisijaisesti:

```text
UI
 ↓
Context / Adapter
 ↓
Desktop Runtime
 ↓
Services
```

Tämä mahdollistaa myöhemmin frontendin vaihtamisen ilman, että koko runtime täytyy kirjoittaa uudelleen.

---

# 18. Desktop Runtime Context

`DesktopRuntimeContext.jsx` toimii Reactin ja Desktop Runtime -kerroksen välisenä adapterina.

Sen tarkoitus on tarjota käyttöliittymälle pääsy esimerkiksi:

* window stateen
* workspace stateen
* app registryyn
* desktop eventeihin
* desktop actions -toimintoihin

React ei suoraan hallitse runtime-objekteja ilman adapterikerrosta.

---

# 19. Virtual Desktop

Virtual Desktop tarjoaa käyttäjälle OS-tyyppisen työpöytänäkymän.

Sen tarkoitus on toimia:

* sovellusten käynnistyspisteenä
* työtilojen käyttöliittymänä
* järjestelmän navigointikerroksena
* tulevan desktop shellin pohjana

Nykyinen toteutus sisältää pikakuvakkeita muun muassa:

* Dashboard
* Projektit
* Asiakkaat
* Materiaalit
* Ostot
* Tarjoukset
* Laskut
* Knowledge
* Memory
* Agents
* Settings
* Spider-pasianssi

Tätä näkymää tulee tulevaisuudessa kehittää aidoksi OS-työpöydäksi.

---

# 20. Business Layer

Wood-Booster OS sisältää myös Wood-Boosterin liiketoiminnan työkalut.

Keskeisiä alueita ovat:

* Dashboard
* Projects
* Customers
* Inventory
* Purchases
* Quotes
* Invoices
* Knowledge
* Memory
* Agents
* Settings

Business Layer mahdollistaa AI:n toimimisen todellisessa liiketoimintakontekstissa.

---

# 21. Project Management

Projektijärjestelmän tulee hallita:

* asiakkaat
* projektit
* projektin tila
* muistiinpanot
* aikajana
* workflow
* tarjoukset
* materiaalit
* tuotanto
* AI-toiminnot

Projektin tulee toimia yhtenä AI:n tärkeänä kontekstiyksikkönä.

---

# 22. CRM

CRM hallitsee asiakaskontekstia.

AI:n tulee pystyä hyödyntämään CRM-dataa silloin, kun käyttäjän tehtävä sitä edellyttää.

CRM:n tulee tukea:

* asiakkaiden hallintaa
* yhteystietoja
* projekteihin yhdistämistä
* historiatietoja
* asiakaskontekstia
* tulevia automaatioita

---

# 23. Automation Layer

Automaatiokerros on yksi Wood-Booster OS:n tärkeimmistä pitkän aikavälin ominaisuuksista.

Automaatioiden tulee voida reagoida:

* tapahtumiin
* aikatauluihin
* järjestelmän tilaan
* Git-tapahtumiin
* projektien muutoksiin
* AI-agenttien tuloksiin
* käyttäjän määrittämiin ehtoihin

Esimerkiksi:

```text
Event
 ↓
Automation Rule
 ↓
Permission Check
 ↓
Action
 ↓
Verification
 ↓
Audit Log
```

---

# 24. Git Guardian

Git Guardian toimii Wood-Booster OS:n projektien Git-turvakerroksena.

Sen tavoitteena on automatisoida projektin turvallinen versionhallinta.

Git Guardianin tulee tulevaisuudessa pystyä:

* havaitsemaan muutokset
* muodostamaan snapshotteja
* validoimaan työtilan
* tekemään turvallisia commit-operaatioita
* pushamaan GitHubiin
* tarkistamaan pushin onnistuminen
* säilyttämään audit trail
* estämään vaarallisia operaatioita
* palauttamaan edelliseen tunnetusti toimivaan versioon

Git Guardian ei saa toimia täysin ilman permission- ja verification-kerrosta.

---

# 25. Stable Build System

Wood-Booster OS sisältää Stable Build -mekanismin.

Sen tarkoitus on tietää, mikä build tunnetaan toimivaksi.

Build-prosessi:

```text
Source
 ↓
Build
 ↓
Validation
 ↓
Stable Build
 ↓
Snapshot
 ↓
Registry
```

Stable Build -järjestelmän tulee säilyttää:

* build ID
* version
* commit
* snapshot
* status
* timestamp

Jos uusi build epäonnistuu, viimeinen stable build toimii palautumisen referenssinä.

---

# 26. Recovery Architecture

Recovery-järjestelmän tavoitteena on tehdä järjestelmästä resilientti.

Recovery voi hyödyntää:

* stable build snapshotteja
* Git historiaa
* audit logeja
* system statea
* recovery manageria
* recovery verificationia

Periaate:

```text
Failure
  ↓
Detection
  ↓
Diagnosis
  ↓
Known Stable State
  ↓
Recovery
  ↓
Verification
  ↓
System Restored
```

Palautumista ei tule pitää onnistuneena ennen kuin palautettu tila on validoitu.

---

# 27. System Audit

Wood-Booster OS:n tulee pitää audit trail merkittävistä järjestelmätapahtumista.

Auditointi voi koskea:

* installaatioita
* build-operaatioita
* Git-operaatioita
* recovery-operaatioita
* agenttien toimintoja
* permission-päätöksiä
* järjestelmämuutoksia

Audit data mahdollistaa jälkikäteen tapahtumien ymmärtämisen.

---

# 28. Permission Architecture

AI-agentti ei saa automaattisesti saada täydellistä pääsyä järjestelmään.

Toiminnot tulee jakaa permission-tasoihin.

Esimerkiksi:

```text
READ
  ↓
WRITE
  ↓
EXECUTE
  ↓
SYSTEM
  ↓
CRITICAL
```

Kriittiset operaatiot tarvitsevat erityisen validoinnin.

Tällaisia ovat esimerkiksi:

* tiedostojen massapoisto
* Git historyn muuttaminen
* järjestelmän palauttaminen
* järjestelmäasetusten muuttaminen
* shell-komentojen suorittaminen
* käyttöjärjestelmätason muutokset

---

# 29. Security Principle

Wood-Booster OS:n periaate:

> AI:n kyvykkyys ei saa tarkoittaa rajatonta käyttöoikeutta.

AI:n tulee toimia permission-rajapinnan kautta.

```text
AI
 ↓
Intent
 ↓
Policy
 ↓
Permission
 ↓
Tool
 ↓
Action
 ↓
Verification
```

---

# 30. Python / Node / System Services

Wood-Booster OS käyttää useita teknologioita eri tarkoituksiin.

### Frontend

* React
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express / palvelukerrokset
* Prisma
* SQLite kehitysympäristössä

### AI

* Ollama / paikalliset LLM:t
* AI Brain
* agent runtime
* grounding
* truth layer

### System

* Linux
* shell
* Python
* C
* system-level komponentit

### Desktop

* React UI
* Desktop Runtime
* WindowManager
* WorkspaceManager
* AppRegistry
* Event Bus

---

# 31. Bootable OS

Pitkän aikavälin tavoitteena on tehdä Wood-Booster OS:stä aidosti bootattava ympäristö.

Projektissa on jo OS- ja boot-arkkitehtuurin osia, kuten:

* bootloader-koodi
* kernel-kokeiluja
* C-komponentteja
* ISO-build-skriptejä
* `iso_boot_root`
* squashfs-pohjainen runtime
* AppImage-rakennus

Tavoitteena ei ole ainoastaan paketoida web-sovellusta ISO-tiedostoon.

Lopullinen tavoite on:

```text
BIOS / UEFI
      ↓
Bootloader
      ↓
Wood-Booster OS
      ↓
System Runtime
      ↓
Desktop Runtime
      ↓
Spacemonkey
      ↓
AI / Applications
```

---

# 32. Windows Hybrid Vision

Wood-Booster OS:n arkkitehtuurissa on myös Windows 11 -tyyppisiä käyttöliittymä- ja järjestelmäideoita.

Tavoitteena on tutkia ja toteuttaa turvallisesti esimerkiksi:

* taskbar
* start menu
* action center
* virtual desktops
* explorer
* settings
* terminal
* calculator
* calendar
* media player
* system management

Näitä ei tule toteuttaa vain visuaalisina kopioina.

Tavoitteena on rakentaa Wood-Booster OS:n oma unified desktop experience.

---

# 33. Boosterverse

Boosterverse toimii Wood-Booster-ekosysteemin laajempana kokeellisena ja luovana kerroksena.

Se voi sisältää:

* lore
* AI-hahmot
* maailmat
* kokeelliset agentit
* autonomiset järjestelmät
* luovat moduulit
* Spacemonkey-ekosysteemin

Boosterverse saa kehittyä vapaammin kuin kriittinen OS-runtime.

Kriittinen järjestelmäarkkitehtuuri ei kuitenkaan saa riippua kokeellisista Boosterverse-moduuleista.

---

# 34. Spacemonkey Identity

Spacemonkeylla on oma:

* identiteetti
* persoonallisuus
* memory
* knowledge
* toimintamalli
* system awareness
* agent architecture
* cognitive architecture

Spacemonkeyn tulee olla:

* ystävällinen
* kohtelias
* kärsivällinen
* teknisesti kykenevä
* rehellinen järjestelmän tilasta
* virheistä oppiva
* turvallinen

Spacemonkey ei saa väittää tehneensä asioita, joita runtime ei todellisuudessa suorittanut.

---

# 35. Finnish AI Architecture

Koska Wood-Booster OS on suomalaislähtöinen projekti, järjestelmään kehitetään myös suomen kielen AI-osaamista.

Tavoitteena on tukea:

* suomen kielen morfologiaa
* taivutusta
* sijamuotoja
* verbien taivutusta
* kielioppia
* tyylin tunnistamista
* suomalaisen käyttäjän luonnollista vuorovaikutusta

Tämä muodostaa pitkällä aikavälillä oman Finnish Language Intelligence Layerin.

---

# 36. Self-Awareness Architecture

Wood-Booster OS:n erityinen tavoite on järjestelmän kyky ymmärtää oma tilansa.

Järjestelmän tulee pystyä vastaamaan esimerkiksi:

```text
Mitä moduuleja minulla on?

Mikä toimii?

Mikä ei toimi?

Mikä build on stable?

Mikä muuttui viimeksi?

Mitä voidaan palauttaa?

Mitä työkaluja käytettävissä on?

Mitkä agentit ovat käytettävissä?

Mikä on nykyinen workspace?

Mitä sovelluksia on käynnissä?
```

Tämä on System Pulse + Runtime Awareness -arkkitehtuurin keskeinen tavoite.

---

# 37. Self-Healing

Pitkän aikavälin tavoitteena on rakentaa hallittu self-healing-järjestelmä.

Sen tulee toimia:

```text
Detect
 ↓
Understand
 ↓
Plan
 ↓
Permission
 ↓
Repair
 ↓
Verify
 ↓
Record
```

AI ei saa tehdä korjausta ilman validointia.

Korjauksen jälkeen järjestelmän tulee todentaa, että:

1. ongelma poistui
2. build toimii
3. kriittiset palvelut toimivat
4. järjestelmän eheys säilyi

---

# 38. Developer Environment

Wood-Booster OS toimii myös AI-avusteisena kehitysympäristönä.

Tavoitteena on yhdistää:

* Git
* GitHub
* Claude Code
* paikalliset LLM:t
* AI-agentit
* projektit
* terminal
* IDE:t
* build system
* testit
* recovery

Kehittäjä voi tulevaisuudessa antaa esimerkiksi:

> "Tarkista viimeisin muutos, korjaa build ja tee turvallinen commit."

Järjestelmän tulee jakaa tehtävä:

```text
Spacemonkey
 ↓
Code Agent
 ↓
Repository Analysis
 ↓
Change
 ↓
Build
 ↓
Test
 ↓
Git Guardian
 ↓
Commit
 ↓
Push
 ↓
Verification
```

---

# 39. Observability

Wood-Booster OS:n tulee olla tarkkailtava.

Keskeisiä metriikoita:

* runtime health
* build status
* agent status
* service status
* memory status
* workspace status
* active windows
* errors
* recovery state
* Git state

Observability toimii myös AI:n kontekstina.

---

# 40. Error Handling

Virheitä ei saa piilottaa.

Jokaisen merkittävän järjestelmätoiminnon tulee pystyä palauttamaan:

```text
success
status
error
context
recovery option
```

Virhetilanteessa käyttäjälle tulee kertoa:

* mitä tapahtui
* mikä epäonnistui
* mikä vaikutus sillä on
* voidaanko asia korjata
* mitä järjestelmä ehdottaa seuraavaksi

---

# 41. Development Philosophy

Wood-Booster OS:n kehityksessä noudatetaan seuraavia periaatteita:

### Modular

Jokaisella komponentilla on selkeä vastuu.

### Observable

Järjestelmän tila pitää pystyä näkemään.

### Recoverable

Virheistä pitää pystyä palautumaan.

### Verifiable

Toimintojen onnistuminen pitää todentaa.

### AI-first

AI integroidaan järjestelmän arkkitehtuuriin eikä lisätä jälkikäteen.

### Human-controlled

Käyttäjällä säilyy kontrolli kriittisissä operaatioissa.

### Local-first

Mahdollisimman paljon AI- ja järjestelmätoimintoja voidaan suorittaa paikallisesti.

### Truth-grounded

AI:n päätökset perustuvat saatavilla olevaan todelliseen dataan.

---

# 42. Non-Goals

Wood-Booster OS:n tavoitteena ei ole:

* tehdä AI:sta täysin autonomista ilman rajoituksia
* antaa agenteille rajatonta shell-pääsyä
* korvata kaikkia olemassa olevia käyttöjärjestelmiä välittömästi
* rakentaa kaikkea yhteen jättimäiseen moduuliin
* tehdä pelkkää Windows-kloonia
* tehdä pelkkää chatbotia

Projektin arvo syntyy nimenomaan kerroksellisesta arkkitehtuurista.

---

# 43. MVP

MVP-tason Wood-Booster OS:n tulee sisältää:

* toimiva React frontend
* toimiva backend
* AI chat
* System Pulse
* agent architecture
* Knowledge
* Memory
* Projects
* CRM
* Desktop Runtime
* Window Manager
* Workspace Manager
* App Registry
* Desktop Event Bus
* Git integration
* Stable Build
* Recovery foundation
* audit logging

---

# 44. Phase 2

Seuraavassa vaiheessa:

* täydellinen Desktop Shell
* oikeat desktop-sovellukset
* taskbar
* start menu
* window persistence
* workspace persistence
* AI-controlled desktop
* parempi agent orchestration
* Git Guardian
* automaatiomoottori
* system permissions
* system-wide notifications

---

# 45. Phase 3

Edistyneessä vaiheessa:

* bootattava Wood-Booster OS
* oma system runtime
* hardware awareness
* GPU awareness
* system services
* offline AI
* local model management
* system-level AI operations
* advanced recovery
* self-diagnostics
* self-healing

---

# 46. Phase 4 — AI Operating System

Lopullinen tavoitetila:

```text
┌───────────────────────────────────────────┐
│                  USER                     │
├───────────────────────────────────────────┤
│              SPACEMONKEY                  │
├───────────────────────────────────────────┤
│       AI BRAIN / SYSTEM PULSE             │
├───────────────────────────────────────────┤
│        AGENT + AUTOMATION RUNTIME         │
├───────────────────────────────────────────┤
│      MEMORY / KNOWLEDGE / TRUTH           │
├───────────────────────────────────────────┤
│       PERMISSION / SECURITY LAYER         │
├───────────────────────────────────────────┤
│             DESKTOP RUNTIME               │
├───────────────────────────────────────────┤
│         APPLICATION RUNTIME               │
├───────────────────────────────────────────┤
│          SYSTEM SERVICES                  │
├───────────────────────────────────────────┤
│            WOOD-BOOSTER OS                │
├───────────────────────────────────────────┤
│                HARDWARE                   │
└───────────────────────────────────────────┘
```

Tässä mallissa käyttäjä voi käsitellä tietokonetta sekä perinteisesti että luonnollisen kielen kautta.

---

# 47. Success Criteria

Wood-Booster OS katsotaan onnistuneeksi, kun:

### Desktop

* työpöytä toimii itsenäisenä runtime-ympäristönä
* ikkunat toimivat
* workspacet toimivat
* sovellukset voidaan rekisteröidä ja avata

### AI

* Spacemonkey ymmärtää käyttäjän intentin
* AI käyttää oikeaa kontekstia
* agentit voidaan valita automaattisesti
* AI:n toiminnot ovat auditoitavissa

### System

* järjestelmän tila voidaan havaita
* build voidaan validoida
* stable snapshot voidaan luoda
* recovery voidaan suorittaa ja verifioida

### Security

* agenttien käyttöoikeudet ovat rajattuja
* kriittiset operaatiot voidaan varmistaa
* järjestelmä säilyttää audit trailin

### Development

* Git Guardian voi suojata projektia
* AI voi auttaa koodin kehityksessä
* build/test/commit/push-ketju voidaan automatisoida turvallisesti

### OS

* Wood-Booster OS voidaan lopulta käynnistää itsenäisenä ympäristönä
* desktop runtime ja AI runtime toimivat saman järjestelmän sisällä

---

# 48. Architecture Rule

Wood-Booster OS:n tärkein arkkitehtuurisääntö:

> **Älä ratkaise järjestelmäongelmaa lisäämällä logiikkaa väärään kerrokseen.**

Jos ongelma liittyy:

* ikkunoihin → WindowManager
* työtiloihin → WorkspaceManager
* sovelluksiin → AppRegistry
* tapahtumiin → EventBus
* AI:n päätöksiin → AI Brain
* tietoon → Truth / Knowledge
* muistiin → Memory
* oikeuksiin → Permission Layer
* Git-operaatioihin → Git Guardian
* palautumiseen → Recovery
* järjestelmän tilaan → System Pulse

Näin järjestelmä pysyy modulaarisena.

---

# 49. Repository Architecture

Projektin repository sisältää useita pääalueita.

```text
Wood-Booster-OS/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── desktop/
│   └── ...
│
├── server/
│   ├── services/
│   ├── agents/
│   ├── data/
│   └── ...
│
├── Spacemonkey/
│
├── boosterverse/
│
├── booster_win11_bridge/
│
├── backend/
│
├── bootstrap/
│
├── config/
│
├── docs/
│
├── experiments/
│
├── iso_boot_root/
│
├── scripts/
│
├── snapshots/
│
├── release/
│
├── src-tauri/
│
└── tests/
```

Repositoryn eri osien tulee säilyttää omat vastuunsa.

---

# 50. Documentation Requirements

Projektin dokumentaation tulee sisältää:

* README
* arkkitehtuuridokumentaatio
* PRD:t
* agenttien dokumentaatio
* API-dokumentaatio
* runtime-dokumentaatio
* recovery-dokumentaatio
* Git Guardian -dokumentaatio
* boot/ISO-dokumentaatio
* developer documentation

Dokumentaation tulee kehittyä koodin mukana.

---

# 51. Development Workflow

Suositeltu kehitysketju:

```text
Idea
 ↓
PRD
 ↓
Architecture
 ↓
Implementation
 ↓
Build
 ↓
Test
 ↓
Stable Build
 ↓
Git Commit
 ↓
Git Push
 ↓
Verification
```

Virheellinen build ei saa muuttua stable buildiksi.

---

# 52. Git Workflow

Päähaara:

```text
main
```

Kehitystyössä voidaan käyttää feature-haaroja:

```text
feature/<name>
fix/<name>
refactor/<name>
```

Commitien tulee kuvata muutosta selkeästi.

Esimerkiksi:

```text
feat(desktop): integrate desktop runtime
feat(desktop): add virtual desktop navigation
fix(build): repair virtual desktop route
```

---

# 53. Quality Gate

Jokaisen merkittävän muutoksen tulee läpäistä:

```text
Code
 ↓
Build
 ↓
Tests
 ↓
Validation
 ↓
Stable Build
```

Jos build epäonnistuu:

```text
DO NOT COMMIT AS STABLE
```

Jos build onnistuu:

```text
Register Stable Build
```

---

# 54. Future AI Capabilities

Pitkän aikavälin mahdollisuuksia ovat:

* AI-controlled desktop
* natural language system commands
* intelligent file organization
* project automation
* AI code development
* autonomous testing
* intelligent Git management
* predictive recovery
* system optimization
* local model orchestration
* multi-agent collaboration
* system-wide contextual memory

Näiden kaikkien tulee käyttää samoja permission-, audit-, truth- ja verification-kerroksia.

---

# 55. Lopullinen tavoite

Wood-Booster OS:n lopullinen tavoite voidaan tiivistää seuraavasti:

> **Rakentaa henkilökohtainen AI-käyttöjärjestelmä, jossa työpöytä, AI, automaatio, kehitysympäristö, liiketoimintatyökalut, muistijärjestelmä ja käyttöjärjestelmä toimivat yhtenäisenä, modulaarisena ja palautumiskykyisenä kokonaisuutena.**

Wood-Booster OS ei ole vain käyttöliittymä.

Se ei ole vain AI-agentti.

Se ei ole vain Linux-jakelu.

Se ei ole vain yritysohjelmisto.

Se on näiden kerrosten yhdistelmä:

```text
WOOD-BOOSTER OS
       │
       ├── Operating System
       ├── Desktop
       ├── AI
       ├── Agents
       ├── Automation
       ├── Memory
       ├── Knowledge
       ├── Business
       ├── Development
       ├── Git Guardian
       ├── Recovery
       ├── System Pulse
       └── Spacemonkey
```

## Product Principle

**Build a system that can understand itself, assist its user, protect its own state, recover from failure, and continuously evolve — without sacrificing user control.**

---

# 56. Current Development Status

Wood-Booster OS on aktiivisesti kehittyvä järjestelmä.

Nykyinen arkkitehtuuri sisältää jo merkittäviä osia:

* AI Brain V2
* Spacemonkey
* System Pulse
* Truth Layer
* Memory
* Knowledge
* Agent Runtime
* Desktop Runtime
* Window Manager
* Workspace Manager
* App Registry
* Desktop Event Bus
* Virtual Desktop
* Git integration
* Stable Build
* Recovery architecture
* system awareness
* Windows 11 bridge / experimental modules
* bootable ISO infrastructure
* developer tooling

Kaikkia komponentteja ei vielä tule pitää tuotantovalmiina.

PRD:n tarkoitus on määrittää yhteinen arkkitehtoninen suunta, jonka perusteella järjestelmän nykyisiä moduuleja voidaan vakauttaa ja uusia ominaisuuksia rakentaa.

---

# 57. Final Architecture Philosophy

Wood-Booster OS rakennetaan seuraavan ajatuksen ympärille:

```text
                 USER
                   │
                   ▼
              SPACEMONKEY
                   │
                   ▼
            SYSTEM PULSE
                   │
                   ▼
              AI BRAIN
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
       AGENTS   MEMORY   KNOWLEDGE
          │        │        │
          └────────┼────────┘
                   ▼
              DECISION
                   │
                   ▼
             PERMISSIONS
                   │
                   ▼
               TOOLS
                   │
                   ▼
              AUTOMATION
                   │
                   ▼
          DESKTOP / SYSTEM
                   │
                   ▼
               HARDWARE
```

Järjestelmän tulee aina pyrkiä samaan sykliin:

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
DECIDE
   ↓
ACT
   ↓
VERIFY
   ↓
REMEMBER
   ↓
RECOVER IF NEEDED
   ↓
LEARN
```

Tämä sykli muodostaa Wood-Booster OS:n AI-käyttöjärjestelmäfilosofian ytimen.
