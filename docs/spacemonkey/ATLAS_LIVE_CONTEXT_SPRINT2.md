# Spacemonkey Sprint 2: Project Atlas ja Live Context

- Päivä: 2026-10-21
- Haara: `feat/hq-spacemonkey-assistant`
- Pohja: stable `7641f215`
- PRD: Master PRD V8, Sprint 2

## Valmis, kun

Spacemonkey vastaa kysymykseen "Mitä Wood-Booster HQ:ssa on rakennettu ja
mitä projektissani tapahtuu?" oikeiden lähteiden perusteella. Tämä toteutuu
näin:

- **Rakennettu:** vastaus kootaan todisteista ja leimataan haaralla ja
  commitilla. Atlas ei aja testejä, joten mitään ei merkitä testatuksi.
- **Projektissa tapahtuu:**
  - Jos projekti on avattuna, vastaus on sen yhteenveto oikean
    projektitunnisteen perusteella.
  - Muuten vastaus listaa keskeneräiset projektit.
  - Lisäksi kerrotaan, mikä näkymä on auki.

## Miten tila päätellään

`server/services/spacemonkey/inventory/hqSystems.js` kertoo, mistä kunkin
järjestelmän koodi löytyy. Se ei kerro tilaa, eikä polkuja koskaan keksitä.
`systemAtlas.js` laskee tilan:

| Tila | Todiste |
|---|---|
| toteutettu | kaikki koodi on olemassa; palvelin (`server/index.js`) tai sovellus (`src/main.jsx`) lataa sen import-graafin mukaan, tai muu todiste kytkennästä (esim. git-hook); koodi on vakaassa haarassa |
| kehitteillä | koodi on vain tässä kehityshaarassa tai muissa paikallisissa haaroissa (`git cat-file --batch-check`) |
| suunniteltu | koodia ei ole, mutta suunnitelmadokumentti on repossa |
| vanhentunut | merkitty vanhentuneeksi, ja koodi on olemassa |
| epävarma | osa koodista puuttuu, palvelin tai sovellus ei lataa koodia, tai toteutusta ei tunneta |
| testattu | ei koskaan Atlasissa: Atlas kertoo vain mitkä testitiedostot löytyvät (`run: false`) |

Lisäksi:

- Jokaiselle järjestelmälle lasketaan commitoimattomat muutokset.
- Suojattuja polkuja (`.env`, avaimet, tietokannat, varmuuskopiot) ei lueta.
- Luettelon kohta, jossa on suojattu, absoluuttinen tai `..`-polku,
  hylätään.
- Hearthwoodia ei kartoiteta, koska se on erillinen projekti.

Live Context käyttää olemassa olevaa `runtimeContext`-tietoa (näkymän nimi,
polku, `activeProject.id`). Projektiosa ajetaan samojen rekisteröityjen
kyvykkyyksien kautta kuin suorat kysymykset, oikeustarkistuksineen.

## Nykyinen tulos (feat-haara, 7641f215)

- **Toteutettu, 24 järjestelmää:**
  - Liiketoiminta: Dashboard, projektit, asiakkaat, varasto, ostot,
    tarjoukset, laskutus, tietopankki ja media.
  - Kehitys: Dev Studio ja koodimuutosluonnokset.
  - Luotettavuus ja palautus: Git Guardian, System Pulse, palautus ja
    Stable Build.
  - Työtila: Desktop.
  - Yhteinen AI-ydin: AI-ydin ja muisti.
- **Kehitteillä:**
  - Project Atlas, vain tässä haarassa.
  - Human Approval Gateway, turvallisuushaarassa.
- **Epävarma:** tuotesuunnittelu ja valmistussuunnittelu, koska
  toteutusta ei tunneta. Ne ovat V8:n Digital Workshopin tavoitteita.

## Uutta

- `inventory/systemAtlas.js`, `inventory/hqSystems.js`, `inventory/git.js`
  (vain lukevat git-kyselyt)
- HqAssistant: työkalu `hq-atlas`, skill, workflow ja kyvykkyys
  `hq.atlas.overview`
- Keskustelu: "mitä on rakennettu", "mitä HQ osaa", "kehitystilanne" ja
  "mitä projektissani tapahtuu"
- `GET /api/agents/atlas`

## Testit

| Mitä | Tulos |
|---|---|
| Atlas oikealla väliaikaisella git-repolla (vakaa haara ja kaksi kehityshaaraa): kaikki tilat, haarojen erottelu, commitoimattomat muutokset, vaaralliset polut | 5/5 |
| Keskustelu: planneri, Atlas-vastaus, avattu projekti, ei avattua projektia | uudet testit läpi |
| Kaikki uudet testit yhteensä | 90/90 |
| Mutaatiotarkistus: Atlas 12/12, agentit 17/17, HQ 13/13 | 42/42 kiinni |
| Regressio: pluginit 183/183, `check:spacemonkey` 216/216 | läpi |

Testi löysi bugin, joka korjattiin: git-apufunktio poisti porcelain-tulosteen
alusta välilyönnin, jolloin ensimmäinen muutettu polku katkesi.

Vite-buildia ja selaintestiä ei ajettu muistitilanteen vuoksi.

## Seuraavaksi (V8 Sprint 3)

Workspace Root ja käyttöjärjestelmän tilan luku vain luku -tilassa.
