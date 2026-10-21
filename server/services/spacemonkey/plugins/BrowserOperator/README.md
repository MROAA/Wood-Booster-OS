# Browser Operator

Boosterverse-plugin, joka ajaa Wood-Booster HQ:n käyttöliittymätestejä
eristetyssä Playwright-selaimessa. Toteutettu 2026-10-21 (Master PRD V8,
Sprint 4).

## Tarkoitus

Spacemonkey avaa HQ:n kehityskäyttöliittymän, ajaa ennalta määritellyn
testin, todentaa tuloksen ja tallentaa raportin ja kuvakaappaukset
omaan työtilaansa. Testi ei voi muuttaa HQ:n tietoja.

| Kyvykkyys | Taso | Mitä tekee |
|---|---|---|
| `browser.ui.check` | `workspace` | Terveystarkistus → selaintesti → raportti ja kuvakaappaukset työtilaan |

## Turvarajat (`browser/browserPolicy.js`, `browser/BrowserOperator.js`)

- **Eristys:** jokaiselle tehtävälle uusi selain ja BrowserContext, ei
  käyttäjän profiilia, ei kirjautumisia, ei latauksia eikä service
  workereita.
- **Sallitut osoitteet:** vain HQ:n paikalliset kehitysosoitteet:
  käyttöliittymä `:5173` ja API `:3001` osoitteissa `localhost`,
  `127.0.0.1` ja `[::1]`. Kaikki muu estetään ja kirjataan: muut portit
  (esim. Ollama, Portainer), sisäverkot, metadatarajapinnat, ulkoiset
  sivut ja tunnukset osoitteessa.
- **Sallitut pyynnöt:** vain lukevat pyynnöt (GET, HEAD, OPTIONS). Jos
  sivu yrittää tallentaa tai poistaa jotain, pyyntö estetään ja kirjataan.
- **Ei sivun sisäistä JavaScriptiä:** askeleet käyttävät otsikoita
  (saavutettava rooli ja nimi) ja linkkejä.
- **Osoitteita ei oteta keskustelusta.** Testit ovat ennalta määriteltyjä
  skenaarioita (`browser/scenarios.js`).
- **Kirjauksiin osoitteet tallennetaan ilman kyselyosaa**, koska siinä
  voi olla tunnisteita.
- **Muistivahti:** selainta ei käynnistetä, jos käytettävissä olevaa
  muistia on alle 2,5 Gt.
- **Aikarajat ja keskeytys:** 10 s / askel ja 60 s yhteensä,
  AbortSignal. Selain suljetaan aina, myös virhetilanteessa.

## Skenaariot

`projects-view`:
1. avaa `/projects`
2. otsikko "Projektit"
3. kuvakaappaus
4. vähintään yksi projektilinkki
5. klikkaa ensimmäistä
6. osoite `/projects/<id>`
7. sivulla näkyy saman projektin nimi otsikkona
8. kuvakaappaus

## Riippuvuudet

- Playwright (juuren `package.json`), ladataan vasta käytettäessä.
- System Operator -plugin: terveysreitit ja työtila.
- `capabilities/chatCapability.js` (validointi).

## Esimerkit

- "Testaa projektinäkymä"
- "Tarkista Wood-Booster HQ:n kehityspalvelimen tila ja testaa projektinäkymä"
  (operaattorin kierros: tila ja testi)
- "Avaa projektit selaimessa"

Pelkkä "avaa projektit" on edelleen HQ:n navigointikomento.

## Testit

```
cd server
node --test services/spacemonkey/browser/tests/ services/spacemonkey/plugins/BrowserOperator/tests/
# oikea Chromium HQ:n kehityskäyttöliittymää vastaan (vaatii käynnissä olevan UI:n ja vapaata muistia):
SPACEMONKEY_BROWSER_TESTS=1 node --test services/spacemonkey/browser/tests/realBrowser.e2e.test.js
```

## Ei vielä

- Lomakkeiden täyttö ja tallentavat painikkeet, kun HQ:ssa on
  testitietokanta tai erillinen testipalvelin.
- Playwright Trace epäonnistuneista testeistä, kunnes arkaluonteisten
  tietojen poisto on toteutettu.
- Hearthwood Dev Studion testit, jotka ovat erillisen projektin asia.
