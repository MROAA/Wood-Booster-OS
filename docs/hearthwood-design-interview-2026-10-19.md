# HEARTHWOOD — Kehityshaastattelun yhteenveto

**Dokumentin tyyppi:** Pelisuunnittelun linjaukset ja kehitysohjeet  
**Kohde:** Claude Code / Hearthwood-kehitysprojekti  
**Tila:** Jatkuvasti kehittyvä suunnitteludokumentti  
**Lähde:** Hearthwoodin kehityshaastattelu (Marc, ChatGPT, 2026-10-19)

> Huom. Claude Codelle: tämä on pelisuunnittelun linjaus, ei tilaus toteuttaa kaikkea. Tarkista nykyinen projekti, tunnista todelliset kehitystarpeet ja ehdota seuraavaa perusteltua kehitysaskelta ennen merkittäviä muutoksia. Studion tarkoitus ja rajaukset: `docs/hearthwood-dev-studio-prd.md`.

---

## 1. Pelin perusvisio

Hearthwood on strategisesti monipuolinen, vuoropohjainen taktinen roguelite-peli, jossa pelaaja rakentaa oman tiiminsä, kehittää buildeja ja kohtaa erilaisia vihollisia.

Pelin keskeiset vahvuudet ovat:

- Monipuolinen buildien rakentaminen.
- Lukuisat luokat, hahmot, taidot ja niiden yhdistelmät.
- Syvällinen taktinen taistelu.
- Älykäs ja monipuolinen vihollistekoäly.
- Kiinnostava seikkailu ja tarina.
- Visuaalisesti miellyttävä ja selkeä käyttöliittymä.
- Pelaajan vapaus löytää omia strategioitaan.

**Pelin tärkein tavoite on hauska, monipuolinen ja laadukas pelikokemus.**

Strateginen syvyys ei saa tehdä käyttöliittymästä monimutkaista.

Hearthwoodin kehitys on jatkuvaa. Suunnitteluratkaisuja ei pidä lukita ennen niiden testaamista.

## 2. Nykyisen projektin kunnioittaminen

Hearthwoodissa on jo paljon toteutettuja järjestelmiä, sisältöä ja toimintoja.

Claude Coden tulee:

1. Tutkia nykyinen koodikanta ennen muutoksia.
2. Selvittää olemassa olevat järjestelmät ja niiden riippuvuudet.
3. Hyödyntää nykyistä toteutusta aina kun mahdollista.
4. Välttää päällekkäisten järjestelmien rakentamista.
5. Säilyttää toimivat ominaisuudet.
6. Kehittää ominaisuuksia modulaarisesti.
7. Testata muutokset ja niiden vaikutukset muuhun peliin.

Älä oleta, että suunnitteludokumentissa kuvattu ominaisuus puuttuu pelistä.

**Tämä dokumentti kuvaa tavoiteltua pelikokemusta, ei vahvistettua teknistä toteutustilannetta.**

## 3. Buildien rakentaminen

Buildien monipuolisuus on yksi Hearthwoodin tärkeimmistä ominaisuuksista.

Pelaajalla tulee olla mahdollisuus yhdistellä:

- Luokkia ja yksiköitä.
- Taitoja ja kykyjä.
- Varusteita.
- Manaan liittyviä ominaisuuksia.
- Synergioita.
- Erilaisia taktisia pelityylejä.

Pelaajan tulee voida löytää itse voimakkaita ja luovia yhdistelmiä.

Peli ei saa jatkuvasti ohjata pelaajaa yhteen optimaaliseen ratkaisuun.

Myös erittäin voimakkaat buildit voivat olla hauskoja. Niitä ei pidä automaattisesti heikentää pelkkien laskennallisten arvojen perusteella.

Tasapainoa arvioidaan todellisen pelikokemuksen kautta.

## 4. Taktinen taistelujärjestelmä

Taistelun tärkein ominaisuus on mielekäs päätöksenteko.

Jokaisella vuorolla pelaajalla tulisi olla kiinnostavia vaihtoehtoja.

Keskeisiä taktisia elementtejä ovat:

- Hahmojen sijoittelu ruudukolla.
- Toimintopisteiden käyttö.
- Manaresurssien hallinta.
- Taitojen valinta ja ajoitus.
- Vihollisten toiminnan ennakointi.
- Taistelukentän ympäristötekijät.
- Mananodien hyödyntäminen.
- Riskien ja vaihtoehtoiskustannusten arviointi.

Pelaajan ei pitäisi aina pystyä tekemään kaikkea haluamaansa yhdellä vuorolla.

Strategia syntyy siitä, että pelaaja joutuu valitsemaan vaihtoehtojen välillä.

Taistelujärjestelmä on edelleen kehityksessä. Sen hauskuutta ja taktista syvyyttä tulee parantaa vaiheittain.

## 5. Manajärjestelmä

Hearthwoodin manajärjestelmä on keskeneräinen ja sitä kehitetään edelleen.

Tavoitteena on monipuolinen resurssijärjestelmä.

Alustavia suunnitteluperiaatteita:

- Mana on rajallinen resurssi.
- Mana voi palautua vuorojen aikana.
- Luokat voivat hyödyntää manaa eri tavoin.
- Taidot voivat vaikuttaa manan kulutukseen ja palautumiseen.
- Buildit voivat luoda manaan liittyviä synergioita.
- Taistelukentällä sijaitsevat mananodet lisäävät taktisia mahdollisuuksia.

Manan tarkkoja arvoja, sääntöjä tai palautumismekanismeja ei vielä lukita.

## 6. Mananodet

Mananodet ovat osa Hearthwoodin taistelukenttää.

Niiden tarkoituksena on lisätä strategista monipuolisuutta.

Mananodien hyödyntämiseen liittyy vaihtoehtoiskustannuksia:

- Sijoittelu.
- Toimintopisteet.
- Riskit.
- Ajoitus.
- Muut mahdolliset taktiset ratkaisut.

Sekä pelaaja että viholliset voivat hyödyntää mananodeja.

Vihollisten tulee arvioida niiden hyötyä tilanteen, luokan ja vaihtoehtoiskustannusten perusteella.

Mananodeista ei pidä tehdä jokaisen taistelun pakollista tavoitetta.

Niiden merkitys voi vaihdella taistelusta toiseen.

Erilaiset mananodityypit ja niiden tarkat vaikutukset ovat vielä suunnittelun ja kehityksen kohteena.

## 7. Vihollistekoäly

**Vihollistekoäly toimii Hearthwoodissa vastustajapelaajana.**

Tavoitteena ei ole pelkkä automaattinen hyökkäyslogiikka, vaan kiinnostava taktinen vastustaja.

Vihollisten tulee tuntua:

- Älykkäiltä.
- Luovilta.
- Monipuolisilta.
- Vaarallisilta.
- Reiluilta.
- Opittavilta.

Hearthwoodissa on paljon erilaisia vihollisia.

Niiden käyttäytymisen tulee heijastaa niiden ominaisuuksia, kykyjä ja taistelutyyliä.

Mahdollisia tekoälyn toimintaperiaatteita:

- Tilanteen arviointi.
- Sijoittelun hyödyntäminen.
- Taitojen ja manan taktinen käyttö.
- Yhteistyö muiden vihollisten kanssa.
- Pelaajan toimintaan reagoiminen.
- Mananodien hyödyntäminen.
- Erilaiset viholliskohtaiset toimintamallit.

Vihollisten suunnittelukyky voi vaihdella vihollistyypin mukaan.

Tätä ei kuitenkaan ole vielä vahvistettu lopulliseksi toteutusperiaatteeksi.

**Tekoälyn tarkempi käyttäytyminen kehitetään nykyisen toteutuksen ja pelitestien perusteella.**

Tekoälyn ei tule voittaa pelaajaa epäreilulla piilotiedolla.

## 8. Vihollisten aikomusten näyttäminen

Pelaajan tulee pystyä ennakoimaan vihollisten toimintaa riittävästi, jotta taistelut tuntuvat reiluilta.

Alustava suunta:

- Vihollisen aikomus voidaan näyttää pelaajalle.
- Kaikkia toiminnan yksityiskohtia ei välttämättä tarvitse paljastaa.
- Pelaaja oppii vihollisten käyttäytymistä pelaamalla.
- Uhkat tulee voida ymmärtää visuaalisesti.

Tämä järjestelmä on edelleen kehityksessä.

Nykyinen aikomusten näyttö tulee tutkia ennen muutosten suunnittelua.

## 9. Taistelukentän käyttöliittymä

Hearthwoodin pitää olla **selkeä ja helppo silmälle**.

Pelaajan tulee pystyä ymmärtämään peliä katsomalla.

Käyttöliittymän suunnitteluperiaatteet:

- Rauhallinen visuaalinen kokonaisuus.
- Selkeät hahmot ja kohteet.
- Tärkeät tiedot helposti nähtävissä.
- Tilanteeseen mukautuva tiedon esittäminen.
- Ei tarpeetonta kuvake- tai numerotulvaa.
- Visuaalinen oppiminen.
- Nopea ja miellyttävä käyttäminen.

Taktinen monimutkaisuus saa syntyä pelimekaniikoista, ei vaikeaselkoisesta käyttöliittymästä.

## 10. Taitojen visuaalinen esikatselu

Taitojen käytössä tavoitellaan selkeää visuaalista palautetta.

Alustavia ominaisuuksia:

- Taitojen vaikutusalueiden näyttäminen.
- Mahdollisten kohteiden korostaminen.
- Kevyt visuaalinen esikatselu.
- Tärkeimpien vaikutusten ymmärrettävä esittäminen.

Esikatselu ei saa peittää taistelukenttää tai hidastaa pelaamista tarpeettomasti.

Tämä ominaisuus on edelleen kehityksessä.

Nykyiset toteutukset tulee selvittää ennen uusien rakentamista.

## 11. Taisteluanimaatiot ja efektit

Hearthwoodin taisteluanimaatioiden tulee olla:

- Sulavia.
- Näyttäviä.
- Selkeitä.
- Riittävän nopeita.
- Visuaalisesti tunnistettavia.

Eri luokilla ja taitotyypeillä tulee olla omat visuaaliset identiteettinsä.

Tavalliset toiminnot voivat olla nopeita, kun taas merkittävät erikoistaidot voivat olla näyttävämpiä.

Tavoitteena on sopiva tasapaino.

**Ei liikaa, mutta ei liian vähän.**

Animaatiot eivät saa peittää tärkeitä taktisia tietoja tai tehdä pelistä raskasta.

Animaatioiden tarkka ajoitus ja voimakkuus määritellään myöhemmin pelitesteissä.

## 12. Äänimaailma

Hearthwoodin lopullinen äänimaailma viimeistellään kehityksen loppuvaiheessa.

Tavoitteena on:

- Tunnelmallinen musiikki.
- Laadukkaat taisteluäänet.
- Tunnistettavat loitsu- ja taitoäänet.
- Luokkien ja elementtien erilaiset äänelliset identiteetit.
- Hillitty mutta vaikuttava kokonaisuus.

Äänien tulee tukea taistelun selkeyttä ja tunnelmaa.

Niiden ei pidä muodostaa jatkuvaa äänikaaosta.

**Äänimaailman lopullinen hiominen ei ole nykyinen kehitysprioriteetti.**

## 13. Seikkailu ja tarina

Hearthwood yhdistää taktisen pelaamisen ja mielekkään tarinan.

Pelaajan tulee voida keskittyä buildien rakentamiseen ja taisteluihin ilman jatkuvia tarinakeskeytyksiä.

Tarinaa esitetään erityisesti selkeästi merkityissä tarinaluvuissa.

Pelin luoja kirjoittaa tarinan itse.

Tarina ja buildien rakentaminen ovat pääosin erillisiä kokonaisuuksia, jotka yhdessä muodostavat pelikokemuksen.

Tarinaa tulee voida hallita Dev Studiossa visuaalisesti ja helposti.

Kartta, aikajana ja valikkonäkymä voivat esittää samaa tarinarakennetta eri tavoilla.

## 14. Pelaajan oppiminen ja palaute

Hearthwoodin tulee opettaa pelaajaa ensisijaisesti pelaamisen kautta.

Pelaaja oppii:

- Luokkien ominaisuudet.
- Taitojen vaikutukset.
- Vihollisten käyttäytymisen.
- Taktisen sijoittelun.
- Buildien synergiat.
- Resurssien hallinnan.

Pelin ei tarvitse jatkuvasti kertoa pelaajalle parasta ratkaisua.

Tappiot voivat olla osa oppimista.

Taistelun jälkeen pelaajalle voidaan näyttää yksinkertainen yhteenveto:

- Voitto tai tappio.
- Taistelun kesto.
- Menetetyt yksiköt.
- Vahinko.
- Parantaminen.

Pelaaja saa itse tehdä johtopäätökset.

## 15. Kehityksen painopisteet

Hearthwoodia kehitetään kokonaisuutena, mutta vaiheittain.

Tärkeät osa-alueet:

1. Taktisen taistelun hauskuus ja toimivuus.
2. Buildien rakentamisen monipuolisuus.
3. Vihollisten strateginen haastavuus.
4. Seikkailun eteneminen ja palkitsevuus.
5. Käyttöliittymän selkeys ja visuaalinen laatu.
6. Animaatioiden ja efektien viimeistely.
7. Lopullinen äänimaailman hiominen.

Tämä järjestys on alustava työskentelyrunko, ei ehdoton toteutusjärjestys.

Pelin eri osa-alueita voidaan kehittää rinnakkain, kunhan muutokset eivät riko toimivia järjestelmiä.

## 16. Kehityksen arviointi

Hearthwoodin kehitystä tulee arvioida yhdistämällä:

- Nykyisen toteutuksen tutkiminen.
- Käytännön pelaaminen.
- Pelitestit.
- Tarvittaessa pelitapahtumien analysointi.
- Pelaajan kokonaiskokemuksen arviointi.

Pelin hauskuus ja strateginen monipuolisuus ovat tärkeämpiä kuin pelkkien mittareiden optimointi.

Älä tee automaattisia tasapainomuutoksia vain siksi, että jokin buildi näyttää laskennallisesti voimakkaalta.

## 17. Claude Coden toimintaohjeet

Kun kehität Hearthwoodia:

1. Tutki ensin nykyinen toteutus.
2. Selvitä, mikä toimii ja mikä on keskeneräistä.
3. Älä rakenna olemassa olevia ominaisuuksia uudelleen ilman perusteltua tarvetta.
4. Suosi pieniä, hallittuja ja modulaarisia muutoksia.
5. Säilytä olemassa oleva sisältö ja toiminnallisuus.
6. Arvioi muutosten vaikutus muihin järjestelmiin.
7. Testaa muutokset ennen niiden hyväksymistä valmiiksi.
8. Älä lukitse keskeneräisiä suunnitteluratkaisuja ennen pelitestausta.
9. Älä muuta pelin keskeistä identiteettiä omin päin.
10. Pyydä hyväksyntä merkittäville pelisuunnittelun muutoksille.

### Kehityksen periaate

**Hearthwoodista ei tehdä mahdollisimman monimutkaista peliä. Siitä tehdään strategisesti syvällinen, monipuolinen, visuaalisesti selkeä ja ennen kaikkea hauska peli.**

Pelaaja rakentaa omat strategiansa, oppii pelaamalla ja kohtaa älykkäitä vastustajia.

Kaiken kehityksen tulee tukea tätä tavoitetta.

---

**Dokumentin tila:** Kehityslinjaukset, ei lopullinen PRD tai tekninen spesifikaatio.

**Tärkeä huomautus Claude Codelle:** Tämä yhteenveto ei anna lupaa toteuttaa kaikkia kuvattuja ominaisuuksia automaattisesti. Tarkista nykyinen projekti, tunnista todelliset kehitystarpeet ja ehdota seuraavaa perusteltua kehitysaskelta ennen merkittäviä muutoksia.
