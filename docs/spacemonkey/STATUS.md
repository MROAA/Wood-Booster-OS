# Spacemonkey — tilanne ja työohje

Tämä on Spacemonkeyn (Hearthwood Dev Studion AI-kehityskumppani) yhteinen
tilannekuva. Mikä tahansa AI-istunto (Claude Code, ChatGPT tai muu) lukee
tämän ensin ja päivittää sen työn päätteeksi. Tavoite: ei koodin
copy-pastea istuntojen välillä.

Pääasiakirja (vaatimukset): `docs/hearthwood-dev-studio-prd.md` ja
"Hearthwood Dev Studio — PRD & Spacemonkey Reliability Roadmap" (20.10.2026).

## Yhdellä komennolla

Aja `server/`-hakemistossa:

| Komento | Mitä tekee |
|---|---|
| `npm run check:spacemonkey` | oxlint + kaikki Spacemonkey-testit |
| `npm run spacemonkey:probe -- --guardian` | Guardian-regressio: näkyykö oikea lähdekoodi mallille |
| `npm run spacemonkey:probe -- "tehtävä"` | mikä tahansa tehtävä todisteketjun läpi, ilman AI:ta |
| `npm run spacemonkey:probe -- --llm "tehtävä"` | sama + Ollaman päätös (vain tarkastettava ehdotus) |
| `npm run spacemonkey:probe -- --expect a,b "tehtävä"` | exit 1, jos symbolit a tai b puuttuvat kontekstista |

Probe ei kirjoita tiedostoja. Sen tuloste on lyhyt ja liitettävissä
suoraan toiselle AI:lle tai raporttiin.

## Todisteketju (kuka tekee mitä)

```
tehtävä
 → hearthwoodProjectExplorer   tiedostojen haku (nimi + määrittelyt + kommentit)
 → hearthwoodCodeReader        rivinumeroidut katkelmat, 1 kutsuaskel, omittedSymbols
     ↳ hearthwoodSourceIndex   puhtaat funktiot: termit, määrittelyt, painot, kutsut
 → hearthwoodPlanningContext   mallin konteksti (≤ 8000 merk.) + LUKEMATTA JÄI
 → hearthwoodChangePlanGenerator → Ollama
 → hearthwoodEvidenceValidator / PlanningDecision / Reliability- ja Plan-portit
 → ihmisen hyväksyntä (Safety Supervisor)
```

Porttikoodia ei muuteta testien helpottamiseksi. Pelikoodiin (`src/`) ei
kosketa Dev Studion korjausten yhteydessä.

## Tilanne 20.10.2026 (ilta)

Haara `feat/spacemonkey-source-reader`, worktree
`/home/marc/Wood-Booster-AI/Wood-Booster-OS-spacemonkey-reader`, PR #681
(**draft**, ei mergetty). `check:spacemonkey`: **154/154** (baseline 131).

- [x] **Sprintti 1: lähdekoodin lukija.** Sisältöperusteinen haku,
      rivinumeroidut katkelmat, yhden askeleen kutsuketju, `omittedSymbols`.
- [x] **Sprintti 2: todisteet ja päätökset.**
  - Kehote katkesi hiljaa (4505 tokenia / 4096). Nyt ikkuna on 8192, ja
    `assertPromptFits` hylkää liian pitkän kehotteen.
  - Konevahvistetut lähdefaktat (`hearthwoodSourceFacts.js`) lisätään
    kehotteeseen. Guardianin kärkifaktat: `attackUnit` kutsuu
    `eligibleGuardian` (rivi 2417) ja `onGuard` (rivi 2428).
  - `evidenceReport` erottaa lähdefaktat, testatun toiminnan, mallin
    päätelmän (vahvat ja heikot viitteet) ja tuntemattoman. Lisäksi
    `qualityNote`, kun perustelu nojaa vain sivulähteisiin.
  - Kopioitu vastauspohja hylätään. Testit kattavat kaikki kolme päätöstä
    sekä väärennetyt syötteet.
  - **Mallivalinta todisteilla** (`spacemonkey:probe --repeat 6`):

    | Malli | Guardian (odotus NO_CHANGE) | Puuttuva mekaniikka (odotus CHANGE) | Kesto |
    |---|---|---|---|
    | qwen2.5-coder:7b | 2/6, muut INSUFFICIENT / aikaraja | – | 4–7 s |
    | qwen2.5-coder:14b | **6/6**, vahva viite `onGuard` | **3/3**, viitteinä `attackUnit` ja `eligibleGuardian` | 9–31 s, ensimmäinen ajo 36 s |

    Oletusmalli on nyt `qwen2.5-coder:14b`. Sen voi vaihtaa muuttujalla `HEARTHWOOD_PLAN_MODEL`.
- [ ] **Käyttöönotto (vahvistettava).** Marcin Studio
      (`localhost:5173/hearthwood-studio`) pyörii päächeckoutista
      (`hearthwood-stable`). Siellä `GET /api/hearthwood-dev/status`
      palauttaa **404**, koska reittiä ei ole. Spacemonkey-avustaja ei siis
      toimi Studiossa ennen kuin tämä haara on viety sinne ja backend on
      käynnistetty uudelleen. Suositus: aseta `OLLAMA_TIMEOUT_MS=120000`.
      Mallin ensilataus ja kaksi yritystä voivat lähestyä 60 s:n oletusta.
- [ ] Sprintti 3: muutossuunnitelmien laatu (tiedostolista, riippuvuudet, turhien muutosten välttäminen)
- [ ] Sprintti 4: hallittu toteutus ja verifiointi (UI ja päästä päähän)
- [ ] Sprintti 5: editorien yhtenäistäminen

Erillinen haara `feat/hearthwood-heroes-studio-edit` (`2cbdad01`, worktree
`Wood-Booster-OS-hw-heroes-studio`): Marcin Dev Studiossa tekemät
sankarimuutokset (`units.js` ja 67 kuvaa), lähtöisin `hearthwood-stable`-haarasta.
Ei pushattu.

## Tunnetut rajoitukset

- Haku lukee kaikki noin 274 sallittua tiedostoa joka kerta. Nopeus on toistaiseksi riittävä.
- Yleiset sanat ("power") tuovat edelleen jonkin verran sivukatkelmia.
- `hearthwoodCallSiteVerification`-moduulin aaltosulkulaskuri ei löydä funktion loppua sisäkkäisten template-merkkijonojen kohdalla (`caller: null` esimerkiksi `attackUnit`-funktiossa). SourceFacts kiertää tämän rivialueilla, mutta itse moduuli on korjaamatta.
- Fixture-pohjaiset arviointitapaukset (`cases.json`) puuttuvat. Mittaus tehtiin oikeaa lähdekoodia vasten.
- `hearthwoodCodeAnalysis.js` käyttää yhä 4096 tokenin kontekstia ja leikkaa lukijan tuloksen vielä omalla tavallaan.

## Säännöt jokaiselle AI-istunnolle

1. Lue tämä tiedosto ja `CLAUDE.md`. Työ tehdään omassa worktreessa ja haarassa, ei suoraan `development`- tai `main`-haaraan.
2. Toista ongelma testillä tai probella ennen korjausta.
3. Älä ilmoita testiä, AI-ajoa tai hyväksyntää tehdyksi, ellei sitä oikeasti tehty.
4. Päivitä "Tilanne"-osio ja testimäärät ennen työn lopettamista.
