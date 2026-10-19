# HEARTHWOOD DEV STUDIO — MASTER PRD v2.1 (Hearthwood Exclusive)

**Projekti:** Hearthwood · **Kehitysympäristö:** Hearthwood Dev Studio (`src/pages/HearthwoodStudio.jsx`, "Hearthwood HQ") · **Pääkehittäjä:** Claude Code · **AI-avustaja:** Spacemonkey · **Käyttötarkoitus:** ainoastaan Hearthwood-pelin kehittäminen.
(Marc, 2026-10-19. Korvaa aiemmat yleiskäyttöistä Game Dev Studio -alustaa koskevat tavoitteet. Pelin sisältöä koskevat vaatimukset: `docs/hearthwood-master-prd.md`. Pelisuunnittelun linjaukset: `docs/hearthwood-design-interview-2026-10-19.md`. Aiempi v1.0 on liitteenä A.)

## 0. Dev Studion tarkoitus (Marcin omin sanoin)

> Dev Studiolla pystyn luomaan, muokkaamaan ja tekemään pelin sisältöä itse mieluisekseni. Dev Studio on selkeä ja helppokäyttöinen, ja se toimii tekoälyavusteisesti. Jos jotain, mitä haluan lisätä, ei pysty tekemään, rajat kerrotaan minulle heti. Dev Studiosta tulee pelin moottori, joka hyödyntää jo olemassa olevia teemoja, tyylejä ja muuta peliin liittyvää, ja toimii näin päämajana kehitykselle. Dev Studio määrittää pelin tyylin ja siihen liittyvän sisällön, ja tätä kautta pystyn kehittämään peliä itse. Dev Studio on kehittyvä pala peliä, jolla mahdollistan oman vaikuttamiseni pelin sisältöön.

Lyhyesti: **Kuvaile idea → tarkista suunnitelma → esikatsele → testaa → hyväksy.** Marc päättää, Claude Code toteuttaa, Spacemonkey avustaa, Studio näyttää ja suojaa.

## 1. Päätavoite

Hearthwood Dev Studio on Hearthwood-pelin oma kokonaisvaltainen kehitysympäristö. Sen tarkoituksena on mahdollistaa Hearthwoodin kaikkien pelimekaniikkojen, sisältöjen, järjestelmien, käyttöliittymien ja kehitystoimintojen hallinta yhdestä paikasta. Studio ei ole itsenäinen yleiskäyttöinen pelinkehitystuote. **Kaikki kehitys tehdään Hearthwoodin tarpeiden perusteella.**

## 2. Nykyinen lähtötilanne

Hearthwood on aktiivisesti kehitettävä peli, jossa on jo pitkälle kehitetty Dev Tool (kartoitus 2026-10-19: 70 sisältölistaa, 1 363 sisältökohdetta, noin 9 000 muokattavaa kenttää, ks. Tila-osio lopussa). **Nykyinen Dev Tool on kehityksen perusta, ei korvattava prototyyppi.**

## 3. Kehityksen tärkeimmät säännöt

1. Älä rakenna nykyisiä ominaisuuksia uudelleen ilman perusteltua syytä.
2. Älä poista toimivia ominaisuuksia.
3. Älä luo päällekkäisiä editoreita tai tietomalleja.
4. Älä muuta pelin toimintalogiikkaa pelkän käyttöliittymäuudistuksen vuoksi.
5. Käytä nykyistä Hearthwood-arkkitehtuuria aina, kun se on tarkoituksenmukaista.
6. Tee muutokset modulaarisesti.
7. Testaa muutokset ennen niiden käyttöönottoa.
8. Säilytä yhteensopivuus nykyisten pelitallennusten kanssa.
9. Esitä pysyvät muutokset käyttäjän hyväksyttäväksi.
10. Keskity vain Hearthwoodin kehittämiseen.

## 4. Studion keskeiset vastuualueet

- **4.1 Game Systems:** vuoropohjainen taktinen taistelu, ruudukkokentät ja maasto, hahmot, luokat ja taidot, mana ja muut resurssit, heimot, elementit ja synergiat, viholliset ja pomot, taktinen tekoäly, varusteet, reliikit ja valmistus, pelitalous, roguelite-kartta, biomit, NPC:t ja hahmosuhteet, tarina ja tapahtumat, tehtävät ja saavutukset, pysyvä ja pelikertakohtainen eteneminen. Olemassaolo ja toteutusaste tarkistetaan projektista.
- **4.2 Content Management:** keskitetty haku, loogiset kategoriat, suodattimet, riippuvuudet, esikatselu, vertailu, validointi, turvallinen tallennus, versiohistoria. Uudet työkalut integroidaan ensisijaisesti nykyisiin editoreihin.
- **4.3 Game Testing:** taistelusimulaatiot, luokka- ja synergiatestit, tekoälyn ja pomojen testit, talous- ja tapahtumaketjujen validointi, tallennus-, UI- ja regressiotestit. Hyödynnetään nykyisiä järjestelmiä.
- **4.4 Visual Development:** käyttöliittymät, taistelunäkymät, animaatioiden esikatselu, grafiikkaresurssit, efektit, teemat ja tyylit, näyttökoot. Olemassa olevat komponentit kartoitetaan ensin.
- **4.5 AI Development:** Claude Code on ensisijainen koodin toteuttaja. Spacemonkey analysoi, ehdottaa, tutkii tasapainoa, dokumentoi ja tulkitsee testejä, mutta ei tee hyväksymättömiä pysyviä muutoksia.
- **4.6 Project Management:** tilannekuva, kehitystehtävät, moduulien tila, virheraportit, testitulokset, riippuvuudet, muutosehdotukset, historia, versionhallinta, hyväksyntäprosessi.

## 5. Käyttöliittymän tavoite

Selkeä, tehokas ja helppokäyttöinen. Yli tuhannen muokattavan asian vuoksi tärkeintä on, että haluttu asia löytyy nopeasti: yhtenäinen navigointi, selkeä kategorisointi, nopea haku, hyvä luettavuus, kontekstisidonnaiset asetukset, vähemmän turhia valikoita, muutosten näkyvyys ja helppo palauttaminen. Kaikkia asetuksia ei näytetä yhtä aikaa. Laajasta järjestelmästä tehdään helposti hallittava. Tekniset asetukset ovat oletuksena piilossa ("All fields (advanced)").

## 6. Turvallinen kehitystyönkulku

1. Valitaan muokattava ominaisuus.
2. Tarkistetaan sen nykyinen toteutus.
3. Laaditaan muutosehdotus.
4. Tarkistetaan riippuvuudet.
5. Valmistellaan muutos eristetyssä työtilassa.
6. Suoritetaan tarvittavat testit.
7. Näytetään muutosten vaikutukset.
8. Käyttäjä hyväksyy tai hylkää.
9. Hyväksytty muutos tallennetaan projektiin.
10. Muutos dokumentoidaan.

**Rajat kerrotaan heti:** jos pyyntö vaatii uutta pelikoodia, Studio sanoo sen selvästi, kertoo mitä puuttuu ja kirjaa pyynnön kehitystehtäväksi. Se ei teeskentele, että ominaisuus on jo olemassa, eikä AI väitä tehneensä tai testanneensa mitään, mitä ei oikeasti tehty.

## 7. Taitojen ja ominaisuuksien luonti (PRD 2.0 §12, Dev Studion tärkein toiminnallisuus)

**7.1 Taitojen työpaja.** Jokaisella sankarilla ja yksiköllä on Taidot ja ominaisuudet -näkymä, jossa taidon voi lisätä, kopioida, muokata tai poistaa. Kentät:
- nimi, kuvaus, ikoni, harvinaisuus;
- tyyppi (aktiivinen, passiivinen, perushyökkäys, ultimate, reaktio);
- kohde (oma, liittolainen, vihollinen, alue, ympäristöobjekti);
- vaikutus (vahinko, parannus, kilpi, kutsu, hallinta, liike, ympäristön muutos);
- mana tai energia, jäähdytys, kesto;
- tasot, parannukset, skaalaus;
- elementit, synergiat, aktivointiehdot;
- animaatio, ääni, visuaalinen palaute.

Vaikutukset valitaan valmiista valikoista. Jos haluttua ei ole, Spacemonkey / Claude Code rakentaa sen uutena ominaisuutena.

**7.2 Vaikeustasot:**

| Taso | Esimerkki | Toteutus |
|---|---|---|
| Helppo | +10 % hyökkäysnopeutta | arvo |
| Keskitaso | parannus aina kun vihollinen kuolee | tapahtuma + kohde + vaikutus |
| Edistynyt | jäätaika jäädyttää veden, jää särkyy | uusi mekaniikka + testit |
| Uusi järjestelmä | uusi luokka omalla manasyklillä | järjestelmä taustalla + yhteensopivuustestit |

**7.3 Yksiköt.** Samoilla työkaluilla hallitaan viholliset, kutsutut olennot ja pomot: terveys, hyökkäys, puolustus, nopeus, resurssit, vastustuskyvyt, tekoäly ja taitojen järjestys.

**7.4 Tasapainotus.** Ennen käyttöönottoa näytetään:
- arvioitu vahinko tai parannus;
- manan kulutus ja käyttötiheys;
- kesto ja kohteiden määrä;
- synergiat ja vertailu vastaaviin;
- testitulokset.

Arviot perustuvat pelin todellisiin sääntöihin ja testeihin, ei pelkkään AI:n mielipiteeseen. Haastattelun linjaus: erittäin voimakkaita buildeja ei heikennetä automaattisesti pelkkien laskelmien perusteella.

## 8. Rajaukset

Hearthwood Dev Studio EI ole yleiskäyttöinen pelimoottori, muiden pelien kehitysympäristö, kaupallinen pelieditorituote, Unityn/Godotin/Unrealin kilpailija eikä Hearthwoodista erillinen ohjelmistokehitysalusta. Se on Hearthwoodin oma kehitystyökalu.

## 9. Lopullinen tavoite

Hearthwood Dev Studio mahdollistaa Hearthwoodin kokonaisvaltaisen kehittämisen yhdestä ympäristöstä. Käyttäjä hallitsee sisältöä, mekaniikkoja, tasapainoa, tarinaa, visuaalisuutta, testejä ja kehitystehtäviä ilman tarpeetonta käsin tehtävää koodimuokkausta. Lopullinen hyväksymiskriteeri (PRD 2.0 §13): Marc pystyy itse luomaan uuden sankarin, antamaan sille useita taitoja, määrittelemään täysin uuden kyvyn luonnollisella kielellä, testaamaan sen ja ottamaan sen käyttöön pelissä kirjoittamatta koodia.

**Pääperiaate: kehitä nykyisestä Hearthwood Dev Toolista mahdollisimman kattava, tehokas ja helppokäyttöinen Hearthwoodin oma Game Dev Studio.**

---

# Liite A: Dev Studio PRD v1.0 (2026-10-19, ensimmäinen versio)

### 1. Tuotevisio

Hearthwood Dev Studio on Hearthwood-pelin oma visuaalinen kehitystyökalu, jossa voit luoda, muokata, testata ja hallita pelin sisältöä ilman, että sinun tarvitsee osata koodata.

Työkalun pitää tuntua selkeältä luovalta studiota muistuttavalta työpöydältä, ei ohjelmointiympäristöltä. Käyttäjä voi esimerkiksi luoda uuden sankarin, lisätä sille taitoja, suunnitella hirviön, rakentaa uuden metsäbiomin, lisätä objekteja taistelukentälle tai muuttaa Seed Systemin reseptejä tavallisia lomakkeita, valikoita ja visuaalisia työkaluja käyttämällä.

**Päätavoite:** sinä päätät, millainen Hearthwoodista tulee. Dev Studio hoitaa sisällön teknisen tallentamisen, tarkistamisen ja viemisen peliin.

#### Suunnittelun perusperiaatteet

- **Ei koodipakkoa:** tavalliset sisällönluontitehtävät onnistuvat visuaalisesti.
- **Yksi selkeä asia kerrallaan:** käyttöliittymä ei hukuta käyttäjää kymmeniin asetuksiin.
- **Näe, mitä teet:** muutokset näkyvät esikatselussa aina, kun se on mahdollista.
- **Turvallinen kokeilu:** voit testata muutoksia rikkomatta alkuperäistä sisältöä.
- **AI-apuri:** Spacemonkey auttaa suunnittelemaan sisältöä, täyttämään asetuksia ja selittämään vaihtoehtoja ymmärrettävästi.
- **Oikea peliprojekti:** kaikki hyväksytyt muutokset tallennetaan Hearthwoodin todelliseen sisältöjärjestelmään, eivät vain Dev Studion esikatseluun.

### 2. Käyttöliittymän rakenne

Dev Studio avautuu Hearthwoodin omaan kehitysnäkymään. Käyttäjän ei tarvitse navigoida kooditiedostoissa tai tuntea pelin kansiorakennetta.

Pääosiot:

| Osio | Sisältö |
|---|---|
| Sankarit | Tommy, Aatos, Repo ja uudet hahmot. |
| Skillit ja spellit | Vahingot, mana, efektit ja yhdistelmät. |
| Maailmat ja biomit | Metsät, maastot, kentät ja objektit. |
| Seed Studio | Siemenet, reseptit ja ympäristösynergiat. |
| Lore ja tehtävät | Tarina, dialogit, tapahtumat ja palkinnot. |
| Asset-kirjasto | Kuvat, animaatiot, ikonit ja äänet. |
| Taistelutestaus | Testaa muutokset oikeassa pelissä. |
| Spacemonkey | Luo sisältöä ja selittää asetukset. |

Lisäksi: **Julkaise muutokset peliin**. Tarkista muutokset, suorita testit ja hyväksy julkaisu.

### 3. Sisällönluontityökalut

Jokaisessa osiossa käytetään samaa helppoa toimintamallia:

1. Valitse sisältö tai paina Luo uusi.
2. Täytä selkeät kentät tai pyydä Spacemonkeyta tekemään ensimmäinen versio.
3. Tarkastele esikatselua.
4. Tallenna luonnos.
5. Testaa pelissä ja julkaise hyväksytty sisältö.

#### 3.1 Sankarieditori

Sankarieditorilla voi luoda uusia pelattavia sankareita ja muokata olemassa olevia.

- Nimi, taustatarina, luokka ja rooli.
- Muotokuva, pelihahmon kuva ja harvinaisuus.
- Terveys, hyökkäys, puolustus ja mana.
- Aktiiviset taidot, passiiviset kyvyt ja ultimate.
- Elementit ja synergiat.
- Äänet, animaatiot ja taistelureaktiot.

Esikatselussa sankarin muotokuva, taidot ja perustiedot näkyvät rinnakkain. Puuttuvat kuvat tai virheelliset asetukset ilmoitetaan ymmärrettävästi.

#### 3.2 Skill- ja spell-editori

Taitoja luodaan valmiista pohjista ilman koodin kirjoittamista. Esimerkkilomake:

- **Taidon nimi**
- **Taidon tyyppi:** Aktiivinen taito / Passiivinen kyky / Ultimate / Ympäristöloitsu
- **Elementti:** Luonto / Tuli / Jää / Myrkky / Arkaaninen
- **Manakustannus** (esim. 35)
- **Vaikutuksen voimakkuus** (esim. 60)
- **Vaikutus:** Vahingoita kohdetta / Paranna liittolaista / Kasvata juuria pelikentälle / Vahingoita ympäristöobjektia / Luo suojakilpi
- **Yhteenveto**, esim. "Metsän purkaus · Aktiivinen taito · Luonto · Mana: 35 · Voimakkuus: 60 · Vaikutus: Juurten kasvatus"
- Painike: "Pyydä Spacemonkeyta määrittelemään tämä taito"

#### 3.3 Ympäristö- ja Seed-editori

Tällä työkalulla voit luoda objekteja ja yhdistää niitä Seed Systemiin.

- Lisää puu, sieni, kristalli, kivi, vesialue tai muinainen rakenne.
- Valitse, onko objekti tuhoutuva, kerättävä, kasvatettava vai aktivoitava.
- Määritä, mihin elementteihin objekti reagoi.
- Luo siemen, joka tuottaa objektin.
- Luo resepti kahden siemenen yhdistämiseen.
- Aseta objektin harvinaisuus, kustannukset ja vaikutukset.
- Esikatsele objektia ja testaa sen reaktiot.

Objekteille tehdään valmiit mallipohjat, joten uuden sienityypin luominen ei vaadi teknisen järjestelmän suunnittelua uudelleen.

#### 3.4 Maastostudio

Maastostudio tarjoaa visuaalisen kenttäeditorin:

- Vedä objekteja kirjastosta kentälle.
- Siirrä, kopioi, kierrä ja poista objekteja.
- Muokkaa maaston pintaa ja koristeita.
- Lisää syntypisteitä sankareille ja vihollisille.
- Aseta siemenobjekteja ja testaa niiden kasvua.
- Käynnistä loitsuja ja tarkastele ympäristön reaktioita.
- Tarkastele kenttää pelin todellisessa mittakaavassa.

Maastostudio erottaa visuaaliset koristeet pelimekaanisesti vaikuttavista objekteista. Näin koristepuu ei vahingossa estä liikkumista tai vaikuta taistelun laskentaan.

### 4. Spacemonkey — AI-kehitysapuri

Spacemonkey on Dev Studion keskeinen käyttöliittymä koodaamattomalle kehittämiselle. Esimerkkipyyntöjä:

- "Luo uusi harvinainen metsähenki, joka parantaa liittolaisia."
- "Tee tästä taidosta heikompi mutta nopeampi."
- "Luo kolme myrkkysientä eri harvinaisuustasoilla."
- "Tee uusi Frostroot-biomi ja lisää sinne jääkristalleja."
- "Selitä, mitä tämä asetus tekee."
- "Testaa, onko tämä taito liian voimakas."

Spacemonkey muuntaa pyynnön rakenteiseksi sisältöluonnokseksi. Se näyttää ehdotetut muutokset ennen hyväksymistä ja kertoo, jos tarvitaan uusia pelimekaniikkoja, grafiikkaa tai ohjelmointityötä.

**Tärkeä raja:** AI ei saa ilmoittaa muutosta tehdyksi ennen kuin se on todella tallennettu ja validoitu. Jos sisältö tarvitsee uuden koodiominaisuuden, Spacemonkey kertoo sen ja tarjoaa toteutussuunnitelman.

### 5. Asset-kirjasto ja visuaalinen sisällöntuotanto

Kaikki pelin visuaaliset resurssit hallitaan yhdessä paikassa:

- Sankarimuotokuvat ja hahmografiikat.
- Objektit, puut, kasvit, sienet ja kristallit.
- Skill-ikonit ja efektit.
- Animaatiot ja äänet.
- Biomekohtaiset taustat ja maastotekstuurit.

Jokaisella resurssilla on esikatselu, nimi, tyyppi, käyttökohteet ja tila. Uusi kuva voidaan yhdistää sankariin tai objektiin valitsemalla se kirjastosta. Puuttuvista tai yhteensopimattomista tiedostoista ilmoitetaan ennen julkaisua.

### 6. Lore, dialogit ja tehtävät

Tarinatyökalun avulla voit muokata Hearthwoodin maailmaa ilman, että dialogit ovat koodissa.

- Luo hahmojen taustatarinoita ja suhteita.
- Muokkaa dialogeja ja keskusteluvaihtoehtoja.
- Luo tehtäviä, tapahtumia ja palkintoja.
- Yhdistä tarinan tapahtumat biomeihin, sankareihin ja Seed Systemiin.
- Esikatsele dialogin eteneminen pelaajan näkökulmasta.
- Tarkista puuttuvat viittaukset ja mahdottomat tehtäväpolut.

Spacemonkey voi ehdottaa sisältöä, mutta käyttäjä hyväksyy lopulliset tekstit ja tarinamuutokset.

### 7. Turvallinen tallennus ja julkaisuprosessi

Kaikki sisältö kulkee saman prosessin läpi:

1. **Luonnos**: sisältöä voi muokata vapaasti.
2. **Validointi**: pakolliset tiedot ja viittaukset tarkistetaan.
3. **Testaus**: sisältö kokeillaan erillisessä testiympäristössä.
4. **Hyväksyntä**: käyttäjä tarkistaa muutokset.
5. **Julkaisu**: muutokset viedään pelin varsinaiseen sisältöön.

Dev Studion tulee tarjota:

- Automaattinen varmuuskopio ennen julkaisua.
- Muutosten vertailu edelliseen versioon.
- Kumoa ja palauta -toiminnot.
- Virheilmoitukset selkokielellä.
- Tallennuksen tilan selkeä näyttö.
- Mahdollisuus palauttaa aiempi sisältöversio.
- Erillinen testiympäristö, jossa keskeneräiset muutokset eivät vaikuta varsinaiseen peliin.

Git voidaan pitää taustalla versionhallintana, mutta käyttäjän ei tarvitse käyttää terminaalia tai käsitellä Git-komentoja tavallisessa sisältötyössä.

### 8. Tekninen rakenne

| Moduuli | Tehtävä |
|---|---|
| ContentRegistry | Rekisteröi sankarit, taidot, objektit, siemenet ja muut sisällöt. |
| VisualContentEditor | Lomakkeet, esikatselut ja visuaaliset muokkaimet. |
| AssetLibrary | Hallitsee grafiikkaa, ääniä ja muita tiedostoja. |
| SchemaValidator | Tarkistaa sisällön rakenteen ja pakolliset tiedot. |
| ContentPreviewRuntime | Näyttää sisällön pelin kaltaisessa testiympäristössä. |
| ContentTestRunner | Suorittaa sisältö- ja tasapainotustestit. |
| VersionHistory | Tallentaa versiot ja mahdollistaa palautuksen. |
| PublishManager | Julkaisee hyväksytyt muutokset. |
| SpacemonkeyDevAssistant | Muuntaa käyttäjän pyynnöt sisältöluonnoksiksi ja ohjaa työvaiheita. |

Nämä ovat ehdotettuja moduuleja, eivät vahvistus siitä, että ne ovat jo olemassa Hearthwoodissa. Toteutuksessa hyödynnetään projektin nykyisiä järjestelmiä aina, kun se on mahdollista.

### 9. MVP — ensimmäinen toimiva versio

Ensimmäiseen versioon ei rakenneta kaikkia ominaisuuksia kerralla.

1. **Sisällönhallinta:** listaa olemassa olevat sankarit, skillit, objektit ja siemenet. Mahdollista niiden luominen, muokkaaminen, kopiointi ja poistaminen vahvistuksen jälkeen.
2. **Lomakepohjaiset editorit:** rakenna sankari-, skill- ja Seed-editorit, joissa käyttäjä ei kirjoita koodia.
3. **Tallennus ja validointi:** tallenna sisältö oikeisiin pelitiedostoihin tai nykyisen arkkitehtuurin mukaiseen tallennusjärjestelmään. Estä virheellisten muutosten julkaisu.
4. **Esikatselu ja testaus:** näytä sisältö ja tarjoa yksinkertainen tapa testata muutokset pelissä.
5. **Spacemonkey-integraatio:** lisää AI-avustettu sisällönluonti, joka tuottaa ehdotuksia, selittää asetukset ja auttaa korjaamaan validointivirheitä.

### 10. Hyväksymiskriteerit

- [ ] Uuden sankarin voi luoda käyttöliittymästä ilman koodin kirjoittamista.
- [ ] Taitoja voi luoda ja muokata valmiista pohjista.
- [ ] Siemeniä ja ympäristöobjekteja voi lisätä ja muokata.
- [ ] Sisältö tallentuu pysyvästi oikeaan peliprojektiin.
- [ ] Virheellinen sisältö antaa selkeän, ymmärrettävän virheilmoituksen.
- [ ] Käyttäjä näkee muutokset ennen niiden julkaisemista.
- [ ] Aiemman version voi palauttaa.
- [ ] Spacemonkey näyttää ehdotukset luonnoksina ja pyytää hyväksynnän ennen julkaisua.
- [ ] Keskeneräinen sisältö ei riko pelin käynnistymistä.
- [ ] Käyttäjä voi suorittaa tärkeimmät sisältötyöt ilman terminaalia.

### 11. Onnistumisen mittarit

Dev Studion onnistumista mitataan sillä, kuinka helposti käyttäjä pystyy luomaan oikeaa pelisisältöä.

- Uusi sankari voidaan luoda ja tallentaa ilman manuaalista koodausta.
- Tavallisen taidon tai siemenen muokkaaminen onnistuu muutamassa selkeässä työvaiheessa.
- Virheellisten sisältöjulkaisujen määrä vähenee.
- Käyttäjä pystyy testaamaan muutoksen ennen sen käyttöönottoa.
- Sisällön luominen ei vaadi käyttäjältä pelimoottorin sisäisen arkkitehtuurin tuntemusta.

### 12. Suositeltu toteutuslinja

Hearthwood Dev Studio kannattaa rakentaa peliprojektin päälle toimivaksi sisältöeditoriksi, ei erilliseksi työkaluksi, joka ei tunne pelin oikeaa dataa.

Visuaaliset editorit ja datalähtöinen sisällönhallinta ovat vakiintuneita pelinkehityksen lähestymistapoja. Esimerkiksi Godot tukee muokattavia resurssipohjaisia pelidatoja, ja Unity tarjoaa visuaalista skriptausta pelilogiikan rakentamiseen. Hearthwood voi hyödyntää samoja periaatteita mutta tarjota käyttäjälle huomattavasti rajatumman ja selkeämmän käyttöliittymän.

**Tärkein päätös:** Dev Studion pitää antaa sinun luoda sisältöä ilman koodia, mutta samalla sen on tunnistettava, milloin uusi ominaisuus edellyttää varsinaista ohjelmointityötä. Näin työkalusta tulee oikeasti hyödyllinen pelin kehittämiseen eikä vain sisältöideoiden esittelyyn.

---

## Tila (2026-10-19): mitä on jo olemassa

Kartoitus (PRD v2.1 §7) tehtiin 2026-10-19. Tiivistelmä tässä; koko raportti julkaistaan erikseen.

**Toimii (testattu):**
- **Hearthwood HQ** (PR #655): 9 huonetta, selkeät napit, tekniset välilehdet "More tools" -kohdan alla (`verify_studio_home`).
- **Patchbay-tallennus:** esikatselu → hyväksyntä → automaattinen varmuuskopio (.bak + snapshot) → nopea tarkistus (oxlint + koontitesti) → palautus yhdellä napilla.
- **70 sisältölistaa, 1 363 kohdetta, noin 9 000 kenttää** (`scripts/hearthwood-read-entities.mjs`, jonka testit menevät läpi). Kopiointi (CloneEntityForm), taulukkonäkymä (SheetView), haku kaikkiin listoihin (Dashboard).
- **First Song -tarina Studiossa + Story Writer** (PR #655): kohtaukset repliikki kerrallaan, aikajärjestyksessä.
- **Object Maker** (PR #655): omat taistelukentän esineet (`verify_object_maker`, `verify_object_maker_studio`).
- **Pelin sisäinen Quick Edit** (✎ Studio -kytkin, EditInStudioLink, DevDesk Päämajassa).

**Osittain:**
- **"Omin sanoin" -AI** (NlChangeBox): paikallinen Ollama `qwen2.5-coder:7b`. Osaa vain muuttaa yhden kohteen olemassa olevia arvoja (`set`). Ei kerro rajojaan etukäteen; mahdoton pyyntö näkyy vain hylättynä rivinä. Ei Spacemonkeyn AI:ta (Spacemonkey on vain tiedostojen kirjoittaja taustalla).
- **Tasapainotesti** (BalancePanel): ajaa "realistic bot" -simulaation, joka on tunnetusti epäluotettava ja kelpaa vain ennen–jälkeen-vertailuun.
- **Doctor:** tarkistaa vain työkalut (git, oxlint, vite, Ollama), ei pelin sisältöä.
- **Live-esikatselu:** erillinen sandbox-Vite keskitason muutoksille. Käynnissä oleva taistelu ei näytä muutosta.
- **Taidot datana:** vain ylennystaidot (8 lajia: smite, nova, volley, sanctuary, rally, blink, knock, zone) ja `fx`-lisävaikutukset (stun, root, poison, burn, chill, block...) toimivat pelkällä datalla. Luokkataidot (38 luokkaa, noin 101 taitoa) tarvitsevat jokainen oman koodinsa.

**Puuttuu:**
- **Sisällön tarkistin:** esim. "tapahtuma viittaa viholliseen, jota ei ole".
- **Erillinen testiympäristö** keskeneräisille muutoksille.
- **Taitojen työpaja** (§7.1).
- **Sankarieditori** kokonaisuutena.
- **Karttamaalari.**
- **Asset-kirjasto.**
- **When/And/Then-säännöt.**
- **"Mitä haluat tehdä tänään?" -pyyntö**, jossa rajat kerrotaan heti.
- **Kehityspyyntöjen lista Studiossa.** Valmis tehtävämalli `HeartwoodTask` + `/heartwood/tasks` on olemassa ja voidaan käyttää.
- **Seed Studio:** siemenajot ja kasvavat siemenet; seed-järjestelmän pohja #429 on olemassa.
