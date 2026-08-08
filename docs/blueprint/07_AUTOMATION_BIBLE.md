# Wood-Booster HQ — Automation Bible

*Master Blueprint, Volume VII.*

Kaikki toistuva työ pyritään automatisoimaan turvallisesti. Tämä
dokumentti kokoaa Marcin antamat konkreettiset esimerkit yhdeksi
listaksi ja periaatteeksi, jota vasten uusia automaatioita
arvioidaan.

## Miten automaatio syntyy — ei arvauksesta

Ks. [Human Model](04_HUMAN_MODEL.md): automaatio ei synny siitä että
joku päättää rakentaa sen, vaan siitä että järjestelmä havaitsee
saman toiminnon toistuvan riittävän monta kertaa, ehdottaa
automaatiota, käyttäjä hyväksyy, ja järjestelmä oppii. Ihminen
päättää aina — Spacemonkey ei koskaan automatisoi ilman lupaa, ellei
automaatiota ole erikseen etukäteen hyväksytty ("AI ehdottaa, ihminen
päättää", Constitution laki 8).

## Hyötyverkko — yksi tapahtuma, monta hyötyä

Ydin-suunnitteluperiaate (ks. Human Model): sen sijaan että käyttäjä
syöttäisi saman tiedon moneen paikkaan, yksi tapahtuma laukaisee
turvallisesti useita jatkotoimia:

Kuva lisätään projektiin → projekti päivittyy → työvaihe päivittyy →
asiakas saa ilmoituksen → some-luonnos syntyy → portfolio päivittyy →
Spacemonkey oppii.

## Konkreettiset automaatioesimerkit (Marcin antamat)

Ryhmitelty sen mukaan mitä ne automatisoivat:

**Projektin elinkaari**
- Projektin luonti, kansiorakenteet, tiedostojen järjestely.
- "Valmis"-painike: kun projekti merkitään valmiiksi, järjestelmä
  hoitaa yhdellä painalluksella arkistoinnin, kuvien/videoiden
  koonnin, some-julkaisun luonnoksen, verkkosivupäivityksen,
  asiakasviestin, raportin ja materiaalipäivityksen.

**Talous**
- Tarjouspohjat ja -luonnokset (jo osittain toteutettu:
  "Tuo materiaaleista" -toiminto tarjoukselle).
- Älykäs hinnoittelu: ehdotus aiempien projektien, materiaalien,
  työajan ja katteen perusteella.
- Älykäs ostoslista: ei "osta tammea" vaan "tarvitset ensi viikolla
  24m tammea, 3l öljyä, 2kg liimaa" — laskettuna avoimista
  projekteista.

**Media ja markkinointi**
- Kuvien lajittelu ja nimeäminen (tunnistaa projektin, työvaiheen,
  materiaalin kuvasta).
- Valmiista projektista automaattisesti: some-julkaisu, tuotekuvaus,
  blogiteksti, verkkosivusisältö.

**Dokumentointi**
- Automaattinen yrityspäiväkirja: järjestelmä kirjaa mitä tapahtui
  (esim. "9:43 Aurora-pöydän runko valmis, 10:17 18 kuvaa lisättiin")
  ilman että käyttäjän tarvitsee kirjoittaa raportteja itse.
- Kokous- ja puhelumuistiot.

**Havainnointi (ei automaatio vaan sen edellytys)**
- Järjestelmä huomaa: lähettämätön tarjous, projekti joka on ollut
  paikallaan yli 10 päivää, puuttuva pintakäsittelyvaihe, materiaali
  joka on loppumassa kahden projektin verran.

## Mitattavuus

Jokainen automaatio on mitattavissa: kuinka usein sitä käytetään,
paljonko aikaa se säästää, kuinka usein käyttäjä hyväksyy AI:n
ehdotuksen. Tämä liittyy suoraan [Human Modelin](04_HUMAN_MODEL.md)
Utility Engine -periaatteeseen ja Marcin ehdottamaan "Hyötyindeksi"-
mittariin (ks. muistio: aikaa säästetty kuukaudessa, automatisoituja
tehtäviä, vältettyjä virheitä). Automaatiot joita ei käytetä tai
hyväksytä, yksinkertaistetaan tai poistetaan taustalta — sama
periaate jota juuri sovellettiin Dashboardiin ("turhaa melua
sivulle").

## Ei kuulu tähän (vielä)

Tarkka tekninen toteutus (mikä moduuli havaitsee toistuvuuden, missä
kynnysarvot asetetaan) ei ole vielä määritelty — se kuuluu
[Developer Handbookiin](10_DEVELOPER_HANDBOOK.md) kun se
kirjoitetaan.
