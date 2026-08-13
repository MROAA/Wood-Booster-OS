# Varmuuskopio- ja duplikaattikansioiden selvitys

*Kirjoitettu: 2026-08-04. Tämä on vain suositus — mihinkään alla
olevaan ei ole koskettu, eikä mitään poisteta ilman erillistä,
myöhempää vahvistusta Marcilta.*

## Selkokielinen yhteenveto

Kaikki neljä tutkittua kohdetta juontavat samaan juurisyyhyn: järjestelmässä
on automaattinen "System Pulse" -niminen varmuuskopiointi-/
tarkistuspiste-ominaisuus, joka teki useita peräkkäisiä tallennuksia
31.7.2026 illalla (klo 18:10–19:18 välillä, useita kertoja muutaman
minuutin välein). Tämä ominaisuus kirjoitti kopioita **neljään eri
paikkaan epäjohdonmukaisesti** — osa gitignoroituna, osa ei, osa repon
sisään, osa jopa yhden tason repon ulkopuolelle — mikä viittaa bugiin
itse varmuuskopiointiominaisuudessa, ei tarkoituksellisiin, erillisiin
varmuuskopioihin. Yksikään neljästä kohteesta ei liity mihinkään
myöhempään, oikeaan git-committiin — ne ovat kaikki peräisin samasta
n. tunnin mittaisesta automaattiajosta.

## Kohdetaulukko

| Kohde | Koko | Suositus | Peruste |
|---|---|---|---|
| `Wood-Booster-OS/Backups/` | 31 Gt, 13 kansiota | **Poista** | Kaikki peräisin samasta 31.7. iltapäivän automaattiajosta, ei liity mihinkään git-committiin (`git log` ei löydä committeja samalta ajalta). Uusimman kansion `server/`-sisältö (1460 tiedostoa) on selvästi suppeampi kuin nykyinen `server/` (8095 tiedostoa) — kansio on siis aidosti vanhentunut tila, ei sisällä mitään mitä nykyisestä puusta puuttuisi. Kokovaihtelu (83 Mt – 6,6 Gt saman ajon sisällä) viittaa rekursiiviseen kopiointibugiin (kansio on kopioinut itseään sisältäviä `RestorePreview`-kansioita), ei tarkoitukselliseen kasvuun. |
| `Wood-Booster-OS/Wood-Booster-OS/` (sisäkkäinen duplikaatti) | 37 Mt, 1731 git-seurattua tiedostoa | **Poista** (`git rm` + committi — tavallinen `mv` ei riitä, koska on jo git-seurattu) | Viimeinen committi tähän polkuun on nimeltään *"System Pulse automatic checkpoint"* (31.7.2026 18:05) — sama automaattimekanismi kuin `Backups/`. `package.json`:n nimi ja versio identtiset juuren kanssa, vahvistaen suoraa kopiota. Ei viittauksia mistään elävästä koodista. |
| `Wood-Booster-Restore-Backups/` (repon ulkopuolella) | 844 Mt, 2 kansiota | **Poista** | Sama nimeämiskaava (`before-restore-<aikaleima>`) ja sama sisältörakenne kuin `Backups/`-kansion snapshotit, aikaleimat samalta illalta (31.7.2026). Vaikuttaa siltä, että sama automaattiominaisuus on joskus kirjoittanut varmuuskopion vahingossa yhden kansiotason liian ylös — **eli repon ulkopuolelle asti**. Tämä on itsessään bugi, joka kannattaa mainita jos/kun "System Pulse" -ominaisuutta joskus korjataan. |
| `Wood-Booster-OS/RestorePreview/` | 247 Mt, 11 641 git-seurattua tiedostoa | **Poista** (`git rm` + committi) | Sisältää kaksi alikansiota, joiden aikaleimat (`T15-23-14-430Z`, `T15-58-52-579Z`) ja koot (83 Mt, 165 Mt) **täsmäävät tarkalleen** kahteen `Backups/`-kansion snapshottiin — sama data on siis tallessa kahteen kertaan. Toisin kuin aiemmin oletettiin, mikään palvelinkoodi ei viittaa tähän kansioon, ja ainoa siihen näennäisesti liittyvä frontend-komponentti (`RestorePreviewHistoryCard.jsx`) kutsuu API-reittiä, jota ei ole olemassa (ks. alla). `.gitignore`:ssa on rivi `Backups/` mutta ei `RestorePreview/` — tämä selittää miksi juuri tämä kansio päätyi vahingossa git-seurantaan toisin kuin `Backups/`. |

## Sivulöydös: rikkinäinen reitti (ei tämän muistion piiriin, mutta kannattaa korjata myöhemmin)

Frontend-komponentti `src/components/systemPulse/RestorePreviewHistoryCard.jsx`
kutsuu osoitetta `GET /api/system-pulse/restore-previews`. Tätä reittiä
**ei ole olemassa** — `server/routes/systemPulse.js` määrittelee vain
`GET /api/system-pulse` ja `POST /api/system-pulse/snapshot`. Tämä on
sama "Route not found" -tyyppinen bugi jota alkuperäinen PRD:n bugilista
kuvasi muiden välilehtien osalta (Dashboard, Projects, Varasto jne.) —
kannattaa korjata (tai poistaa käyttämätön komponentti) samassa
myöhemmässä vaiheessa kun muitakin rikkinäisiä reittejä korjataan.
Ei korjattu tässä, koska tämä siivousvaihe ei koskenut frontend-reittien
korjaamista.

## Suositeltu jatkotoimi

Kaikki neljä kohdetta ovat saman bugillisen automaattiominaisuuden
sivutuotteita, eivät tarkoituksellisia, säilytettäviä varmuuskopioita.
Suositus on poistaa kaikki neljä kokonaan (ei arkistoida — 32+ Gt on
tarpeettoman paljon levytilaa "arkistoitavaksi" datalle, jonka sisältö
on jo vanhentunutta ja päällekkäistä git-historian kanssa). Tämä on
kuitenkin **Marcin oma erillinen päätös** — tätä muistiota ei ole
tarkoitettu automaattiseksi poistoluvaksi. Kun Marc vahvistaa, toteutus
on:

```bash
rm -rf Wood-Booster-OS/Backups/
rm -rf Wood-Booster-Restore-Backups/    # repon ulkopuolella, ei git-komentoa tarvita
git rm -r Wood-Booster-OS/Wood-Booster-OS/   # git-seurattu, tarvitsee committin
git rm -r RestorePreview/                     # git-seurattu, tarvitsee committin
```

Lisäksi kannattaa harkita `RestorePreview/`-rivin lisäämistä
`.gitignore`-tiedostoon, jotta sama vahinko (git-seurannan
vahinkolaajentuminen) ei toistu, jos "System Pulse" -ominaisuus jatkaa
kirjoittamista sinne tulevaisuudessa.
