# Spacemonkey Sprint 3: Workspace Root ja koneen tilan luku

- Päivä: 2026-10-21
- Haara: `feat/hq-spacemonkey-assistant`, pohjana stable `aae136a5`
- PRD: Master PRD V8, Sprint 3

## Valmis, kun

Spacemonkey käyttää omaa työtilaansa ja tarkistaa koneen tilan ilman
root-oikeuksia. Tämä toteutuu keskustelussa:

- **"Tarkista koneen tila"** avaa tehtävän työtilaan ja lukee koneen
  tilan tavallisena käyttäjänä. Raportti tallennetaan tehtävän kansioon
  ja näytetään vastauksessa.
- **"Mitä työtilassasi on?"** listaa työtilan tehtävät ja käytetyn tilan.

## Mitä Spacemonkeylla nyt on

| Oikeus | Taso | Raja |
|---|---|---|
| Koneen tilan luku | `observe` | muisti, kuorma ja levy; sallitut palvelut (`wb-node`, `ollama`) kiinteillä `systemctl show` -argumenteilla; sallitut paikalliset terveysreitit; git; seurattujen prosessien nimi ja muisti |
| Oma työtila | `workspace` | kirjoitus vain työtilaan: ei `..`, ei absoluuttisia polkuja, ei suojattuja polkuja, symlinkit eivät johda ulos; 5 Mt / tiedosto ja 200 Mt yhteensä; atominen kirjoitus ilman hiljaista ylikirjoitusta |

## Mitä Spacemonkeylla ei ole

- root, sudo, yleinen komentorivi tai keskustelun tekstistä muodostetut
  komennot
- palveluiden käynnistys tai pysäytys: keskustelu torjuu ne muutospyyntöinä
- prosessien komentorivit ja ympäristömuuttujat, joita ei koskaan lueta
- kirjoitus projektiin, tietokantaan tai palveluihin
- käyttöjärjestelmätason eristys: kaikki prosessit ajetaan samana
  käyttäjänä, joten työtilan rajat ovat sovelluksen tarkistuksia, eivät
  käyttöjärjestelmän

## Uudelleenkäyttö

- System Pulsen `getRuntimePulse()` (perustiedot). Sen `os.freemem()`
  aliarvioi Linuxissa käytettävissä olevan muistin, joten muisti luetaan
  `/proc/meminfo`:n `MemAvailable`-arvosta.
- Sprint 2:n `inventory/git.js` (git-tila).
- `security/protectedPaths.js` ja `security/accessLevels.js`.
- Sama kyvykkyysrekisteri, ToolBus, WorkflowEngine ja keskustelureitti.
- Kyvykkyyksien validointi on nyt jaettu: `capabilities/chatCapability.js`.

## Uutta

- `workspace/SpacemonkeyWorkspace.js` (Workspace Root, tehtäväkansiot,
  keskeytyneiden tehtävien merkitseminen)
- `os/systemObserver.js` (vain luku) ja `os/systemStatusText.js`
- Plugin `SystemOperator`: työkalut `system-observer` ja
  `spacemonkey-workspace`, kaksi skilliä, kaksi workflow'ta ja kaksi
  kyvykkyyttä
- Keskustelu: oikeustasot `observe` ja `workspace` sallitaan. `toolRun`
  kertoo, että vain Spacemonkeyn oma työtila muuttui
  (`projectDataChanged: false`).
- Atlas tuntee uudet järjestelmät.

## Testit

| Mitä | Tulos |
|---|---|
| Työtila: XDG-juuri, projektin sisäinen juuri hylätään, kansiot ja oikeudet 0700/0600, kirjoitus ja luku, traversointi, absoluuttinen ja suojattu polku, symlinkit ulos, koko- ja kokonaistilaraja, tehtävät ja siivous, keskeytynyt tehtävä | 10/10 |
| Koneen tilan luku: vain sallitut palvelut ja osoitteet kiinteillä argumenteilla, tuntematon palvelu hylätään ennen komentoa, ei komentorivejä tai ympäristömuuttujia, varoitukset mitatuista arvoista, yksittäisen lähteen virhe ei kaada tarkistusta, oikea kone ilman rootia | 8/8 |
| SystemOperator-plugin: raportti vain tehtäväkansioon | 3/3 |
| Kaikki uudet testit yhteensä (keskustelu, reitti ja aiemmat sprintit mukana) | 116/116 |
| Mutaatiotarkistus: operaattori 18/18, HQ 13/13, agentit 17/17, Atlas 12/12 | 60/60 kiinni |
| Regressio: pluginit 183/183, `check:spacemonkey` 216/216 | läpi |

Testit eivät luo käyttäjän oikeaa työtilaa. Ne käyttävät väliaikaisia
hakemistoja (`SPACEMONKEY_WORKSPACE_ROOT`).

## Riskit

- Työtilan rajat ovat sovelluksen tarkistuksia. Käyttöjärjestelmätason
  raja (oma käyttäjä tai kontti) on turvallisuussuunnitelman Phase 2:ssa.
- Palvelintason valtuutus on vielä mergeämättä. Siksi keskustelun
  työkalut rajataan tasoille `observe` ja `workspace`.

## Seuraavaksi (V8 Sprint 4)

Playwright-pohjainen Browser Operator ja operaattorisilmukka:
Spacemonkey avaa HQ:n kehitysnäkymän, ajaa oikean käyttöliittymätestin,
tallentaa kuvakaappauksen ja raportin työtilaan, ja palauttaa
luotettavan raportin.
