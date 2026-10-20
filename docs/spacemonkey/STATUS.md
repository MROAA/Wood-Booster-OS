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
(**draft**, ei mergetty). `check:spacemonkey`: 154/154 (baseline 131).

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
- [x] **Käyttöönotto 20.10.2026:** `hearthwood-stable` = `ca65ba65`,
      backend `wb-node`. Elävä `/api/hearthwood-dev/plan` palauttaa 200 (14B).
- [x] **Sprintti 3: muutossuunnitelmien laatu.** Haara
      `feat/spacemonkey-sprint3-planning` (`64ff6168` ja lainauskorjaus),
      worktree `Wood-Booster-OS-spacemonkey-sprint3`. Ei pushattu.
      `check:spacemonkey` 171/171.
  - **Integraatiovika löytyi ja korjattiin:** suunnittelukehote kielsi
    koodiaidat, mutta SourceTruthGuard ja Safety Supervisor vaativat
    vähintään yhden aidatun, merkilleen oikean lainauksen. Siksi
    yksikään `CHANGE_REQUIRED`-suunnitelma ei päässyt Studiossa
    käyttäjälle (`QUOTATIONS_UNVERIFIED`). Nyt kehote pyytää lainauksen,
    ja generaattorin neuvoa-antava esitarkistus antaa mallille yhden
    uuden yrityksen. Portit päättävät edelleen. Elävä 14B-API-testi:
    2/3 muutossuunnitelmaa läpäisi kaikki portit (`CAUTION`,
    `executionApproved: false`). Yhden SourceTruthGuard esti oikein.
  - **Toinen käyttöönoton este:** Supervisor vaatii, että
    `HEARTHWOOD_PROJECT_ROOT` on asetettu. `wb-node`-palvelulle sitä ei ole
    asetettu, joten elävässä Studiossa muutossuunnitelmat estyvät
    (`PROJECT_ROOT_MISMATCH`), kunnes muuttuja asetetaan.
  - `hearthwoodPlanQuality.js`: konetarkistukset erillään mallin väitteistä.
    Suunnitelma jaetaan välttämättömiin muutoksiin (tiedosto perustellaan
    sen omalla luetulla symbolilla), JATKO-ideoihin (eivät koskaan
    muutoslistalla) ja perusteettomiin tiedostoihin (uusi yritys, sitten
    hylkäys). Mallin osiot (Riippuvuudet, Testit, Riskit) merkitään
    `model-claimed`, ja `model-correctness` on `not-verifiable-here`.
  - `hearthwoodDependencyImpact.js`: muutettavien symbolien määrittely,
    todennetut kutsukohdat riveineen, rajapintariski, olemassa olevat
    testit (symbolin mainitseva testi ≠ pelkkä tiedoston import) ja
    puuttuvat regressiotestit. Tarkistusalue kerrotaan aina, eikä
    vaikutusanalyysiä väitetä täydelliseksi.
  - Haku: suomi–englanti-pelisanasto (pelkällä suomella kirjoitettu
    tehtävä löytää englanniksi nimetyn koodin). Sanastosta päätelty sana
    painaa puolet käyttäjän kirjoittamasta.
  - Konteksti: budjetti jaetaan katkelmatasolla kaikkien tiedostojen yli
    relevanssijärjestyksessä. Pois jääneet nimetään myös silloin, kun
    tiedostosta ei mahtunut mitään.
  - Riippumaton arviointi: testiprojekti `server/spacemonkey-eval/fixture`
    (yrttipeli, ei Guardian) sekä `npm run spacemonkey:eval`.
    - Ennen sanastoa: **0/12**. Suomenkielinen tehtävä ei löytänyt koodia.
    - Jälkeen: **12/12 ja 11/12**. Ainoa virhe: malli yritti "luoda" olemassa
      olevan tiedoston, ja validointi hylkäsi sen turvallisesti.
    - Guardian (14B): **6/6** `NO_CHANGE_NEEDED`. Puuttuva mekaniikka: 2/2
      `CHANGE_REQUIRED`, ja yksi ajo kaatui, kun oomd tappoi Ollaman.
- [ ] Sprintti 4: hallittu toteutus ja verifiointi (UI ja päästä päähän)
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
- **Muisti:** 20.10. systemd-oomd tappoi Ollaman kahdesti: klo 18.28
  (kaksi mallia muistissa) ja klo 18.44 (vain 14B, swap 10/14 Gt).
  Rinnakkaisuusrajat vähentävät riskiä, mutta eivät poista koko koneen
  muistipainetta. Ensimmäinen kaatuminen klo 18.28 (RAM 14 Gt,
  swap 11/14 Gt käytössä, 14B vie 10,8 Gt). Kahden mallin (14B `/plan` ja
  7B `/analyze`) yhtäaikainen lataus riittää kaatamaan sen. Suositus
  (vaatii sudon, Marcin päätös): lisää `OLLAMA_MAX_LOADED_MODELS=1`
  tiedostoon `/etc/systemd/system/ollama.service.d/override.conf`.
- **`/analyze` käyttää 7B:tä**, koska `hearthwoodCodeAnalysis.js`:llä on oma
  `DEFAULT_MODEL` (`CODE_OLLAMA_MODEL || "qwen2.5-coder:7b"`) ja
  `MODEL_CONTEXT = 4096`. Sprintti 2 muutti vain suunnittelun. Mitattu
  kehote: 3038 tokenia / 4096, eli se ei katkea, mutta vastaukselle jää noin
  1000 tokenia. Ehdotus erilliseksi, testattavaksi muutokseksi: oma
  `HEARTHWOOD_ANALYZE_MODEL`, `assertPromptFits`-tyyppinen vartija ja
  mittaus kysymysjoukolla 7B vs. 14B ennen vaihtoa. Muistirajan takia
  sama malli molemmille on turvallisin. **Huom:** Ollama lataa mallin
  uudelleen, jos `num_ctx` vaihtuu (`/analyze` 4096, `/plan` 8192), joten
  yhtenäistettäessä myös ikkuna kannattaa yhtenäistää.
- `hearthwoodCodeAnalysis.js` leikkaa lukijan tuloksen vielä omalla tavallaan.
- Sanasto on käsin koottu (noin 45 sanarunkoa). Puuttuva termi heikentää hakua. Lisäys tehdään tiedostoon `hearthwoodSourceIndex.js` (`FI_EN_TERMS`).

## Säännöt jokaiselle AI-istunnolle

1. Lue tämä tiedosto ja `CLAUDE.md`. Työ tehdään omassa worktreessa ja haarassa, ei suoraan `development`- tai `main`-haaraan.
2. Toista ongelma testillä tai probella ennen korjausta.
3. Älä ilmoita testiä, AI-ajoa tai hyväksyntää tehdyksi, ellei sitä oikeasti tehty.
4. Päivitä "Tilanne"-osio ja testimäärät ennen työn lopettamista.
