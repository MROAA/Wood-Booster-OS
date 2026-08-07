# Wood-Booster OS — Knowledge System

*Master Blueprint, Volume VIII.*

## Periaate: tieto on verkko, ei tiedostoja

Wood-Booster OS:n tieto ei elä irrallisina tiedostoina. Se muodostaa
yhteyksien verkoston: asiakas ↔ projekti ↔ materiaali ↔ kuva ↔ video
↔ työvaihe ↔ tarjous ↔ dokumentti ↔ Spacemonkey ↔ oppiminen. Yksi
haku löytää kaiken olennaisen ("Yksi haku", Constitution laki 13).

Tämä on jo osittain totta koodissa: tämän saman kehitysistunnon
aikana Projekti↔Asiakas↔Lasku/Tarjous, Materiaalit↔Varasto ja
Ostot↔Projekti yhdistettiin oikeilla tietokantaviittauksilla juuri
tämän periaatteen mukaisesti (ks. commit-historia "linking existing
structures").

## Kaksi eri "tietoa" — älä sekoita niitä

Projektin aikana tuli selväksi kahden käsitteellisesti eri asian
ero, joka kannattaa pitää erillään myös jatkossa:

1. **Liiketoimintadata** — projektit, asiakkaat, materiaalit,
   tarjoukset, laskut. Relaatiotietokanta (Prisma/SQLite), FK-
   yhteydet, ei epäselvyyttä omistajuudesta.
2. **Spacemonkeyn tietopankki** (`KnowledgeDocument`-malli,
   `/knowledge`-sivu) — AI:n oma, koko sovelluksen yhteinen
   tietolähde (kentät kuten `alwaysUse`, `confidence`, `priority`,
   `sourceType` paljastavat tämän: nämä ovat AI-kontekstin
   hallintakenttiä, eivät liiketoimintakenttiä).

Näitä ei pidä yhdistää keinotekoisesti — kun `ProjectKnowledge.jsx`
aiemmin antoi virheellisen vaikutelman että tietopankki olisi
projektikohtainen, se korjattiin selventämällä tekstiä, ei lisäämällä
tarpeetonta `projectId`-saraketta (ks. Roadmap-työn commit "fix
Knowledge tab's misleading per-project framing").

## Yrityksen digitaalinen muisti

Pitkän aikavälin tavoite: järjestelmä tuntee yrityksen historian.
Löytää aiemmat ratkaisut ("käytimme öljyvahaa vastaavassa pöydässä,
koska lakka ei toiminut"), tunnistaa kaavoja ("viimeiset viisi
tammiprojektia olivat 12% kannattavampia kuin arvioitu"), ja auttaa
uusien työntekijöiden perehdytyksessä vastaamalla kysymyksiin
yrityksen omista käytännöistä, ei geneerisestä internet-tiedosta.

Tämä on Spacemonkeyn "digitaalinen mestari" -kypsyysvaihe (ks.
[Spacemonkey Codex](05_SPACEMONKEY_CODEX.md)) käytännössä: 20 vuoden
päästä Spacemonkey tietää miten juuri tämä yritys rakentaa, mitä
materiaaleja se suosii, miten se ratkaisee ongelmia — ei kopioimalla
internetiä, vaan oppimalla käyttäjältä.

## Digitaalinen aikakapseli ja perintö

Marcin voimakkain esimerkki tästä periaatteesta: mestari-käsityöläisen
40 vuoden aikana kertyneet päätökset, tekniikat, materiaalivalinnat ja
projektikokemus säilyvät järjestelmässä hänen jäätyään eläkkeelle —
uusi työntekijä voi kysyä "miten täällä yleensä käsitellään massiivipuun
kausiliikkeitä ruokapöydissä?" ja saada vastauksen, joka perustuu
yrityksen omaan historiaan, ei yleisiin ohjeisiin. Tämä yhdistyy
[Founder's Charterin](03_FOUNDERS_CHARTER.md) Perintö-osioon.

## Tekninen toteutus tänään

- `KnowledgeDocument` + `KnowledgeChunk` (Prisma) — Spacemonkeyn oma
  tietopankki, ladataan `searchKnowledge()`:n kautta.
- Godfilet (`server/services/aiBrainV2/system/spacemonkey/godfiles/`)
  — identiteetti/persoona/arvot/viestintä, ladataan joka
  keskusteluun `loadGodFiles()`:lla.
- `Memory`/`MemoryProposal` (Prisma) — lyhyemmän aikavälin muisti,
  ehdotuksen kautta hyväksyttävä.

Näiden kolmen yhdistäminen yhdeksi "Knowledge Engineksi" (ks.
[Intelligence Architecture](06_INTELLIGENCE_ARCHITECTURE.md)) on
tuleva, ei vielä toteutunut arkkitehtuurinen askel.
