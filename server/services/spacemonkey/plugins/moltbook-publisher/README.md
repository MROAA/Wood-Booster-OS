# Moltbook Publisher

Boosterverse-plugin joka yhdistää Spacemonkeyn
[Moltbookiin](https://www.moltbook.com) — "a social network for AI
agents". Lukee syötettä ja luo/julkaisee postauksia Moltbookin REST
API:n kautta (ks. https://www.moltbook.com/skill.md).

## Rakenne

- `tools/moltbookAPITool.js` — matalan tason Moltbook API -kääre
  (`ToolBus`-yhteensopiva). Bearer-autentikointi, palauttaa aina
  `{ success, ... }`, ei koskaan heitä poikkeusta kutsujalle.
- `skills/readMoltbookFeedSkill.js` — lukee syötteen (personoitu tai
  koko sivusto).
- `skills/publishMoltbookPostSkill.js` — luo ja julkaisee postauksen
  suoraan.
- `workflows/publishMoltbookPostWorkflow.js` — ajaa julkaisu-skillin.
- `capabilities/`, `permissions/` — kuvaukset, eivät suorita mitään.

## Tarkoituksella eri linjassa kuin WordPress/Instagram: ei ihmisen hyväksyntää

`BOOSTERVERSE_SPEC.md`:n Security Rule vaatii oletuksena ihmisen
hyväksynnän kaikille vaarallisille toiminnoille, ja WordPress/Instagram
Publisher noudattavat tätä. Moltbookissa `moltbook.publish` on
tietoinen poikkeus — Marc pyysi eksplisiittisesti täyttä autonomiaa
(luku + luonti + julkaisu ilman erillistä hyväksyntää joka kerta). Ks.
`permissions/moltbookPublisherPermissions.js` perusteluineen.

Turvaverkkona Moltbookin oma rate limit (1 postaus / 30 min) rajoittaa
yhden virheellisen postauksen vaikutuksen, ja postaukset ovat
poistettavissa (`DELETE /posts/POST_ID` — ei vielä omana Skillinä,
mutta `tool.execute` tukee helposti laajennusta).

## Ympäristömuuttujat

Pakollinen:

- `MOLTBOOK_AGENT_API_KEY` — Moltbookin agentti-API-avain (Bearer-token).

Valinnainen:

- `MOLTBOOK_APP_KEY` — varattu tulevaa käyttöä varten, ei vielä luettu.
- `MOLTBOOK_DRY_RUN=true` — testaa julkaisun ilman verkkokutsuja.

Jos `MOLTBOOK_AGENT_API_KEY` puuttuu, kutsut epäonnistuvat siististi
virhekoodilla `credentials_not_configured` — eivät kaadu.

## Testaus

`node --test server/services/spacemonkey/plugins/moltbook-publisher/tests/`

Yksikkötestit ajavat mockatulla `fetch`illä (ei verkkokutsuja). Koko
runtime-kytkentä ja oikea API on lisäksi vahvistettu käsin oikealla
API-avaimella: `getFeed`/`getPosts`/`get_profile` palauttavat oikeaa
dataa Moltbookista `startSpacemonkeyRuntimeBootstrap()`:in kautta.
