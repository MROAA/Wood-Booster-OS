# System Operator

Boosterverse-plugin Spacemonkeyn omalle työtilalle (Workspace Root) ja
koneen tilan lukemiselle. Toteutettu 2026-10-21 (Master PRD V8, Sprint 3).

## Tarkoitus

Spacemonkey voi tarkistaa koneen ja HQ:n palveluiden tilan ja tallentaa
tuloksen omaan työtilaansa. Se ei saa root-oikeuksia, se ei aja
keskustelun tekstistä muodostettuja komentoja, eikä se muuta projektia,
palveluita tai järjestelmää.

| Kyvykkyys | Taso | Mitä tekee |
|---|---|---|
| `system.status.check` | `workspace` | Lukee koneen tilan ja tallentaa raportin työtilan tehtäväkansioon |
| `spacemonkey.workspace.overview` | `observe` | Näyttää työtilan tehtävät ja käytetyn tilan |

## Vastuut

- `tools/systemObserverTool.js` (`system-observer`, vain luku) käyttää
  `os/systemObserver.js`-moduulia. Se lukee seuraavat tiedot:
  - muisti ja swap tiedostosta `/proc/meminfo`
  - kuorma
  - levytila (`statfs`)
  - sallitut palvelut (`systemctl show` kiinteillä argumenteilla:
    `wb-node`, `ollama`)
  - sallitut paikalliset terveysreitit (HQ-backend `/api/health`, Ollama
    `/api/version`, Vite)
  - git-tila
  - seurattujen prosessien nimet ja muistinkäyttö tiedostosta
    `/proc/<pid>/status`

  Prosessien komentorivejä ja ympäristömuuttujia ei koskaan lueta.
- `tools/workspaceTool.js` (`spacemonkey-workspace`) on ainoa reitti
  työtilaan (`workspace/SpacemonkeyWorkspace.js`).
- `skills/checkSystemStatusSkill.js`:
  1. avaa tehtävän
  2. lukee tilan
  3. tallentaa raportit `system-status.json` ja `system-status.md`
  4. sulkee tehtävän
- `skills/describeWorkspaceSkill.js` listaa tehtävät ja käytetyn tilan.

## Työtila

- **Sijainti:** `SPACEMONKEY_WORKSPACE_ROOT`, tai
  `$XDG_STATE_HOME/wood-booster-hq/spacemonkey`, tai
  `~/.local/state/wood-booster-hq/spacemonkey`. Työtila ei saa olla
  projektin sisällä.
- **Kansiot:** `tasks`, `drafts`, `browser`, `screenshots`, `traces`,
  `reports` ja `exports`. Oikeudet ovat 0700, tiedostojen 0600.
- **Polkusäännöt:**
  - Polku on aina suhteellinen.
  - `..`, absoluuttinen polku, NUL-merkki ja suojattu polku hylätään.
  - Symlinkki ei saa johtaa työtilan ulkopuolelle.
- **Kirjoitukset ja rajat:**
  - Kirjoitus on atominen eikä ylikirjoita ilman erillistä lupaa.
  - Tiedoston enimmäiskoko on 5 Mt ja koko työtilan 200 Mt.
- **Keskeytykset:** edellisellä ajolla kesken jääneet tehtävät merkitään
  tilaan `interrupted`. Niitä ei poisteta.

**Raja:** nämä ovat sovelluksen omia tarkistuksia. Koska kaikki prosessit
ajetaan samana käyttäjänä, ne eivät ole käyttöjärjestelmätason raja.
Erillinen käyttäjä tai kontti on turvallisuussuunnitelman seuraava
vaihe (Phase 2).

## Riippuvuudet

- Spacemonkey Runtime Bootstrap luo työtilan (`getSpacemonkeyWorkspace()`)
  ja rekisteröi pluginin.
- `capabilities/chatCapability.js` tarjoaa validoinnin.
- `security/accessLevels.js` (tasot) ja `security/protectedPaths.js`.
- System Pulsen `getRuntimePulse()` antaa perustiedot.

## Esimerkit

- "Tarkista koneen tila"
- "Onko Ollama käynnissä?"
- "Mitä työtilassasi on?"

## Testit

```
cd server
node --test services/spacemonkey/workspace/tests/ services/spacemonkey/os/tests/ \
  services/spacemonkey/plugins/SystemOperator/tests/
```

## Ei vielä

Palveluiden käynnistys ja pysäytys (taso `privileged-os`) vaativat
erillisen rajatun apupalvelun, käyttäjän valtuutuksen ja eristetyn
testipalvelun (Sprint 4 tai myöhemmin). Keskustelu torjuu nyt
käynnistys- ja pysäytyspyynnöt.
