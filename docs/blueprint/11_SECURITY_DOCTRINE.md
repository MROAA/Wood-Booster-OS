# Wood-Booster OS — Security Doctrine

*Master Blueprint, Volume XI.*

Tämä volyymi on tarkoituksella suppein Blueprintin osista. Se
dokumentoi mitä on jo päätetty ja mitä on todellisuudessa tänään —
ei keksi turvallisuuspolitiikkaa jota Marc ei ole pyytänyt. Osa
tästä vaatii vielä hänen oman päätöksensä ennen kuin sitä voi laajentaa.

## Nykytila (todennettu koodista)

Wood-Booster OS on tänään **yhden käyttäjän, paikallisesti ajettava
sovellus**, ei monen käyttäjän julkiseen verkkoon avoin palvelu:

- Ei kirjautumisjärjestelmää (ei passport/jwt/bcrypt-riippuvuuksia,
  ei middleware-kansiota, ei `requireAuth`-tyyppistä suojausta
  missään reitissä).
- CORS on avoinna kaikille alkuperille (`cors()` ilman
  rajoituksia) — turvallista vain koska palvelin ei ole julkisessa
  verkossa.
- Ei rate limitingiä eikä `helmet`-tyyppistä HTTP-otsikkokovennusta.

Tämä ei ole vahinko — se on looginen seuraus siitä että sovellus on
suunniteltu paikalliseksi työkaluksi ("Offline on oletus",
Constitution laki 7) eikä vielä monen käyttäjän tai etäkäytön
palveluksi. **Tämä pitää päivittää heti kun** sovellus altistuu
julkiselle verkolle, useammalle käyttäjälle, tai pakataan
asennettavaksi sovellukseksi jonka joku muu kuin Marc voi asentaa
([product-vision-and-user]-muistio: Tauri/Electron-paketointi on
tuleva, ei nykyinen tavoite).

## Jo päätetyt periaatteet (Constitution + godfilet)

- **Turvallisuus oletuksena** — käyttäjän tiedot ovat oletusarvoisesti
  yksityisiä (Constitution laki 21).
- **Omistajuus** — yrityksen tieto kuuluu yritykselle; vienti ja
  varmuuskopiointi ovat aina mahdollisia (laki 22).
- **AI ei suorita vaarallisia toimintoja ilman vahvistusta** — sekä
  Constitutionissa että Spacemonkeyn omissa säännöissä
  (`spacemonkeyPersona.js`).
- **Spacemonkey ei koskaan paljasta salasanoja tai API-avaimia
  chatissa.** Tämä on olemassa oleva koodisääntö
  (`contextBuilder.js`), joka koskee sekä oikeita salaisuuksia että
  projektin omaa PERSBABA/CROCODILE DUNDEE/H3V0S3NP1LLU-tarinaa (ks.
  Spacemonkey Codex — nämä ovat leikkimielinen lore-mekanismi, eivät
  todellinen tietoturvakerros: "pelkät salaiset sanat eivät tarjoa
  turvallisuutta", Marcin oma sanoin).

## Avoimet kysymykset (vaativat Marcin päätöksen)

Näitä ei ratkaista tässä dokumentissa yksipuolisesti:

1. Kun sovellus joskus paketoidaan asennettavaksi (Tauri/Electron) tai
   avataan etäkäyttöön — tuleeko kirjautuminen, ja jos, minkälainen
   (yhden käyttäjän PIN/salasana riittää luultavasti, ei täyttä
   monikäyttäjätunnistusta)?
2. Miten varmuuskopiointi ja tiedon vienti toteutetaan käytännössä
   (laki 22 vaatii tämän olevan mahdollista — mekanismia ei ole vielä
   suunniteltu)?
3. Jos/kun järjestelmä joskus tukee useampaa käyttäjää samassa
   yrityksessä, tarvitaanko roolipohjaisia oikeuksia (esim. kuka saa
   nähdä hinnat, kuka saa poistaa projekteja)?

## Miten tätä sovelletaan tänään

Kehitystyössä: älä lisää oletuksena julkisesti avoimia päätepisteitä
jotka paljastavat liiketoimintadataa ilman, että se on jo linjassa
sen kanssa että koko sovellus on avoin paikallisessa käytössä. Älä
rakenna kirjautumisjärjestelmää ennalta ilman pyyntöä — se olisi
ratkaisu ongelmaan jota ei vielä ole (Constitution laki 2: "Työ ennen
ominaisuuksia").
