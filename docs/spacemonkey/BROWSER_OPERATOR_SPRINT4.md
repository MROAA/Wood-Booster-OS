# Spacemonkey Sprint 4: Playwright-selainoperaattori ja operaattorin kierros

- Päivä: 2026-10-21
- Haara: `feat/hq-spacemonkey-assistant`, pohjana stable `65d94178`
- PRD: Master PRD V8, Sprint 4

## Valmis, kun

Spacemonkey avaa HQ:n kehitysnäkymän, ajaa todellisen käyttöliittymätestin
ja palauttaa luotettavan raportin. Tämä todennettiin oikealla Chromiumilla
ja oikealla HQ-käyttöliittymällä:

```
"Spacemonkey, tarkista Wood-Booster HQ:n kehityspalvelimen tila ja testaa projektinäkymä."

Koneen tila: muisti, kuorma, levyt; wb-node ja Ollama käynnissä;
HQ-backend, Ollama API ja Vite vastaavat (200)
-> raportti työtilaan

Käyttöliittymätesti: Projektinäkymä - LÄPÄISTY (8/8 askelta)
  /projects -> "Projektit" -> 10 projektilinkkiä -> /projects/35
  -> otsikko "WP-plugin-testi" vastaa klikattua projektia
Sivuvirheet 0 · Konsolivirheet 1 · Epäonnistuneet pyynnöt 0 · Estetyt pyynnöt 1
  (GET https://fonts.googleapis.com/css2)
-> raportti ja 2 kuvakaappausta työtilaan
```

Koko kierros kesti 2,3 sekuntia. Konsolivirhe on estetyn ulkoisen fontin
seuraus.

## Operaattorin kierros

1. **Havaitse:** HQ-käyttöliittymän ja backendin terveysreitit, sekä
   halutessa koko koneen tila.
2. **Valitse:** ennalta määritelty skenaario.
3. **Toimi:** eristetty selain.
4. **Todenna:** askeleet, sivuvirheet sekä epäonnistuneet ja estetyt
   pyynnöt.
5. **Muista:** tehtävän kansio työtilassa (JSON, teksti ja kuvat).
   Tehtävän tila on `done` tai `failed`.

Jos käyttöliittymä ei vastaa, selainta ei käynnistetä, ja tehtävä merkitään
epäonnistuneeksi.

## Turvarajat

Tarkemmin: `server/services/spacemonkey/plugins/BrowserOperator/README.md`.

- Vain HQ:n paikalliset osoitteet (`:5173` ja `:3001`) ja vain lukevat
  pyynnöt. Kirjoittavat pyynnöt estetään selaintasolla.
- Uusi selain ja konteksti jokaiselle tehtävälle: ei profiilia, ei
  latauksia, ei service workereita.
- Ei sivun sisäistä JavaScriptiä, ja osoitteita ei oteta keskustelusta.
- Muistivahti (alle 2,5 Gt → ei käynnistystä), aikarajat ja keskeytys.
  Selain suljetaan aina.
- "Avaa projektit" pysyy HQ:n navigointikomentona. Selaintesti käynnistyy
  vain, kun testaamista, selainta tai käyttöliittymää pyydetään erikseen.

## Testit

| Mitä | Tulos |
|---|---|
| Selainpolitiikka, skenaariot, operaattori (selainkorvike): läpäisy, estetyt kirjoitukset ja ulkoiset pyynnöt, virheellinen askel pysäyttää, sivuvirheet, muistivahti, puuttuva selain, aikaraja, keskeytys | 8/8 |
| BrowserOperator-plugin: terveystarkistus → selain → raportti, palvelu alhaalla → ei selainta | 4/4 |
| Keskustelu: planneri, operaattorin kierros, epäonnistuva testi, testi puuttuu | 4 uutta, kaikki läpi |
| **Oikea Chromium** HQ:n kehityskäyttöliittymää vastaan (`SPACEMONKEY_BROWSER_TESTS=1`) | 1/1, 2,1 s |
| Mutaatiotarkistus: selaimen suojaukset | 15/15 kiinni |

Oikea selaintesti ajettiin muistivahdin alla (oma prosessiryhmä,
katkaisu alle 1,5 Gt:n). Käytettävissä oli 3,3–4,9 Gt muistia.

Ensimmäinen oikea ajo paljasti skenaarion virheen, joka korjattiin. Testi
odotti ensimmäistä h1-otsikkoa, mutta se on yläpalkin "Wood-Booster HQ",
ja projektin otsikko latautuu myöhemmin. Nyt testi odottaa
saavutettavalla nimellä juuri klikatun projektin otsikkoa.

## Riskit

- Testi lukee live-tietokannan projekteja (vain lukevat pyynnöt).
  Tallentavien toimintojen testaus vaatii erillisen testitietokannan tai
  -palvelimen.
- Kaksi Claude-ikkunaa voi ajaa selaintestejä samaan aikaan, kuten nyt
  kävi Dev Studio -ikkunan kanssa. Muistivahti suojaa omaa ajoa, mutta
  ikkunat eivät jonota keskenään.

## Seuraavaksi (V8 Sprint 5)

Trusted Development Operator: rajattu kehitystehtävä nykyisillä Dev
Studion työkaluilla, muutosluonnos, automaattiset testit, Git Guardian,
käyttäjän hyväksyntä, turvallinen kirjoitus ja palautus. Tämä on
ensimmäinen kirjoittava kyvykkyys, ja se riippuu palvelintason
valtuutuksesta (Security Sprint 0 ja Human Approval Gateway).
