# HEARTHWOOD — MASTER DEVELOPMENT PRD v2.0

- **Päiväys:** 19.10.2026
- **Tila:** Kehityksen ohjausdokumentti; ei väite siitä, että kaikki ominaisuudet toimivat
- **Kohde:** Hearthwood-peli, Hearthwood Studio, Claude Code -kehitysprosessi, Steam-julkaisu
- **Perustana:** käyttäjän 19.10.2026 tilannekatsaus, kehityshaastattelut 103–120 ja lähdekoodipaketin dokumentit sekä nimetyt moduulit.
- **Suhde aiempaan:** jatkaa dokumenttia `docs/hearthwood-master-prd.md`; tämä v2.0 ohjaa sprinttien järjestystä.

## 1. Tuotevisio

Hearthwood on sisältörikas, vuoropohjainen taktinen roguelike. Pelin keskiössä ovat vapaa buildcrafting, strategisesti haastavat ja monipuoliset kohtaamiset sekä interaktiivinen ympäristö. Pelaaja rakentaa sankarijoukkueensa luokkien, heimojen, taitojen, esineiden, reliikkien, manan, promootioiden ja ominaisuuksien avulla. Peli on helppo oppia mutta vaikea hallita. Sen tulee tuntua miellyttävältä pelata myös pitkän ajan jälkeen.

**Pääperiaate:** *Build first, tactics matter.* Rakennelma avaa mahdollisuudet; taistelun valinnat ratkaisevat, miten niitä käytetään.

**Inspiraatiot:** XCOM (ruudukkotaktiikka), Mewgenics (odottamattomat yhdistelmät ja kehitys), Dota 2 (syvät vastastrategiat), Hearthstone (luettavuus ja lämmin tunnelma), Slay the Spire (roguelite-rakenne). Ei suoraa taiteen, nimien tai käyttöliittymän kopiointia.

## 2. Ei-neuvoteltavat suunnitteluperiaatteet

1. Täysin vuoropohjainen taistelu; ei reaaliaikaisia vuoroaikarajoja.
2. Strateginen haaste syntyy valinnoista, ei kömpelöstä käyttöliittymästä tai epäreilusta satunnaisuudesta.
3. Buildcrafting on tärkein pitkän aikavälin palkitsevuuden lähde. Vahvat ja erikoiset buildit ovat sallittuja; tasapainoa arvioidaan pelitesteillä.
4. Taistelut ovat vaihtelevia strategisia pulmia, joihin on useita mahdollisia ratkaisuja.
5. Älykäs vihollis-AI käyttää saatavilla olevaa tietoa ja samoja olennaisia pelisääntöjä; ei salaista huijausta.
6. Mana on keskeinen strateginen järjestelmä. Jokainen sprintti arvioi ja mahdollisuuksien mukaan syventää sen roolia.
7. Uudella mekaniikalla on näkyvä palaute, esikatselu tai animaatio; ensin toimiva paikkamerkki, sitten viimeistely.
8. Olemassa olevaa koodia, sisältöä ja editoria ei korvata ilman todennettua tarvetta.
9. Pelaajan omat maalaukset ovat etusijalla muihin kuviin nähden.
10. Tarinallinen teksti kirjoitetaan käsin, ei generoida automaattisesti.

## 3. Nykyinen lähdekoodiin perustuva lähtötilanne

Havaitut moduulit (polut tarkistettu `development`-haarasta 19.10.2026):

- `src/services/heartwood/tacticsEngine.js`, `tacticsMana.js`, `tacticsSmartAi.js`
- `src/data/heartwood/classes.js`, `promotions.js`, `traits.js` (myös `src/services/heartwood/promotions.js`, `traits.js`)
- `src/pages/HearthwoodStudio.jsx`

Käyttäjän ilmoittama nykytila: 38 sankariluokkaa ja taitopuut; ruudukkotaistelu, suoja, suunta, ZoC, reaktiot, maasto, objektit, elementit, bossit, tavoitteet ja deterministinen vihollis-AI; kauppa, komentajat, reliikit, eteneminen, First Song v1 -tarina sekä Studio. Nämä ovat olemassa olevien toteutusten lähtökohtia, eivät automaattisesti hyväksyttyjä laatutuloksia.

Dokumentaation tärkeät lähteet:

- `docs/hearthwood-master-prd.md`
- `docs/hearthwood-design-interview-2026-10-19.md`
- `docs/hearthwood-dev-studio-prd.md`
- `docs/hearthwood-visual-theme.md`
- `docs/hearthwood-mana-resource-prd.md`
- `docs/hearthwood-battlefield-plan.md`
- `docs/hearthwood-challenging-fair-deep-prd.md`
- `docs/hearthwood-tactical-pivot-scoping.md` (historiallinen, ei nykyisen toteutuksen määritys)

**Kielisääntö — RATKAISTU 19.10.2026:** `docs/hearthwood-visual-theme.md` on oikeassa. Peli on kokonaan englanniksi, eikä ruudulla näy suomea (Marc 17.10.2026: *"ei suomea näkyviin pelissä"*). Tilannekatsauksen maininta suomenkielisistä alaotsikoista perustui vanhentuneeseen tietoon. Suomalaisuus näkyy vain visuaalisesti.

## 4. Tactical Combat 2.0 — tavoitevaatimukset

### TC-01 Vuorot ja luettavuus
- Pelaaja voi harkita vuoroa rajattomasti.
- Toimintapisteet, liikkuminen, kantamat, suoja, reaktiot ja vihollisten näkyvät aikeet esitetään ymmärrettävästi.
- Pelaaja näkee toiminnon olennaiset kustannukset ja vaikutukset ennen hyväksymistä.

### TC-02 Taktinen päätöksenteko
- Sijoittelu, maasto, kohteen valinta, toimintajärjestys ja resurssien ajoitus muodostavat merkityksellisiä vaihtoehtoja.
- Vahva rakennelma saa tuntua vahvalta, mutta kaikki kohtaamiset eivät ratkea samalla toiminnolla.
- Taistelussa vältetään turhat klikkaukset ja hitaat pakkoanimaatiot.

### TC-03 Buildcrafting
- Luokka-, heimo-, esine-, reliikki-, taito-, promootio- ja manaominaisuuksien vaikutukset yhdistyvät ennustettavien sääntöjen kautta.
- Rakennelmat voivat olla luotettavia, pelityyliä muuttavia tai harvinaisen voimakkaita.
- Uudet synergiat eivät saa edellyttää yksittäistä pakollista sankaria tai tiettyä yhtä oikeaa ratkaisua.
- Pelaajalle näytetään, mistä merkittävä synergia syntyy.

### TC-04 Mana
- Manan käyttö, säästäminen, tuottaminen ja häirintä ovat aitoja valintoja.
- Mahdolliset manasolmut ja ympäristöön liittyvät manavaikutukset ovat ymmärrettäviä, taktisesti kiinnostavia ja käytettävissä reilusti molemmille osapuolille.
- Manaprofiilien vaikutukset testataan luokkien ja buildien kesken.

### TC-05 Älykäs ja reilu vihollis-AI
- Viholliset arvioivat sijoittelua, tavoitteita, suojaa, manaa, taitoja ja joukkuetukea oman havaittavan tietonsa perusteella.
- Eri vihollisilla on erilaiset taktiikat; vastastrategiat ovat opittavissa.
- AI:n päätöksiä testataan kiinteillä siemenillä ja vertailutilanteilla; fairness-botti vain suhteelliseen vertailuun.
- Ei peiteltyä vastustajan buildin mukaan huijaavaa säätöä.

### TC-06 Kohtaamisten monipuolisuus
- Kohtaamisilla on selkeä taktinen identiteetti: esimerkiksi väijytys, alueen puolustus, objektin tuhoaminen, manakohteen hallinta, eliittimuodostelma tai bossin vaihepulma.
- Olemassa olevat objective-, terrain- ja boss-moduulit tarkistetaan ennen lisäyksiä.
- Jokaiselle kohtaamistyypille suunnitellaan vähintään kaksi uskottavaa ratkaisustrategiaa.

### TC-07 Interaktiivinen ympäristö
- Ympäristö tarjoaa merkityksellisiä taktisia valintoja: suoja, tuhoutuvat objektit, elementit, kulkureitit ja mahdolliset muuttuvat vaaravyöhykkeet.
- Vaikutukset näkyvät ruudukolla ja esikatselussa ennen riskialtista toimintoa, kun tiedot ovat pelaajan saatavilla.
- Ympäristöä voivat hyödyntää sekä pelaaja että viholliset.
- Dynaamisuuden tarkka aste on avoin: käyttäjä ei ole vielä valinnut haastattelun 121 vaihtoehtoa.

## 5. Sankarit, eteneminen ja talous

- Säilytetään nykyiset 38 luokkaa ja niiden taitopuut; tarkistetaan toteutuksen toimivuus ja luokkien erottuvuus.
- Arvioidaan promootiot tasoilla 3 ja 5, varustepaikat ja satunnaiset piirteet suhteessa olemassa oleviin promotions- ja traits-moduuleihin.
- Heimojen, esineiden, reliikkien ja manan yhteistoiminta on tärkeämpää kuin pelkkä uusien sisältökohteiden määrä.
- Markkina ja talous tukevat riskinottoa, säästämistä ja rakennelman suunnittelua.
- Roguelite-seikkailu, tutkiminen, First Song -tarina ja pitkäaikainen eteneminen tukevat taktisia haasteita.
- Vaikeustason lopullinen kalibrointi tehdään vasta, kun olennainen sisältö on koossa; kriittiset reiluus- ja pelattavuusvirheet korjataan heti.

## 6. Hearthwood Studio — Complete Creation Studio

**Tavoite:** Yksi selkeä ja tehokas kehitysympäristö, jossa Marc voi luoda ja muokata Hearthwoodia ilman ohjelmointia.

**Työskentelymalli:** Hybrid Creative Workspace: suora visuaalinen muokkaus, rakenteiset editorit ja tekoälyavusteinen ohjaus käyttävät samaa sisältömallia.

**Turvallinen työnkulku:** kuvaile → muokkaa → esikatsele → testaa eristetyssä ympäristössä → validoi → hyväksy → tallenna; muutokset voidaan jäljittää ja palauttaa.

**Priorisoitu työjono:**
1. Object Maker (käyttäjän mukaan työn alla; tarkista nykytila).
2. Map Painter (rakentuu olemassa olevien kartta- ja maastomallien päälle).
3. Hero Editor (ensin kuvat, sitten muut sankaritiedot).
4. First Song -tarinan lukeminen ja käsin kirjoitetun tekstin muokkaus Studiossa.
5. Seed Studio.
6. Yhtenäinen Content Library ja Mechanics Lab tarpeen mukaan, ei päällekkäisiä editoreita.

**Vaatimukset:** riippuvuuksien tarkistus, muokkausten esikatselu, turvallinen tallennus, versiopalautus, testaus ja selkeät virheilmoitukset. Pelaajaversio ei sisällä Studioa tai kehittäjätoimintoja.

## 7. Käyttöliittymä ja visuaalinen identiteetti

- Luonnollinen pohjoismainen metsä, suomalaisia ja saamelaisia aiheita kunnioittavasti, Elder Futhark -riimiviittauksia ja lämmin tavernatunnelma.
- Sammal, jäkälänkulta ja rauhallinen tumma metsä; hiilloksenpunainen vain vaaralle.
- Pelitiedot esitetään selkeästi ja tilanteeseen sopivasti, ilman visuaalista melua.
- Käyttäjän omat maalaukset ensisijaisia.
- Suunnittele ja testaa näkymät 1536 × 864 -resoluutiolla; Market-näkymä ei saa vierittyä.
- **Kieli:** pelin teksti on kokonaan englanniksi; ruudulla ei näy suomea (ks. luku 3).
- Ääni ja viimeistellyt animaatiot tehdään loppuvaiheessa; jokaisella uudella mekaniikalla on kuitenkin heti vähintään toimiva visuaalinen palaute.

## 8. Toteutusroadmap — riippuvuudet ennen aikataululupauksia

### Sprintti 0: Audit & Playable Baseline
**Tavoite:** todeta mikä toimii, mitä ei, ja mikä heikentää pelattavuutta eniten.
1. Repositorion ja dokumentaation nykytilan kartoitus.
2. Nykyisen taistelun ja buildcraftingin toiminnallinen läpikäynti.
3. AI:n, manan, kohtaamisten ja ympäristömoduulien tarkistus.
4. Studion editorien ja turvallisen tallennuksen tarkistus.
5. Kiinteäsiemenisten testien ja buildin lähtötilan dokumentointi.

**Hyväksyntä:** kirjattu ominaisuusmatriisi (toimii / osittain / vain suunniteltu), todelliset testitulokset, neljä tärkeintä kehityskohdetta ja ehdotettu Sprintti 1. Ei koodimuutoksia tässä sprintissä.

### Sprintti 1: Combat Feel & Tactical Clarity (ehdollinen auditin jälkeen)
- Selkeä toiminnon kustannus- ja vaikutusesikatselu.
- Vuorojen ja animaatioiden sujuvuus ilman aikapainetta.
- Maaston, suojan ja objektien vaikutusten ymmärrettävä näyttäminen.
- Mana- ja synergiamerkintöjen luettavuus.

**Hyväksyntä:** testattava esimerkkitaistelu; käyttöliittymästä ymmärtää toiminnon kustannuksen ja tavoitteen; kiinteäsiemeniset regressiot läpäisevät.

### Sprintti 2: Buildcrafting Depth (ehdollinen)
- Tärkeimpien luokka/heimo/esine/reliikki-synergioiden auditointi.
- Yhdistelmävaikutusten näkyvyys.
- Manaan perustuvien rakennelmien monipuolistaminen.
- Rakennelmien kokeilu testitaistelussa.

**Hyväksyntä:** vähintään kolme erilaista strategista rakennelmaa läpäisee valitut testikohtaamiset eri tavoin; ei vahvistamatonta sisältömäärän kasvattamista.

### Sprintti 3: Fair AI & Varied Encounters (ehdollinen)
- Vihollisten erilaiset strategiset profiilit.
- Tavoitepohjaiset taktiset pulmat.
- Ympäristön hyödyntäminen molemmille osapuolille.
- AI:n päätösten ja reiluuden testaus.

**Hyväksyntä:** deterministiset vertailuskenaariot; ei todennettua sääntöjen ohittamista; useampi toimiva ratkaisustrategia.

### Sprintti 4: Studio Creation Workflow
- Object Makerin nykyisen toteutuksen viimeistely.
- Map Painterin olemassaolon ja integraatiotarpeen tarkistus.
- Hero Image Editor.
- Esikatselu, validointi ja hyväksyntä.

**Hyväksyntä:** uusi tai muokattu sisältö voidaan luoda, esikatsella, testata ja perua ilman pääkehityspuun muutoksia.

### Seuraavat kehitysaallot
- Hero progression (promootiot, varusteet, piirteet).
- Studio: Story Editor ja Seed Studio.
- Kotitukikohta, mutaatiot ja oudot tapahtumat.
- Sisällön laajennus, vaikeustason kalibrointi, QA, saavutettavuus ja suorituskyky.
- Erillinen Steam-raita: Tauri-paketointi, pelaajabuildin eristäminen, Steamworks, kauppasivu ja julkaisutestaus.

Sprinttien järjestystä muutetaan auditin löydösten perusteella. Ei perusteettomia viikkoarvioita ennen työmäärän mittaamista.

## 9. Sprintin hyväksymiskriteerit ja testit

- Sprintissä 3–5 rajattua ominaisuutta, kullekin 1–2 selkeää testitarkistusta.
- Jokaisesta muutoksesta kirjataan ennen/jälkeen-tilanne, näkyvä vaikutus ja riskit.
- Testit käyttävät kiinteää siementä aina kun mahdollista.
- Fairness-bottia käytetään vain suhteelliseen vertailuun, ei absoluuttisena laatumittarina.
- Uusi mekaniikka ei läpäise hyväksyntää ilman näkyvää palautetta.
- Tallennusten yhteensopivuus ja tärkeimmät vanhat toiminnot tarkistetaan.
- Väitteet testituloksista edellyttävät oikeasti ajettuja testejä ja niiden tuloksia.
- Marc hyväksyy suuret suunnanmuutokset ja pysyvät sisältömuutokset.

## 10. Git, tekoälykehitys ja resurssirajat

- AI-projektipäällikkö laatii tavoitteet, prioriteetit, hyväksyntäkriteerit ja arvioi raportit; Claude Code tekee toteutuksen.
- Työ tehdään erillisessä Git-worktreessä ja omassa haarassa; PR kohdistetaan development-haaraan.
- Pääworktreetä ei muokata suoraan; portin 5173 palvelin näkee yhdistetyt muutokset vasta päivityksen jälkeen.
- Squash-työnkulku perustuu oikeaan merge-baseen, ei automaattisesti viimeksi haettuun origin/development-kärkeen.
- Koneessa noin 14 Gt käytettävissä olevaa muistia: yksi raskas prosessi kerrallaan (Vite, Playwright tai agentti).
- Dokumentaatio luetaan ennen järjestelmän muutoksia.
- Toisen agentin raportteja ei hyväksytä tarkistamatta; tarkistus edellyttää lähdekoodia, diffejä, testilokeja tai toistettavaa näyttöä.
- Kehityksen tila on pidettävä näkyvänä: suunniteltu / toteutuksessa / testattavana / hyväksytty / julkaistu.

## 11. Steam-julkaisun hyväksyntäportti

- Erillinen asennettava Tauri-pelaajaversio toimii ilman Studioa ja kehittäjäoikeuksia.
- Rakennelmat, tallennukset, asetukset, saavutettavuus ja virhetilanteet toimivat vakaasti.
- Pelin ydinsilmukka on hauska ja ymmärrettävä pelitesteissä.
- Taistelujen vaikeus on reilu, sisältöä on riittävästi ja suorituskyky testattu kohdelaitteilla.
- Kaikella julkaistavalla kuvalla, musiikilla ja sisällöllä on tarvittavat käyttöoikeudet.
- Steamworks ja kauppasivu käsitellään erillisessä julkaisu-PRD:ssä.

## 12. Avoimet päätökset

1. Taistelukentän muutoksen voimakkuus (haastattelun 121 kysymys jätetty vastaamatta): ehdotus on vaihteleva monimutkaisuus, mutta ei lukittu.
2. Rakennelmien kehittymisen yksityiskohdat: käyttäjä ilmaisi niiden olevan vielä kehityksessä; ei lukita.
3. ~~Pelin kielisääntö~~ — **ratkaistu 19.10.2026:** englanti yksin, ei suomea ruudulla (ks. luku 3).
4. Todellinen toimivuus ja regressiotestien kattavuus: vaatii ajettavat testit varsinaisessa repositoriossa.
5. Ensimmäisen toteutussprintin tarkka sisältö: vahvistetaan Sprintti 0:n auditin perusteella.

## 13. Projektipäällikön päätös

Seuraava toimenpide: käynnistetään lukupohjainen Sprintti 0 -auditointi Claude Codella nykyisessä repositoriossa. Vasta tulosten tarkistamisen jälkeen annetaan rajattu toteutussprintti. Kaikessa kehityksessä etusijalla ovat hauskuus, buildcrafting, taktinen syvyys, reilu AI ja ympäristön interaktiivisuus — ei ominaisuusmäärän kasvattaminen itseisarvona.
