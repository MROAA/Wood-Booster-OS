# Wood-Booster HQ — Intelligence Architecture

*Master Blueprint, Volume VI.*

[Spacemonkey Codex](05_SPACEMONKEY_CODEX.md) kuvaa kuka Spacemonkey
on. Tämä dokumentti kuvaa **miten se on rakennettu tänään ja mihin
suuntaan sen sisäistä arkkitehtuuria kehitetään** — koodin tasolla,
ei persoonan tasolla.

## Nykytila (todennettu tässä projektissa)

Elävä chat-polku on tänä päivänä:

```
frontend (ProjectAIChat.jsx, AIChat.jsx, AIWorkspace.jsx)
  -> POST /api/agents/chat
  -> server/routes/agentChat.js (runAgentChat)
  -> server/services/agentExecutor.js (agentin valinta, identiteettisuoja)
  -> server/services/aiBrain.js (runAIBrain)
  -> server/services/contextBuilder.js (buildAIContext - kokoaa
     godfilet, spacemonkeyPersona.js:n huumorin, muistin, keskustelun)
  -> Ollama (qwen2.5:7b, paikallinen)
```

Kaksi muuta reittiä (`/api/ai-brain/chat`, `/api/ai-brain-v2/chat`)
ovat nyt ohuita kääreitä tämän saman polun ympärillä, ei omia
rinnakkaisia toteutuksiaan (ks. commit "Deep AI consolidation").
`/api/ai-brain-v2/chat` lisää tämän päälle yhden aidosti erillisen
kerroksen: **Memory Pipeline**, joka arvioi jokaisen vastauksen
jälkeen kannattaisiko siitä tallentaa muistiehdotus (ei suoraan
pysyvään muistiin — vaatii hyväksynnän).

Tämä on suoraviivainen pyyntö-vastaus-malli: käyttäjä kysyy, AI
kokoaa kontekstin kertaalleen ja vastaa. Ei jatkuvaa taustaprosessia,
ei tilannekuvan ylläpitoa keskustelujen välillä.

## Tavoitearkkitehtuuri (ei vielä toteutettu)

Marcin kuvaama pitkän aikavälin arkkitehtuuri on huomattavasti
rikkaampi — joukko jatkuvasti pyöriviä sisäisiä moottoreita, ei yksi
pyyntö-vastaus-funktio:

```
Live Context Engine
  -> Intent Engine
  -> Knowledge Engine
  -> Memory Engine
  -> Utility Engine
  -> Automation Engine
  -> Suggestion Engine
  -> Learning Engine
```

- **Live Context Engine** — ylläpitää jatkuvasti tilannekuvaa (mikä
  projekti auki, mikä työvaihe, mitä tiedostoja katsottu, viimeisimmät
  kuvat) ilman että käyttäjän tarvitsee selittää sitä joka kerta.
- **Intent Engine** — Marcin sanoin mahdollisesti koko projektin
  tärkein AI-osa: päättelee mitä käyttäjä yrittää saada aikaan, ei
  vain mitä hän kirjoitti.
- **Knowledge Engine** — sama rooli kuin nykyisellä
  `contextBuilder.js`:llä ja Knowledge-tietopankilla, mutta
  laajempana verkkona (asiakas↔projekti↔materiaali↔kuva↔päätös).
- **Memory Engine** — pitkäaikaismuisti, laajempi kuin nykyinen
  `Memory`/`MemoryProposal`-malli.
- **Utility Engine** — pisteyttää jatkuvasti onko jokin toiminto
  oikeasti hyödyllinen (ks. [Human Model](04_HUMAN_MODEL.md)).
- **Automation Engine, Suggestion Engine, Learning Engine** — havaitsee
  toistuvat kaavat, ehdottaa automaatiota, oppii hyväksynnöistä.

Kognitiivinen sykli jokaisen näiden sisällä (ks. Codex): **Havainto →
Ymmärtäminen → Muisti → Päätelmät → Toiminta → Oppiminen.**

## Ero nykytilan ja tavoitteen välillä

Nykyinen toteutus vastaa hyvin kysymykseen "mitä käyttäjä juuri
kysyi", mutta ei vielä pysty siihen mitä Marc kutsuu "aina
tietoiseksi, ei aina ääneksi" -periaatteeksi (ks. Codex): jatkuvaan,
taustalla pyörivään tilannekuvaan joka mahdollistaa ehdotukset ilman
että käyttäjä pyytää niitä erikseen joka kerta.

Tämä ei ole tämän istunnon skoopissa toteutettava muutos — se on
seuraava, isompi arkkitehtuurinen harppaus, kun Master Blueprintin
muu osa on vakiintunut.

## Kehitysportaat — älykkyys kasvaa portaittain, ei hypäten

Marcin antama järjestys (PRD 7.0), johon tavoitearkkitehtuuria
kohti edetään yksi porras kerrallaan, ei suoraan huipulle:

0. **Tool** — käyttäjä käyttää ohjelmaa.
1. **Context** — järjestelmä tietää tilanteen.
2. **Assistance** — järjestelmä vastaa kontekstin perusteella.
3. **Suggestion** — järjestelmä huomaa hyödyllisiä seuraavia toimia.
4. **Preparation** — järjestelmä tekee työn valmiiksi hyväksyttäväksi.
5. **Automation** — hyväksytyt, turvalliset rutiinit tapahtuvat automaattisesti.
6. **Optimization** — järjestelmä löytää käyttäjän työnkuluista parannuskohteita.

Nykytila (yllä kuvattu pyyntö-vastaus-malli) vastaa tasoa **0-1**:
käyttäjä saa vastauksia, mutta järjestelmä ei vielä ylläpidä jatkuvaa
tilannekuvaa. "Ensin tietoisuus. Sitten ehdotukset. Sitten
valmistelu. Vasta lopuksi automaatio." — tätä järjestystä ei saa
hypätä yli, vaikka Automation Engine (ks.
[Automation Bible](07_AUTOMATION_BIBLE.md)) onkin jo kuvattu
tavoitteena.

## Suositeltu seuraava tekninen kehitysaskel: Spacemonkey Live Context v1

Tämä on Marcin oma, konkreettinen suositus siitä mikä on juuri nyt
oikea kokoinen seuraava askel — ei koko Live Context Engine -konseptin
täysi toteutus, vaan sen ensimmäinen, rajattu versio:

Version 1 tarvitsee tietää vain:
- nykyinen käyttäjän näkymä
- aktiivinen projekti
- projektin perustiedot
- viimeisimmät tapahtumat
- avoimet projektitehtävät

Tämä konteksti annetaan Spacemonkeylle jokaisen relevantin
keskustelun yhteydessä. **Ei vielä**: autonomiaa, taustalla
tapahtuvaa päätöksentekoa, automaattista lähettämistä, jatkuvaa
raskasta AI-ajamista — nämä tulevat vasta myöhemmillä
kehitysportailla.

Tämä on pienin muutos joka tekee nykyisestä AI:sta ensimmäistä
kertaa aidosti *osan* Wood-Booster HQ:ää sen sijaan että se olisi
vain kysymys-vastaus-rajapinta sen vieressä.

## Lähteet

- `server/services/agentExecutor.js`, `aiBrain.js`,
  `contextBuilder.js` — nykyinen toteutus.
- [`05_SPACEMONKEY_CODEX.md`](05_SPACEMONKEY_CODEX.md) — kognitiivinen
  malli ja "aina tietoinen" -periaate.
- [`docs/AI-SYSTEMS-MAP.md`](../AI-SYSTEMS-MAP.md) — yksityiskohtainen
  kartoitus kahden AI-järjestelmän alkuperäisestä päällekkäisyydestä.
