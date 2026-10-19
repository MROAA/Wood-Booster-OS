# HEARTHWOOD
## Master Product Requirements Document (PRD)
**Versio:** 1.0  
**Päiväys:** 19.10.2026  
**Tila:** Kehityssuunnitelma – toteutuksen nykytila tarkistettava  
**Kehitystyökalut:** Claude Code, Spacemonkey, Hearthwood Studio

> Liittyvät: Dev Studion tarkoitus ja rajaukset `docs/hearthwood-dev-studio-prd.md` (v2.1 Hearthwood Exclusive), pelisuunnittelun linjaukset `docs/hearthwood-design-interview-2026-10-19.md`. Tämä on tavoitedokumentti, ei vahvistettu toteutustilanne eikä lupa rakentaa kaikkea kerralla.

---

# 1. Tuotevisio

Hearthwood on syvällinen, taktinen fantasia-roguelite, jossa pelaaja rakentaa ryhmän metsän hengistä, elementaaliolennoista, mystisistä hahmoista ja kosmisista olennoista.

Pelin keskiössä ovat:

- Taktinen, vuoropohjainen ruudukkotaistelu.
- Syvät luokka-, heimo- ja elementtisynergiat.
- Roguelite-rakenne ja vaihtelevat pelikerrat.
- Hahmojen kehitys, persoonallisuudet ja suhteet.
- Monikerroksinen tarina ja muuttuva pelimaailma.
- Laaja varuste-, reliikki- ja talousjärjestelmä.
- Pitkälle kehittyvät viholliset ja pomotaistelut.
- Kattavat pelisisällön hallinta- ja kehitystyökalut.

**Pelin identiteetti: "Cosy tactics with deep synergy."**

Hearthwoodin pitää tuntua helposti lähestyttävältä mutta tarjota pitkäaikaista taktista syvyyttä.

## 1.1 Inspiraatiot

| Peli | Hearthwoodiin sovellettava idea |
|---|---|
| Hearthstone | Selkeä, miellyttävä käyttöliittymä ja pelillinen palaute |
| Guildrun | Ryhmänrakennus ja synergiat |
| Slay the Spire | Roguelite-kartta, tapahtumat ja palkintovalinnat |
| Magic: The Gathering | Fantasiamaailma, elementti-identiteetit ja yhdistelmät |
| Heroes of Might and Magic | Taktinen taistelu ja fantasiaryhmät |
| XCOM | Sijoittelu, suoja, liikkuminen ja taktiset päätökset |
| Backpack Battles | Varusteiden ja yhdistelmien strateginen syvyys |

Inspiraatioista otetaan suunnitteluperiaatteita, ei kopioida suojattuja hahmoja, kuvitusta tai käyttöliittymiä.

---

# 2. Kehityksen perusperiaatteet

## 2.1 Olemassa oleva Hearthwood säilytetään

Hearthwoodia ei rakenneta automaattisesti uudelleen tyhjästä.

Ennen merkittäviä muutoksia Claude Coden tulee:

1. Kartoittaa nykyinen projektirakenne.
2. Tunnistaa toimivat ominaisuudet.
3. Tunnistaa keskeneräiset järjestelmät.
4. Selvittää moduulien riippuvuudet.
5. Tarkistaa olemassa olevat testit.
6. Verrata nykyistä toteutusta tähän PRD:hen.
7. Laatia hyväksyttävä muutossuunnitelma.

**Vaatimus HW-001:** Toimivaa ominaisuutta ei saa korvata uudella toteutuksella ilman perusteltua tarvetta ja käyttäjän hyväksyntää.

## 2.2 Kehityksen vastuunjako

**Claude Code**
- Toteuttaa pelimekaniikat ja järjestelmät.
- Vastaa käyttöliittymän ja visuaalisen ilmeen toteutuksesta.
- Kirjoittaa ja suorittaa testit.
- Tutkii ja korjaa teknisiä ongelmia.
- Ylläpitää koodin laatua.

**Spacemonkey**
- Avustaa suunnittelussa.
- Analysoi pelin järjestelmiä.
- Ehdottaa uusia ominaisuuksia.
- Analysoi pelitasapainoa.
- Auttaa tehtävien priorisoinnissa.
- Tuottaa kehitysraportteja ja muutosehdotuksia.

**Hearthwood Studio**
- Tarjoaa keskitetyn hallintanäkymän.
- Näyttää projektin tilan.
- Hallitsee pelisisältöä.
- Näyttää testitulokset.
- Tarjoaa editorit ja simulaatiotyökalut.
- Hallitsee hyväksyntäprosessia.

**Käyttäjä**
- Päättää kehityksen suunnasta.
- Tarkistaa ehdotetut muutokset.
- Hyväksyy kaikki muutokset ennen niiden tallentamista projektiin tai julkaisemista.

Automaattiset väliaikaiset testit ja esikatselut sallitaan eristetyssä ympäristössä, mutta ne eivät saa muuttaa hyväksyttyä projektia.

---

# 3. Pelin ydinsilmukka

Hearthwoodin ensisijainen pelisilmukka:

1. Valitse pelikerran lähtötilanne.
2. Rakenna ja varusta ryhmä.
3. Valitse reitti roguelite-kartalla.
4. Kohtaa taisteluita, tapahtumia ja kauppiaita.
5. Kerää palkintoja ja resursseja.
6. Kehitä hahmoja ja synergioita.
7. Tee tarinaan vaikuttavia päätöksiä.
8. Kohtaa eliittejä ja pomoja.
9. Päätä pelikerta.
10. Päivitä pysyvä eteneminen ja avaukset.

**HW-002:** Pelikerran on tarjottava mielekkäitä valintoja myös ilman täydellistä varustekokoelmaa.

**HW-003:** Pysyvän kehityksen ei pidä tehdä myöhemmistä pelikerroista automaattisesti liian helppoja.

---

# 4. Taktinen taistelujärjestelmä

## 4.1 Taistelun perusrakenne

Taistelut ovat vuoropohjaisia ja tapahtuvat ruudukkokentällä.

Ominaisuudet:

- Nopeuteen perustuva vuorojärjestys.
- Liikkumis- ja toimintapisteet.
- Lähitaistelu ja kaukotaistelu.
- Yksittäiset kohteet.
- Alue-, linja- ja kartiohyökkäykset.
- Ansat ja maastovaikutukset.
- Suoja ja näkölinjat.
- Korkeuserot.
- Tilavaikutukset.
- Reaktiot ja vastatoimet.
- Ryhmä- ja muodostelmabonukset.

## 4.2 Taistelun vaatimukset

**HW-004:** Taistelun tilan tulee olla yksiselitteinen ja deterministisesti testattava samoilla lähtöehdoilla ja satunnaissiemenellä.

**HW-005:** Pelaajan on nähtävä toimintopisteet, manakustannukset, kantama ja ennakoitavat vaikutukset ennen toiminnon vahvistamista.

**HW-006:** Taistelulogi tallentaa tärkeimmät tapahtumat, jotta virheitä voidaan jäljittää.

## 4.3 Taistelun lisäjärjestelmät

Laajennettavia osa-alueita:

- Kriittiset osumat.
- Väistöt ja torjunnat.
- Kilvet.
- Vahingonvastustus.
- Elementtireaktiot.
- Myrkky, tainnutus, provosointi ja muut tilavaikutukset.
- Ympäristön muuttaminen.
- Vuoron aikana aktivoituvat passiiviset kyvyt.
- Taistelun vaihekohtaiset erikoissäännöt.

Kaikille vaikutuksille määritellään kesto, pinoutuminen, poistuminen, immuniteetit ja vastakeinot.

---

# 5. Luokat, resurssit ja taidot

## 5.1 Luokkajärjestelmä

Hahmoilla voi olla erilaisia taktisia rooleja:

- Tankki
- Vahingontekijä
- Parantaja
- Tukihahmo
- Kontrollihahmo
- Kutsuja
- Hybridiluokka

Jokaisella luokalla on oma identiteetti, vahvuudet, heikkoudet ja kehitysvaihtoehdot.

## 5.2 Resurssijärjestelmä

Hearthwood tukee luokkakohtaisia resursseja:

- Mana
- Energia
- Raivo
- Keskittyminen
- Erikoisresurssit

Resurssit voivat palautua vuoroittain, tapahtumista, hyökkäyksistä tai varusteiden vaikutuksesta.

## 5.3 Taitojärjestelmä

Taitojen ominaisuuksia:

- Aktiiviset ja passiiviset taidot.
- Resurssikustannukset.
- Jäähdytysajat.
- Kohdistus.
- Kantama.
- Elementti.
- Tilavaikutukset.
- Synergiat.
- Kehitystasot.
- Ehdolliset vaikutukset.

**HW-007:** Uusien taitojen lisäämisen pitää olla mahdollista laajennettavan tietomallin kautta ilman tarpeetonta taistelumoottorin muokkaamista.

---

# 6. Heimot, elementit ja synergiat

Synergiat muodostavat Hearthwoodin strategisen ytimen.

Synergioihin voivat vaikuttaa:

- Heimot.
- Luokat.
- Elementit.
- Hahmosuhteet.
- Varusteet.
- Reliikit.
- Ryhmän muodostelma.
- Maasto.
- Tilavaikutukset.

Synergioilla voi olla useita aktivoitumistasoja ja yhdistelmävaikutuksia.

**HW-008:** Jokaisen synergian aktivointiehdot, vaikutukset ja vastakeinot on esitettävä pelaajalle ymmärrettävästi.

**HW-009:** Synergioiden yhdistelmät on voitava testata automaattisesti, mukaan lukien liian vahvat ketjureaktiot.

---

# 7. Hahmojen rekrytointi ja kehitys

Hearthwoodissa yhdistyvät pysyvä hahmokokoelma ja pelikertakohtainen ryhmänrakennus.

Järjestelmä sisältää:

- Rekrytoinnin.
- Hahmokokoelman.
- Kokemustasot.
- Taitopuut.
- Varustamisen.
- Hahmokohtaiset tehtävät.
- Suhdekehityksen.
- Pysyvät avaukset.
- Pelikertakohtaiset vahvistukset.

**HW-010:** Pysyvät ja pelikertakohtaiset ominaisuudet tallennetaan erillisiin tietorakenteisiin, jotta niiden tasapainotus ja palauttaminen onnistuvat turvallisesti.

---

# 8. Persoonallisuudet ja hahmosuhteet

Jokaisella merkittävällä hahmolla voi olla:

- Persoonallisuus.
- Taustatarina.
- Tavoitteet.
- Muistot.
- Lojaalisuus.
- Ystävyyssuhteet.
- Kilpailuasetelmat.
- Pelot ja mieltymykset.

Spacemonkeyn suhdejärjestelmä hyödyntää suunniteltuja mittareita:

- Trust
- Curiosity
- Fear

Suhteet voivat avata uusia dialogeja, tapahtumia, tarinoita ja synergioita.

**HW-011:** Suhdejärjestelmän on tuotettava ymmärrettäviä seurauksia eikä satunnaisesti muuttuvia arvoja ilman selitettävää syytä.

---

# 9. Roguelite-kartta

Kartalla on erilaisia solmuja:

- Tavallinen taistelu.
- Eliittitaistelu.
- Pomotaistelu.
- Tapahtuma.
- Kauppias.
- Lepopaikka.
- Erikoiskohtaaminen.
- Salainen alue.

Karttarakenne tukee reittivalintoja ja biomekohtaisia sääntöjä.

**HW-012:** Karttageneraattorin on kyettävä tuottamaan läpäistäviä, sääntöjen mukaisia reittejä ja testaamaan niiden palkinto- ja vaikeusjakaumia.

---

# 10. Biomit ja ympäristö

Lähtökohtana ovat jo suunnitellut biomit:

- Autumnwood
- Frostroot
- Sunspire
- Mirefall

Jokaisella biomilla on:

- Oma historia.
- Visuaalinen identiteetti.
- Vihollisvalikoima.
- Erikoistapahtumat.
- Resurssit.
- Kauppiaat.
- Pomot.
- Maastomekaniikat.
- Sääolosuhteet.
- Erikoissäännöt.

Biomit voivat muuttua pelaajan valintojen ja pelikertojen perusteella.

## 10.1 Forest Mood

Metsän mieliala on laajennettava maailmantilan järjestelmä.

Se voi vaikuttaa tapahtumiin, dialogeihin, ympäristön tunnelmaan ja valikoituihin pelimekaniikkoihin.

**HW-013:** Biomien muutokset eivät saa tehdä taistelukentistä epäselviä tai poistaa pelaajalta mahdollisuutta ennakoida olennaisia riskejä.

---

# 11. Viholliset ja pomot

## 11.1 Vihollisjärjestelmä

Vihollisilla on:

- Heimo.
- Luokka.
- Elementti.
- Taktinen rooli.
- Kyvyt.
- Käyttäytymisprofiili.
- Heikkoudet.
- Vastustuskyvyt.
- Biomekohtaiset ominaisuudet.

## 11.2 Vihollistekoäly

Tekoäly arvioi esimerkiksi:

- Uhkat.
- Etäisyydet.
- Maaston.
- Ryhmän kokoonpanon.
- Suojauksen.
- Resurssit.
- Tavoitteet.
- Mahdolliset synergiat.

## 11.3 Pomojärjestelmä

Pomotaistelut voivat sisältää:

- Useita vaiheita.
- Vaihekohtaisia kykyjä.
- Ympäristömuutoksia.
- Kutsuttavia apujoukkoja.
- Erikoisvoittoehtoja.
- Tunnistettavia hyökkäyskuvioita.

**HW-014:** Pomoilla on oltava opittavia vastakeinoja. Vaikeuden tulee perustua ensisijaisesti taktiikkaan eikä pelkästään suureen terveys- tai vahinkomäärään.

---

# 12. Tarina ja lore

Hearthwoodin tarina koostuu useista kerroksista:

1. Päätarina.
2. Roguelite-tapahtumat.
3. Hahmojen henkilökohtaiset tarinat.
4. Biomien historia.
5. Spacemonkeyn suhdekehitys.
6. Kosmiset mysteerit.
7. Pelaajan valintojen seuraukset.

Seitsemän näytöksen tarinarakenne toimii yhtenä suunnittelun lähtökohtana, jonka nykyinen toteutus kartoitetaan.

Tarina ja taktinen taistelu pidetään pääosin erillisinä järjestelminä, mutta niiden välille voidaan rakentaa tarkasti määriteltyjä yhteyksiä.

---

# 13. Dynaamiset tapahtumat

Tapahtumajärjestelmä sisältää:

- Satunnaiset tapahtumat.
- Käsikirjoitetut tapahtumat.
- Monivaiheiset valinnat.
- Hahmokohtaiset vaihtoehdot.
- Moraaliset ristiriidat.
- Piilotetut seuraukset.
- Biomekohtaiset tapahtumaketjut.
- Pelikertojen yli jatkuvat vaikutukset.

**HW-015:** Tapahtumajärjestelmän tulee olla jatkuvasti laajennettavissa ilman koko tapahtumamoottorin uudelleenkirjoittamista.

Tapahtumille määritellään ehdot, seuraukset, palkinnot, tilamuutokset ja testit.

---

# 14. NPC:t ja elävä maailma

Valitaan kattava NPC-järjestelmä.

NPC-hahmoilla voi olla:

- Persoonallisuus.
- Muisti.
- Tavoitteet.
- Maine.
- Suhteet.
- Rutiinit.
- Kaupankäyntikäyttäytyminen.
- Ryhmittymä.
- Reaktiot maailman tapahtumiin.

NPC:t voivat vaikuttaa tapahtumien syntymiseen ja pelaajan mahdollisuuksiin.

**HW-016:** NPC-käyttäytymisen on perustuttava hallittuihin ja testattaviin sääntöihin. Mahdollinen generatiivinen tekoäly ei saa suoraan muuttaa pelin pysyvää tilaa ilman validointia.

---

# 15. Varusteet, reliikit ja valmistus

Varustejärjestelmä sisältää:

- Aseet.
- Haarniskat.
- Lisävarusteet.
- Reliikit.
- Harvinaisuustasot.
- Valmistusmateriaalit.
- Parantelun.
- Esineyhdistelmät.
- Erikoisominaisuudet.
- Luokkasynergiat.

Varusteet voivat muuttaa taitojen toimintaa, resurssikustannuksia ja taktisia mahdollisuuksia.

Pysyvät ja pelikertakohtaiset esineet erotetaan toisistaan.

**HW-017:** Varusteiden vaikutusten laskentajärjestys ja yhteisvaikutukset on määriteltävä yksiselitteisesti.

---

# 16. Pelitalous

Pelitalous sisältää:

- Kullan.
- Essencen.
- Valmistusmateriaalit.
- Harvinaiset resurssit.
- Kaupankäynnin.
- Erikoiskauppiaat.
- Dynaamiset hinnat.
- Pysyvän talouden.
- Pelikertakohtaisen talouden.

Talouden tasapainotuksessa seurataan resurssien syntymistä, kulumista ja kasautumista.

**HW-018:** Pelaaja ei saa joutua peruuttamattomaan etenemisesteeseen pelkästään huonon taloudellisen satunnaistuloksen vuoksi ilman tarkoituksellisesti suunniteltua riskiä.

---

# 17. Tehtävät ja saavutukset

Järjestelmä sisältää:

- Päätarinatehtävät.
- Sivutehtävät.
- Hahmotehtävät.
- Biomekohtaiset tehtäväketjut.
- Satunnaiset haasteet.
- Saavutukset.
- Salaiset tavoitteet.
- Pysyvät avaukset.

Tehtävillä on selkeät aloitus-, etenemis-, onnistumis- ja epäonnistumisehdot.

Studio näyttää tehtävien riippuvuudet ja mahdolliset etenemisen estävät ristiriidat.

---

# 18. Pelitallennukset ja tietomigraatiot

Tallennusjärjestelmä sisältää:

- Automaattitallennukset.
- Manuaaliset tallennukset.
- Useita tallennuspaikkoja.
- Varmuuskopiot.
- Eheystarkistukset.
- Tallennusten versioinnin.
- Turvallisen palautuksen.

Tietorakenteiden muutokset toteutetaan hallituilla migraatioilla.

**HW-019:** Vanha tallennus muunnetaan uuteen muotoon vain tarkistettavalla migraatiolla. Alkuperäinen tallennus säilytetään palautusta varten.

**HW-020:** Epäonnistunut migraatio ei saa tuhota alkuperäistä tallennusta.

---

# 19. Hearthwood Studio

Hearthwood Studio on pelin kehityksen keskitetty hallintaympäristö.

## 19.1 Projektin hallintakeskus

Näyttää:

- Projektin tilan.
- Moduulit.
- Riippuvuudet.
- Testitulokset.
- Virheet.
- Kehitystehtävät.
- Muutosehdotukset.
- Versiohistorian.

## 19.2 Sisältökirjasto

Sisältää:

- Hahmot.
- Luokat.
- Taidot.
- Heimot.
- Esineet.
- Reliikit.
- Viholliset.
- Pomot.
- Biomit.
- Tapahtumat.
- NPC:t.
- Tehtävät.
- Talousasetukset.

Kirjasto tarjoaa haun, suodatuksen, mallipohjat, sisältöpaketit, riippuvuustarkistukset, massamuokkaukset sekä tuonnin ja viennin.

## 19.3 Editorit

Suunnitellut editorit:

- Hahmoeditori.
- Luokkaeditori.
- Taitoeditori.
- Synergiaeditori.
- Viholliseditori.
- Pomoeditori.
- Biome-editori.
- Tapahtumaeditori.
- Tehtäväeditori.
- NPC-editori.
- Esine- ja reliikkieditori.
- Talouseditori.

Editorit hyödyntävät mahdollisuuksien mukaan yhteisiä komponentteja ja tietomalleja.

## 19.4 Hyväksyntäprosessi

Kaikki pysyvät muutokset vaativat käyttäjän hyväksynnän.

Työnkulku:

1. Muutosehdotus.
2. Vaikutusanalyysi.
3. Eristetty esikatselu.
4. Automaattiset testit.
5. Testi- ja riskiraportti.
6. Käyttäjän hyväksyntä.
7. Muutoksen tallennus.
8. Versionhallinta.
9. Tarvittaessa erikseen hyväksytty julkaisu.

**HW-021:** Claude Code tai Spacemonkey ei saa ohittaa hyväksyntäprosessia.

---

# 20. Laadunvarmistus ja simulaatiot

Laadunvarmistus sisältää:

- Yksikkötestit.
- Integraatiotestit.
- Käyttöliittymätestit.
- Taistelutestit.
- Tallennustestit.
- Migraatiotestit.
- Tasapainosimulaatiot.
- Taloussimulaatiot.
- Vihollistekoälyn testit.
- Tapahtumaketjujen validoinnin.
- Suorituskykytestit.

## 20.1 Tasapainon analysointi

Studio pystyy vertailemaan:

- Luokkia.
- Tiimikokoonpanoja.
- Synergioita.
- Varusteita.
- Vaikeustasoja.
- Vihollisryhmiä.
- Pomoja.
- Palkintojakaumia.
- Talouden kehitystä.

Tuloksista tuotetaan ymmärrettävät raportit ja perustellut muutosehdotukset.

**HW-022:** Automaattinen tasapainoanalyysi ei saa muuttaa pelin arvoja itsenäisesti.

---

# 21. Visuaalinen toteutus

Claude Code vastaa Hearthwoodin visuaalisen ilmeen kehittämisestä.

Ennen muutoksia kartoitetaan:

- Nykyiset React-komponentit.
- Käyttöliittymän rakenne.
- Tyylit ja teemat.
- Grafiikkaresurssit.
- Animaatiot.
- Näyttökokojen tuki.
- Nykyiset pelinäkymät.

Visuaalisen toteutuksen tavoitteet:

- Selkeä ja helposti ymmärrettävä käyttöliittymä.
- Yhtenäinen fantasiaidentiteetti.
- Miellyttävät animaatiot.
- Hyvä luettavuus.
- Selkeä taktinen palaute.
- Käyttökelpoisuus eri resoluutioilla.
- Kohtuullinen suorituskyky.

**HW-023:** Nykyistä visuaalista toteutusta ei korvata kokonaan ilman nykytilan kartoitusta ja hyväksyttyä suunnitelmaa.

---

# 22. Tekninen arkkitehtuuri

Tavoitteena on modulaarinen ja testattava rakenne.

Suositellut loogiset kokonaisuudet:

| Moduuli | Vastuu |
|---|---|
| Combat Engine | Taistelun säännöt ja vuorot |
| Character System | Hahmot ja ominaisuudet |
| Class & Skill System | Luokat, taidot ja resurssit |
| Synergy Engine | Synergioiden laskenta |
| Enemy AI | Vihollisten päätöksenteko |
| World System | Biomit ja maailmantila |
| Event Engine | Tapahtumat ja valinnat |
| Narrative System | Tarina ja lore |
| Relationship System | Hahmosuhteet |
| Inventory System | Esineet ja varusteet |
| Economy System | Valuutat ja kaupankäynti |
| Progression System | Pysyvä ja pelikertakohtainen kehitys |
| Save System | Tallennus ja palautus |
| Content Registry | Sisältöjen hallinta |
| Simulation Engine | Testaus ja tasapainotus |
| Studio | Kehityksen hallintaympäristö |

Nämä ovat **loogisia vastuualueita**, eivät määräys luoda uusia kansioita tai rinnakkaisia toteutuksia. Olemassa oleva arkkitehtuuri kartoitetaan ensin.

---

# 23. Muut järjestelmät

Kaikki haastattelussa erikseen määrittelemättömät mutta peliä hyödyttävät osa-alueet suunnitellaan kattaviksi, monipuolisiksi ja laajennettaviksi.

Niihin kuuluvat:

- Äänet, musiikki ja äänimaailma.
- Animaatiot ja visuaaliset efektit.
- Pelin opastus ja tutoriaalit.
- Saavutettavuusasetukset.
- Vaikeustason lisäasetukset.
- Pelin sisäinen tietosanakirja.
- Lokalisointi.
- Näppäimistö- ja hiiriohjaus.
- Suorituskyvyn optimointi.
- Virheraportointi.
- Kehityksen diagnostiikka.
- Pelitilastot.
- Sisällön laajennettavuus.

Näiden yksityiskohtaiset vaatimukset tarkennetaan toteutussuunnittelussa.

---

# 24. Kehitysvaiheet

## Vaihe 0 — Nykytilan kartoitus

**Ensimmäinen toteutettava vaihe.**

Claude Code selvittää:

- Projektin tiedostorakenteen.
- Nykyiset pelimekaniikat.
- Nykyiset käyttöliittymät.
- Sisältöjärjestelmät.
- Tallennusjärjestelmän.
- Testausjärjestelmän.
- Tunnetut virheet.
- Teknisen velan.
- Puuttuvat PRD-vaatimukset.

Tuotos: nykytilaraportti ja hyväksyttävä toteutussuunnitelma.

## Vaihe 1 — Vakaa pelattava perusta

- Toimiva pelikerran aloitus ja lopetus.
- Toimiva taktinen taistelu.
- Ryhmänrakennus.
- Perusviholliset.
- Perustaidot.
- Roguelite-kartta.
- Tallennukset.
- Keskeiset automaattitestit.

## Vaihe 2 — Taktinen syvyys

- Luokkakohtaiset resurssit.
- Synergiat.
- Maastomekaniikat.
- Kehittynyt vihollistekoäly.
- Varusteet.
- Reliikit.
- Eliitit ja pomot.

## Vaihe 3 — Maailma ja tarina

- Biomien laajentaminen.
- Tapahtumaketjut.
- Hahmosuhteet.
- NPC-järjestelmä.
- Tarina.
- Tehtävät ja saavutukset.

## Vaihe 4 — Pysyvä eteneminen ja talous

- Hahmokokoelma.
- Kehityspuut.
- Valmistus.
- Kauppiaat.
- Pysyvät avaukset.
- Talouden simulointi.

## Vaihe 5 — Hearthwood Studio

- Projektin tilannekuva.
- Sisältökirjasto.
- Editorit.
- Testiraportit.
- Simulaatiot.
- Claude Code- ja Spacemonkey-yhteistyö.
- Manuaalinen hyväksyntäprosessi.

Studion välttämättömiä osia voidaan toteuttaa jo aiemmissa vaiheissa, jos ne helpottavat kehitystä.

## Vaihe 6 — Viimeistely

- Pelitasapaino.
- Suorituskyky.
- Käyttöliittymän viimeistely.
- Äänet ja animaatiot.
- Opastus.
- Saavutettavuus.
- Tallennusten luotettavuus.
- Laajat regressiotestit.

---

# 25. Valmistumiskriteerit

Ominaisuus voidaan merkitä valmiiksi, kun:

1. Sen toiminta vastaa hyväksyttyä vaatimusta.
2. Se on integroitu nykyiseen Hearthwoodiin.
3. Sen keskeiset testit läpäisevät.
4. Sen riippuvuudet on tarkistettu.
5. Se ei riko olemassa olevia ominaisuuksia.
6. Mahdolliset tallennusmigraatiot toimivat.
7. Sen vaikutukset pelitasapainoon on arvioitu tarvittaessa.
8. Käyttäjä on hyväksynyt muutoksen.

Pelkkä koodin olemassaolo ei tarkoita, että ominaisuus on valmis.

---

# 26. Projektin onnistumisen mittarit

Hearthwoodin kehitystä arvioidaan seuraavilla mittareilla:

**Pelattavuus**
- Pelikerran voi suorittaa alusta loppuun.
- Taistelun säännöt toimivat johdonmukaisesti.
- Pelaajalla on useita mielekkäitä strategioita.

**Sisältö**
- Uusia hahmoja, taitoja ja tapahtumia voidaan lisätä ilman tarpeetonta moottorimuutosta.
- Sisältöjen riippuvuudet voidaan tarkistaa.
- Pelikerrat tarjoavat vaihtelua.

**Tekninen laatu**
- Kriittiset testit läpäisevät.
- Tallennukset ovat palautettavissa.
- Virheet ovat jäljitettävissä.
- Suorituskyky pysyy hyväksytyissä tavoitteissa.

**Kehitystyö**
- Claude Code ja Spacemonkey hyödyntävät yhteistä tilannekuvaa.
- Muutokset voidaan tarkistaa ennen hyväksyntää.
- Studio kertoo selkeästi, mikä toimii ja mikä on kesken.

Tarkat numeeriset tavoitteet määritetään nykytilan mittausten jälkeen.

---

# 27. Kehityksen pääsääntö

**Hearthwoodia kehitetään laajentamalla, ei tarpeettomasti uudelleenrakentamalla.**

Jokaisen uuden ominaisuuden on:

- Sovittava pelin kokonaisuuteen.
- Hyödynnettävä nykyisiä toiminnallisuuksia.
- Oltava testattava.
- Oltava ylläpidettävä.
- Oltava laajennettavissa.
- Säilytettävä pelaajan eteneminen.
- Läpäistävä käyttäjän hyväksyntäprosessi.

**Lopullinen tavoite:** Hearthwood on kokonainen, taktisesti syvällinen, tarinallinen ja jatkuvasti kehitettävä fantasiapeli, jonka sisältöä ja järjestelmiä voidaan hallita selkeästi Hearthwood Studion, Claude Coden ja Spacemonkeyn avulla.

---

**Dokumentin tila:** Haastattelun pohjalta koottu Master PRD v1.0. Tekninen nykytila, toteutuksen yksityiskohdat, työmäärät ja lopulliset hyväksymiskriteerit täsmennetään projektin kartoituksessa.
