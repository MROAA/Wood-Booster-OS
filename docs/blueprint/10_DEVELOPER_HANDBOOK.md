# Wood-Booster OS — Developer Handbook

*Master Blueprint, Volume X.*

Tämä dokumentti kuvaa käytännöt, joita on tosiasiallisesti
noudatettu tämän projektin kehityksessä — ei keksittyjä sääntöjä,
vaan sitä mitä git-historia jo osoittaa toimivaksi. Kun uutta
kehitystä (ihmisen tai AI-avustajan tekemää) tehdään, näitä
käytäntöjä kannattaa jatkaa.

## Stack

- Frontend: React 19 + Vite + Tailwind, `src/`.
- Backend: Express + Prisma ORM + SQLite, `server/`.
- AI: paikallinen Ollama (`qwen2.5:7b`), ei pilvi-API:a
  ("Offline on oletus", Constitution laki 7).

## Muutosten koko ja rakenne

- **Yksi committi per looginen yksikkö.** Ei yhtä isoa "kaikki
  muutokset" -commitia. Jokainen commit-viesti selittää *miksi*, ei
  vain mitä.
- Ennen migraatiota tai skeeman muutosta: lue nykyinen malli
  kokonaan, älä oleta muotoa muistin varassa.
- Ennen tuhoavaa toimintoa (`rm -rf`, tiedostojen poisto,
  tietokannan suora muokkaus): `git status` ensin, ja jos jotain
  poistetaan suoraan tietokannasta (koska poisto-reittiä ei ole),
  varmistava hakukysely ensin.

## Todennus ennen "valmis"-merkintää

Jokainen muutos tässä projektissa on vahvistettu näin ennen
committia, oli kyse sitten pienestä korjauksesta tai
tietokantamuutoksesta:

1. `node --check` tai `npx vite build` — kääntyykö koodi.
2. `npx oxlint` (tai `npm run lint`) — ei uusia virheitä
   (pre-existing-virheet, esim. `truthBundle.broken.js`, on eroteltu
   erikseen eikä sotkettu uusiin muutoksiin).
3. Live-testi oikeilla HTTP-kutsuilla (`curl`) tai selaimen
   dev-serverillä — ei pelkkä "pitäisi toimia" -oletus.
4. Jos syntyy testidataa: siivotaan pois (oikean poisto-API:n kautta,
   tai suoralla `sqlite3`-poistolla jos poisto-reittiä ei ole,
   varmistavan haun jälkeen).

## Väitteiden tarkistaminen ennen toimintaa

Tässä projektissa on törmätty useaan kertaan tilanteeseen jossa
vanha dokumentti tai muistikuva ei enää vastannut todellisuutta
(esim. 32 Gt:n siivousarvio osoittautui 347 Mt:ksi kun tarkistettiin
oikeasti; kahden AI-järjestelmän oletettu ristiriita osoittautui
osittain jo korjatuksi kun luettiin koodi suoraan). Periaate: **lue
koodi, älä luota yhteenvetoon** — myös tämän Blueprintin sisältöön,
jos se joskus alkaa erota koodin todellisuudesta.

## Vaarallisen/kuolleen koodin käsittely

- Ennen poistoa: `grep`-haku varmistaa nolla tuojaa (importeria)
  koko koodikannasta.
- Jos jokin näyttää duplikaatilta, vertaa sisältöä oikeasti (`diff`)
  ennen kuin oletat sen olevan turha — tässä projektissa löytyi
  useampi "duplikaatti" joka osoittautuikin sisällöltään erilaiseksi
  kuin oletettiin.
- Vasta kun molemmat on varmistettu, poisto tehdään omana committina.

## Migraatiot

Prisma-skeemamuutokset: `npx prisma migrate dev --name
kuvaava_nimi --schema=prisma/schema.prisma`, ajettuna
`server/`-hakemistosta. Migraatiotiedostot committoidaan mukaan.

## Mitä tänne EI vielä kuulu

Testiautomaatio (yksikkötestit, CI-pipeline) ei ole vielä osa tätä
projektia — kaikki todennus tapahtuu manuaalisesti build/lint/live-
testien kautta. Tämä on tietoinen nykytila, ei suositus: jos/kun
projekti kasvaa useamman kehittäjän työksi, tämä osio pitää
täydentää.
