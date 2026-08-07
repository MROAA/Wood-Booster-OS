# Wood-Booster OS — Design System

*Master Blueprint, Volume IX.*

## Ydinperiaate

Käyttöliittymä ei saa kilpailla käyttäjän huomiosta. Jokaisella
pikselillä on tarkoitus. Puuseppä on töissä viisi sekuntia sovelluksen
avaamisesta — ei inspiroivia lainauksia, säätiedotusta, uutisia,
koristeellisia kortteja tai kaaviopainotteisia dashboardeja.

Tämä on jo sovellettu käytäntöön: Dashboardilta poistettiin
tarpeeton tilastokortti-rivi ja "Huomioitavaa"-paneeli juuri tällä
periaatteella ("turhaa melua sivulle").

## Väripaletti

Marcin antama konkreettinen tavoitepaletti:

| Käyttö | Väri |
|---|---|
| Tausta | `#171717` |
| Paneelit | `#202020` |
| Teksti | `#F4F4F4` |
| Toissijainen teksti | `#B5B5B5` |
| Aksentti | "Wood Booster Green" (tarkkaa hex-arvoa ei vielä annettu) |

Ei neonvärejä, ei sateenkaarta, hyvin vähän erillisiä
nappi-/väriyhdistelmiä.

**Tunnettu ristiriita nykytilan kanssa**: `src/index.css`:n
nykyinen `--wood-*`-teema käyttää kulta/beige-sävyistä aksenttia
(`--wood-accent: #c9a66b`), ei vihreää. Tätä ei ole vielä
yhtenäistetty — kun teemapäivitys tehdään, tämä taulukko on
tavoitearvo, ei nykytila.

## Animaatiot

"Animaatioita ja hienoa, mutta erittäin hillitysti ja tehokkaasti —
en halua että sivu on hidas." Sovelletaan tarkoin, harkituissa
kohdissa (esim. lähetä-napin hover/press-tila, tilailmaisimen hienoinen
pulssi), ei koristeena joka elementissä. Nopeus voittaa aina
näyttävyyden (Constitution laki 10).

## "Yksi näkymä, yksi tehtävä" — tunnettu jännite

Marcin esimerkki vääräksi katsomastaan mallista: projektisivun pitkä
välilehtipalkki (Yleistä/Materiaalit/Kuvat/Tiedostot/Muistiinpanot/
Työvaiheet/Aikataulu/Tarjous/Hinnoittelu...). Oikea malli hänen
mukaansa: näytä tila, seuraava työvaihe, materiaalit,
työmuistiinpanot, valmis — loput piilossa kunnes tarvitaan.

**Tämä on suora ristiriita nykyisen `ProjectTabs.jsx`:n kanssa**,
jossa on tällä hetkellä yli kymmenen välilehteä (mukaan lukien tässä
istunnossa lisätty Laskutus-välilehti ja elvytetty Yleiskatsaus-
välilehti). Tätä ei ole ratkaistu — se vaatii oman, erillisen
suunnittelukierroksen ennen toteutusta, koska kyseessä on iso,
häiritsevä UX-muutos, ei pieni korjaus.

## Yksi universaalihaku

Yhden hakukentän pitäisi löytää projektit, asiakkaat, kuvat,
tarjoukset, laskut, keskustelut ja materiaalit kerralla — ei viittä
erillistä hakua. Ei vielä rakennettu missään sovelluksessa.

## Muotoilun periaatteet lyhyesti

Rauhallinen, moderni, vähäeleinen, helposti luettava, vähän värejä,
paljon tyhjää tilaa, erittäin nopea. Käyttöliittymän tulisi vanheta
hitaasti — tavoitteena ei ole seurata muotia vaan näyttää hyvältä
myös kymmenen vuoden kuluttua (Constitution laki 23).

## Lähteet

- Muistio: workshop-first-design-philosophy (täysi lähdemateriaali
  ei ole vielä siirretty tänne kokonaisuudessaan — tämä dokumentti on
  tiivistelmä, muistiossa on enemmän kontekstia).
- [`02_CONSTITUTION.md`](02_CONSTITUTION.md), lait 1, 3, 4, 10, 12, 23.
