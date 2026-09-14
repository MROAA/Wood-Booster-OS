# Hearthwood — PRD: Movement & Tactical Gameplay

> **North star, not a work order.** Marc pasted this verbatim (2026-09-14), no
> round trigger attached — the same pattern as every other logged Hearthwood PRD
> (see [`hearthwood-turn-based-tactical-prd.md`](hearthwood-turn-based-tactical-prd.md)
> for the parent document this deepens). It's a movement-and-terrain-focused expansion
> of the same "Turn-Based Tactical Roguelite RPG" vision: Zone of Control, facing,
> momentum, terrain affinity, formation movement, and a new `Tempo` resource — none of
> it built yet. The isolated tactics prototype (`/heartwood-tactics`,
> `tacticsEngine.js`) as of PR #466 has a 7x10 grid, AP + Move + Attack + one ability per
> unit, and no facing/terrain/Zone of Control/Tempo system at all. Logged here verbatim,
> no code change attempted.

## Genre

**Turn-Based Tactical Roguelite RPG**

Yhdistelmä:

* Slay the Spire -tyylinen roguelite-reitti ja tapahtumat
* Guildrun-tyylinen joukkueen rakentaminen ja taktinen taistelu
* Hearthstone-tyylinen selkeä käyttöliittymä ja korttimainen kykyjen esitystapa
* Magic: The Gathering -henkinen olentojen ja maailman visuaalinen rikkaus
* Hearthwoodin oma metsämytologia, vuodenajat ja elävä ympäristö

---

# 1. Pelin ydinajatus

Hearthwoodissa pelaaja johtaa pientä metsän henkien, eläinten, vartijoiden ja muiden olentojen ryhmää.

Pelaaja ei vain valitse hyökkäystä.

Pelaaja päättää:

* kuka liikkuu
* mihin ruutuun liikutaan
* kuka suojaa ketä
* mistä suunnasta vihollista lähestytään
* milloin käytetään toimintapisteet
* milloin odotetaan
* milloin vetäydytään
* milloin käytetään maastoa hyväksi
* milloin rikotaan muodostelma
* milloin riskeerataan yksi yksikkö suuremman tavoitteen saavuttamiseksi

## Pelin keskeinen sääntö

> Sijainti on resurssi.

Hyvä yksikkö väärässä paikassa voi olla hyödytön.

Keskinkertainen yksikkö oikeassa paikassa voi ratkaista taistelun.

---

# 2. Taistelun perusmalli

Jokainen taistelu tapahtuu taktisesti ja vuoropohjaisesti.

## Taistelun vaiheet

1. Scouttaus
2. Taistelukentän analysointi
3. Joukkueen sijoittaminen
4. Aloitejärjestyksen muodostaminen
5. Pelaajan toimintavuoro
6. Reaktiot ja vastareaktiot
7. Vihollisen toimintavuoro
8. Maaston ja ympäristön päivitys
9. Uusi kierros
10. Voitto, tappio tai tavoitteen ratkaisu

## Yksikön vuoro

Yhdellä yksiköllä on normaalisti:

* 2 Action Pointia eli AP:tä
* Movement Point -arvo
* mahdolliset reaktiot
* mahdolliset vapaat toiminnot
* mahdolliset tilavaikutukset

Esimerkkejä:

| Toiminto          |  AP-kustannus |
| ----------------- | ------------: |
| Lyhyt liike       |          1 AP |
| Pitkä liike       |          2 AP |
| Normaali hyökkäys |          1 AP |
| Vahva hyökkäys    |          2 AP |
| Puolustusasento   |          1 AP |
| Kyky              |        1–2 AP |
| Esineen käyttö    |          1 AP |
| Vuoron lopetus    |          0 AP |
| Reaktio           | Reaktiopaikka |

---

# 3. Liikkumisen perusjärjestelmä

## 3.1 Ruutupohjainen taistelukenttä

Taistelukenttä koostuu ruuduista.

Ruutujen tyypit voivat olla:

* metsä
* polku
* kallio
* suo
* jää
* juurakko
* vesi
* korkea ruoho
* pyhä alue
* palava alue
* myrkyllinen alue
* pimeä alue
* raunio
* silta
* korkeusero
* tuulen tai virran vaikutusalue

Ruutu ei ole vain tyhjä tila.

Jokaisella ruudulla voi olla:

* liikkumiskustannus
* näkyvyysarvo
* suoja-arvo
* korkeustaso
* statusvaikutus
* maastosynergia
* kulkusuunta
* erityinen tapahtuma

---

## 3.2 Liikkumispisteet

Jokaisella yksiköllä on Movement Profile.

Esimerkiksi:

```json
{
  "movement": 4,
  "movementType": "ground",
  "movementCost": {
    "forest": 1,
    "mud": 2,
    "ice": 1,
    "rock": 3,
    "water": 999
  }
}
```

Yksikkö, jolla on Movement 4, voi liikkua yhden vuoron aikana enintään neljän liikkumispisteen verran.

Esimerkki:

* Polku: 1 piste
* Metsä: 1 piste
* Mutainen suo: 2 pistettä
* Kallio: 3 pistettä
* Vesi: ei kuljettavissa ilman erityiskykyä

Tämä tekee reitin valinnasta merkityksellisen.

---

# 4. Liikkumisen uudet mekaniikat

## 4.1 Momentum-liike

Yksikkö voi saada lisäarvoa, jos se liikkuu ennen hyökkäystä.

### Esimerkki

Striker:

* liikkuu vähintään 2 ruutua
* saa seuraavaan lähitaisteluhyökkäykseen +20 % vahinkoa
* voi työntää vihollista yhden ruudun

### Momentum-tyypit

* Charge Momentum
* Escape Momentum
* Hunting Momentum
* Falling Momentum
* Elemental Momentum

### Riskit

Jos yksikkö käyttää kaiken liikkeensä hyökkäykseen:

* se voi jäädä ilman suojaa
* vihollinen voi ympäröidä sen
* parantaja ei ehkä enää yllä siihen
* yksikkö voi päätyä vihollisen vastahyökkäyksen alueelle

---

## 4.2 Facing eli suuntautuminen

Yksikkö ei aina puolustaudu joka suunnasta yhtä tehokkaasti.

Yksiköllä on suunta:

* pohjoinen
* etelä
* itä
* länsi

Tai kahdeksan suuntaa:

* pohjoinen
* koillinen
* itä
* kaakko
* etelä
* lounas
* länsi
* luode

### Suuntavaikutukset

Hyökkäys edestä:

* normaali vahinko

Hyökkäys sivusta:

* +10 % vahinkoa
* mahdollisuus heikentää suojaa

Hyökkäys takaa:

* +25 % vahinkoa
* mahdollisuus kriittiseen osumaan
* puolustajan reaktioiden heikennys

### Luokat, jotka hyötyvät suunnasta

* Assassin
* Duelist
* Ranger
* Striker
* Hunter
* Saboteur

### Luokat, jotka vastustavat suuntahyökkäyksiä

* Guardian
* Sentinel
* Warden
* Juggernaut

---

## 4.3 Zone of Control

Lähitaisteluyksiköt hallitsevat ympärillään olevia ruutuja.

Jos yksikkö astuu vihollisen Zone of Control -alueelle:

* liike voi pysähtyä
* yksikkö voi joutua reaktiohyökkäyksen kohteeksi
* poistuminen voi maksaa lisä-AP:tä
* vihollinen voi käyttää Intercept-reaktiota

### Zone of Control -tyypit

#### Basic Zone

Hallitsee viereisiä ruutuja.

#### Threat Zone

Hallitsee suurempaa aluetta ja voi estää etenemistä.

#### Thorn Zone

Aiheuttaa vahinkoa tai Root-tilan.

#### Frost Zone

Hidastaa poistuvia yksiköitä.

#### Fear Zone

Heikentää yksiköitä, jotka yrittävät lähestyä.

---

## 4.4 Reaktioliike

Yksikkö voi liikkua vihollisen vuorolla reaktiona.

Esimerkkejä:

### Sidestep

Kun vihollinen käyttää kaukohyökkäystä:

* yksikkö liikkuu yhden ruudun sivuun
* kuluttaa Reaction Slotin
* voi välttää hyökkäyksen

### Intercept

Kun liittolainen joutuu hyökkäyksen kohteeksi:

* Guardian siirtyy liittolaisen eteen
* ottaa osan vahingosta
* muodostaa uuden suojalinjan

### Retreat Step

Kun yksikkö menettää tietyn määrän HP:tä:

* se voi liikkua yhden ruudun taakse
* vain kerran kierroksessa
* ei toimi Root- tai Stun-tilassa

### Spirit Shift

Spiritwalker voi vaihtaa paikkaa lähellä olevan hengen kanssa.

---

## 4.5 Ketjuliike

Jotkut kyvyt mahdollistavat useamman yksikön liikkumisen samassa vuorossa.

### Esimerkki: Commander — Formation Shift

* valitse kolme liittolaista
* siirrä jokaista yhden ruudun
* yksiköt eivät laukaise normaaleja Zone of Control -reaktioita
* Formation-bonus aktivoituu

### Esimerkki: Rootweaver — Vine Bridge

* luo juurisilta kahden ruudun välille
* liittolaiset voivat ylittää esteen
* viholliset eivät voi käyttää samaa reittiä
* silta kestää kolme kierrosta

---

## 4.6 Liike ja korkeuserot

Taistelukentällä voi olla korkeuseroja.

### Korkeammalta hyökkääminen

* +10 % kaukohyökkäyksen vahinkoa
* parempi näkyvyys
* parempi mahdollisuus osua
* vihollinen voi olla vaikeampi havaita korkealta

### Alhaalta hyökkääminen

* lähitaisteluhyökkäys voi maksaa enemmän
* hyökkäys voi epäonnistua jyrkänteen yli
* vihollisen työntäminen voi aiheuttaa putoamisen

### Korkeuserojen erikoistuminen

* Ranger: hyötyy korkeasta maastosta
* Artillery: saa paremman kantaman
* Scout: näkee laajemmalle
* Juggernaut: voi kaataa vihollisia alas
* Engineer: voi rakentaa siltoja ja tasanteita

---

## 4.7 Putoaminen ja työntäminen

Pelaaja voi käyttää ympäristöä vahinkoon.

### Työntämisen kohteita

* vihollinen pois suojasta
* vihollinen ansaan
* vihollinen tuleen
* vihollinen myrkkyalueelle
* vihollinen toisen vihollisen päälle
* vihollinen alas jyrkänteeltä
* vihollinen pois tavoitteelta

### Putoamisen seuraukset

* suora vahinko
* Stun
* Broken Armor
* sijainnin vaihtuminen
* mahdollinen kuolema

Putoaminen ei saa olla liian yleistä, jotta se ei muutu halpaksi automaattiseksi ratkaisuksi.

---

## 4.8 Piiloliike ja näkyvyys

Kaikki yksiköt eivät ole aina näkyvissä.

Näkyvyyteen vaikuttavat:

* metsän tiheys
* korkea ruoho
* sumu
* pimeys
* seinät
* korkeuserot
* taikavaikutukset
* vihollisen Scout-arvo

### Piilotetun yksikön säännöt

Piilotettu yksikkö:

* ei näy viholliselle normaalisti
* ei voi käyttää kaikkia hyökkäyksiä
* paljastuu hyökätessään
* voi tehdä Ambush-hyökkäyksen
* voi liikkua erityisreittejä pitkin

### Luokat

* Scout
* Assassin
* Saboteur
* Ranger
* Spiritwalker

---

## 4.9 Terrain Affinity

Jokaisella heimolla ja luokalla voi olla maastoihin liittyviä etuja.

### ROOTBORN

Hyötyy:

* metsästä
* juurakosta
* pyhistä alueista

Vaikutukset:

* +1 Armor metsässä
* Regrowth vahvistuu
* ei kärsi Root-esteistä yhtä helposti

### MOSSKIN

Hyötyy:

* kosteudesta
* korkeasta ruohosta
* sienialueista

Vaikutukset:

* parempi piiloutuminen
* nopeampi liike metsässä
* voi käyttää pieniä käytäviä

### WILDCLAW

Hyötyy:

* avoimesta maastosta
* korkeuseroista
* metsästysalueista

Vaikutukset:

* Momentum
* parempi Charge
* parempi takaa-ajo

### MYCELIAN

Hyötyy:

* rappeutuneesta maastosta
* myrkystä
* kuolleista ruuduista

Vaikutukset:

* voi levittää Decay-alueita
* voi kulkea myrkyn läpi
* voi käyttää kaatuneita yksiköitä resurssina

### SUNWARDEN

Hyötyy:

* avoimesta valosta
* pyhistä alueista
* korkeasta maastosta

Vaikutukset:

* parempi näkyvyys
* vahvemmat suojat
* puhdistuskyvyt vahvistuvat

### FROSTROOT

Hyötyy:

* jäästä
* lumesta
* kylmistä alueista

Vaikutukset:

* ei kärsi Ice-liikkeen hidastuksesta
* voi luoda jääsiltoja
* voi jäädyttää ruutuja

### FENBORN

Hyötyy:

* suosta
* pimeydestä
* myrkkyalueista

Vaikutukset:

* parempi liike suolla
* myrkky ei vahingoita yhtä paljon
* saa voimaa vaarallisista ruuduista

### ASHEN

Hyötyy:

* palaneesta maastosta
* tuhoutuneista alueista
* tulesta

Vaikutukset:

* Burn-vahinko vahvistuu
* voi kulkea tulen läpi lyhyesti
* voi muuttaa maastoa tuhkaksi

---

# 5. Uusi liikkumiseen perustuva resurssi: Tempo

Hearthwoodiin lisätään resurssi nimeltä **Tempo**.

Tempo kuvaa sitä, kuinka hyvin pelaaja hallitsee taistelun rytmiä.

## Tempo kasvaa, kun:

* yksikkö liikkuu oikeaan aikaan
* vihollisen hyökkäys vältetään
* vihollinen pakotetaan vaihtamaan kohdetta
* pelaaja saa korkeuseroedun
* vihollinen joutuu huonoon maastoon
* pelaaja suorittaa onnistuneen ketjureaktion
* tavoite saavutetaan ennen vihollista

## Tempo laskee, kun:

* yksikkö jää ympäröidyksi
* pelaaja käyttää liikkeen tehottomasti
* vihollinen saa yllätyshyökkäyksen
* pelaaja menettää korkeuseron
* yksikkö joutuu eroon muodostelmasta
* pelaaja menettää kierroksen ilman tarkoitusta

## Tempon käyttötapoja

* ylimääräinen yhden ruudun liike
* reaktion palauttaminen
* nopea Formation Shift
* kyvyn AP-kustannuksen vähentäminen
* liikkeen muuttaminen hyökkäykseksi
* vuoron aloittaminen aikaisemmin
* vihollisen toimintajärjestyksen häiritseminen

Tempo tekee liikkumisesta aktiivisen strategisen resurssin.

---

# 6. Liiketyypit

## 6.1 Normal Move

Tavallinen liike.

* turvallinen
* ennustettava
* käyttää Movement-arvoa

## 6.2 Dash

Nopea liike.

* siirtyy useita ruutuja
* voi ohittaa liittolaisia
* ei voi ohittaa vihollisia ilman erityiskykyä
* voi laukaista Overwatchin

## 6.3 Charge

Liike kohti vihollista ja hyökkäys samassa toiminnossa.

* vaatii vähimmäisetäisyyden
* antaa Momentum-bonuksen
* voi aiheuttaa Stagger-tilan
* epäonnistuu, jos reitti katkeaa

## 6.4 Retreat

Liike pois vihollisen läheisyydestä.

* voi maksaa ylimääräisen AP:n Zone of Control -alueella
* tietyt luokat voivat käyttää sitä ilmaiseksi
* voi antaa Haste- tai Evasion-bonuksen

## 6.5 Blink

Lyhyt teleportaatio.

* ohittaa maaston
* ei aina ohita näkymättömiä esteitä
* voi olla rajoitettu latauksiin
* voi jättää jälkeensä Spirit- tai Arcane-alueen

## 6.6 Burrow

Maan tai juurakon läpi liikkuminen.

* ei näy normaalisti
* ei voi hyökätä liikkeen aikana
* voi nousta esiin vihollisen vieressä
* vastustettavissa Reveal-kyvyillä

## 6.7 Climb

Korkeuseron ylittäminen.

* vaatii erityiskyvyn tai lisäliikettä
* mahdollistaa korkeuserojen hyödyntämisen
* voi tehdä yksiköstä haavoittuvan nousun aikana

## 6.8 Swim / Float

Vesiliike.

* vain tietyille yksiköille
* voi ohittaa siltoja
* voi kärsiä sähköstä, jäästä tai myrkystä
* avaa vaihtoehtoisia reittejä

## 6.9 Phase Move

Henkien ja aineettomien olentojen liike.

* kulkee seinien tai esteiden läpi
* ei voi päättää vuoroa kaikilla ruuduilla
* voi olla heikko fyysisille hyökkäyksille
* kuluttaa Spirit Energyä

---

# 7. Formation-liikkuminen

Pelaaja voi hallita yksiköitä yksittäin tai muodostelmana.

## Formation Modes

### Line

Yksiköt rivissä.

Hyödyt:

* hyvä etenemiseen
* hyvä suojaamiseen
* selkeä etulinja

Heikkoudet:

* haavoittuva sivuhyökkäyksille
* vaikea kääntää nopeasti

### Wedge

Kiilamuodostelma.

Hyödyt:

* hyvä Chargeen
* keskitetty hyökkäys
* voi murtaa vihollislinjan

Heikkoudet:

* sivut heikot
* takalinja voi jäädä ilman suojaa

### Circle

Ympyrämuodostelma.

Hyödyt:

* hyvä puolustamiseen
* suojaa keskellä olevia yksiköitä
* hyvä escort-tehtäviin

Heikkoudet:

* hidas
* heikko etenemisessä

### Spread

Hajautettu muodostelma.

Hyödyt:

* vastustaa aluevahinkoa
* hyvä kaukoyksiköille
* vaikeampi ympäröidä

Heikkoudet:

* heikko parantamiseen
* heikko Commander-synergioihin
* vaikea suojata kaikkia

### Ambush

Piilotettu muodostelma.

Hyödyt:

* yllätyshyökkäys
* parempi ensimmäinen kierros
* hyvä metsässä ja pimeydessä

Heikkoudet:

* vaatii sopivan maaston
* epäonnistuu Reveal-kykyjä vastaan

---

# 8. Tavoitepohjaiset taistelut

Kaikki taistelut eivät pääty kaikkien vihollisten tappamiseen.

## Tavoitetyypit

* Eliminoi vihollisjohtaja
* Suojaa metsän henkeä
* Saata hahmo ulos alueelta
* Pidä pyhä ruutu hallussa
* Kerää kolme Memory Fragmentia
* Selviydy tietty määrä kierroksia
* Estä vihollista saavuttamasta porttia
* Pelasta vangittu yksikkö
* Tuhoa kolme rituaalipylvästä
* Pakene ennen metsän palamista
* Saavuta korkea maasto ja lähetä signaali
* Pidä kaksi aluetta samanaikaisesti

## Miksi tämä on tärkeää?

Liikkuminen saa merkityksen.

Jos tavoite on vain tappaa kaikki, paras strategia on usein vahingoittaa vihollista mahdollisimman paljon.

Tavoitteet pakottavat pelaajan:

* liikkumaan
* jakamaan joukkueen
* ottamaan riskejä
* suojaamaan heikkoja yksiköitä
* käyttämään reittejä
* kontrolloimaan aluetta

---

# 9. Maaston muuttaminen

Hearthwoodin maasto ei ole staattinen.

Yksiköt voivat muuttaa taistelukenttää.

## Maaston muutoskykyjä

* Create Thorn Wall
* Burn Forest
* Freeze Water
* Grow Roots
* Spread Mushroom
* Create Fog
* Purify Corruption
* Raise Earth
* Break Rock
* Create Bridge
* Flood Area
* Create Sacred Ground
* Corrupt Ground
* Extinguish Fire

## Esimerkki

Ashen-yksikkö polttaa metsäruudun.

Seuraukset:

1. Metsä muuttuu palaneeksi maastoksi.
2. Rootborn menettää suojabonuksen.
3. Ashen saa Burn-synergiansa.
4. Näkyvyys paranee.
5. Myöhemmin ruutu voi muuttua tuhkamaaksi.
6. Mycelian voi käyttää tuhkaa Decay-alueen luomiseen.

Yksi liike tai kyky voi siis vaikuttaa koko taistelun tuleviin kierroksiin.

---

# 10. Liikkumisen ja luokkien yhteys

## Guardian

* liikkuu hitaasti
* hallitsee aluetta
* voi Intercept-liikkua
* voi lukita vihollisia Zone of Control -alueelle
* saa bonuksia, jos ei liiku vuoronsa aikana

## Warden

* luo puolustusalueita
* muuttaa maastoa
* vahvistuu omalla alueellaan
* voi rakentaa juuriseiniä

## Juggernaut

* liikkuu hitaasti
* saa voimaa suorasta etenemisestä
* voi rikkoa esteitä
* voi työntää vihollisia
* ei pysähdy helposti

## Striker

* hyötyy kahden ruudun liikkeestä
* voi yhdistää liikkeen hyökkäykseen
* saa Momentum-bonuksia
* menettää voimaa, jos jää paikalleen

## Assassin

* tarvitsee sivu- tai taka-aseman
* voi käyttää Shadow Step -liikettä
* voi poistua hyökkäyksen jälkeen
* on heikko avoimella alueella

## Ranger

* hyötyy korkeudesta
* haluaa pitkän näkyvyyslinjan
* voi ampua ja vetäytyä
* saa bonuksia, jos vihollinen liikkuu avoimelle alueelle

## Controller

* ei välttämättä tee suurinta vahinkoa
* hallitsee ruutuja
* pakottaa viholliset kiertämään
* luo hidastavia ja estäviä alueita

## Healer

* tarvitsee hyvän sijainnin
* ei saa jäädä etulinjaan
* voi liikkua liittolaisen lähelle ja parantaa samassa vuorossa
* saa bonuksia, jos joukkue pysyy muodostelmassa

## Commander

* liikuttaa muita yksiköitä
* muuttaa Formationia
* antaa ylimääräisiä reaktioita
* voi korjata huonon sijoittumisen

## Summoner

* käyttää kutsuttuja olentoja kulkuesteinä
* voi täyttää tyhjiä ruutuja
* luo tilapäisiä siltoja ja suojia
* hallitsee tilaa määrän kautta

## Spiritwalker

* voi kulkea esteiden läpi
* vaihtaa paikkaa liittolaisen kanssa
* toimii pelastus- ja tiedusteluyksikkönä
* on haavoittuva, jos Spirit Energy loppuu

---

# 11. Vihollisten liikkuminen

Viholliset eivät saa olla vain yksiköitä, jotka kävelevät pelaajaa kohti.

Jokaisella vihollisella on taktinen tavoite.

## Vihollisen AI-roolit

### Hunter

* etsii heikoimman yksikön
* kiertää etulinjan
* käyttää maastoa

### Guardian Enemy

* suojaa johtajaa
* pitää chokepointin
* ei jahtaa turhaan

### Ambusher

* piiloutuu
* odottaa pelaajan lähestymistä
* hyökkää takaapäin

### Controller Enemy

* yrittää jakaa joukkueen
* luo esteitä
* sulkee pakoreittejä

### Ritualist Enemy

* pysyy rituaalialueella
* tarvitsee suojaa
* muuttaa taistelukenttää kierros kierrokselta

### Fleeing Enemy

* yrittää paeta
* pelaajan täytyy estää reitti
* tappaminen ei aina ole paras ratkaisu

## Enemy Intent

Jokaisen vihollisen suunniteltu toiminto näytetään pelaajalle mahdollisuuksien mukaan.

Esimerkkejä:

* hyökkää Guardiania vastaan
* liikkuu pyhälle ruudulle
* käyttää rituaalia
* pakenee
* kutsuu vahvistuksia
* tuhoaa sillan
* polttaa metsää

Pelaaja pystyy reagoimaan ennakoitavaan uhkaan.

---

# 12. Vuoron suunnittelu ja samanaikainen komento

Hearthwood voi käyttää kahta eri pelitapaa.

## Mode A — Sequential Turn

Yksi yksikkö toimii kerrallaan.

1. Pelaaja valitsee yksikön.
2. Pelaaja käyttää AP:t.
3. Vuoro päättyy.
4. Seuraava yksikkö toimii.

Hyödyt:

* selkeä
* helppo oppia
* hyvä MVP:lle

## Mode B — Planning Phase

Pelaaja suunnittelee useiden yksiköiden toiminnot ensin.

Esimerkiksi:

* Guardian liikkuu eteen
* Ranger tähtää
* Healer valmistautuu parantamaan
* Assassin siirtyy vihollisen taakse

Sen jälkeen komennot ratkaistaan aloitejärjestyksessä.

Hyödyt:

* enemmän strategista syvyyttä
* parempi joukkueen koordinointi
* kiinnostavat ketjureaktiot

Riskit:

* vaikeampi toteuttaa
* vaikeampi ymmärtää
* vaatii hyvän käyttöliittymän

## Suositus

MVP käyttää Sequential Turn -mallia.

Planning Phase voidaan lisätä myöhemmin erillisenä vaikeampana pelitilana.

---

# 13. Liikkumisen tilavaikutukset

## Root

* ei voi liikkua
* voi käyttää paikallisia kykyjä
* voidaan poistaa puhdistuksella tai vahingoittamalla juuria

## Slow

* Movement-arvo -1
* Dash voi muuttua normaaliksi liikkeeksi

## Freeze

* ei liikkumista
* seuraava osuma voi aiheuttaa Shatterin

## Haste

* +1 Movement
* ensimmäinen liike ei maksa AP:tä kerran kierroksessa

## Heavy

* ei voi käyttää Dashia
* vastustaa työntämistä
* ei saa Momentum-bonuksia

## Phase

* voi kulkea esteiden läpi
* ei voi hallita Zone of Control -aluetta normaalisti

## Marked

* viholliset voivat nähdä yksikön piilosta
* hyökkäykset sitä vastaan saavat bonuksen

## Disoriented

* Facing vaihtuu satunnaisesti tai rajoitetusti
* sivu- ja takaosumat helpottuvat

---

# 14. Roguelite-kartta ja liikkuminen maailman tasolla

Taistelukentän liikkuminen ja maailmankartan liikkuminen ovat kaksi eri järjestelmää.

## Maailmankartan valinnat

Pelaaja valitsee reitin:

* turvallinen metsäpolku
* vaarallinen luola
* vanha pyhäkkö
* markkinapaikka
* metsästäjän leiri
* korruptoitunut alue
* muinainen Kalevala-henkinen rauniopaikka
* muistojen lähde
* boss-alue

## Reittivalintaan vaikuttavat

* joukkueen kunto
* ruoan määrä
* Forest Mood
* käytettävissä oleva aika
* aktiiviset tehtävät
* valittu biome
* vihollisen uhka
* pelaajan aiempi maine

## Maailmankartan liikkumisen erityisidea

Pelaaja ei näe koko karttaa.

Scouttaus avaa:

* uusia reittejä
* piilotettuja tapahtumia
* vihollispartioita
* harvinaisia resursseja
* vaihtoehtoisia boss-kohtaamisia

---

# 15. Forest Mood ja liikkuminen

Metsän mieliala vaikuttaa siihen, miten maailma käyttäytyy.

## Calm Forest

* enemmän turvallisia reittejä
* parempi parantuminen
* vähemmän väijytyksiä
* Rootborn-synergiat vahvistuvat

## Suspicious Forest

* enemmän piilovihollisia
* reitit voivat muuttua
* Scouttaus korostuu
* viholliset käyttävät ansoja

## Angry Forest

* tuli leviää
* maasto muuttuu
* viholliset saavat aggressiivisia kykyjä
* Ashen ja Fenborn vahvistuvat

## Mourning Forest

* kuolleet yksiköt vaikuttavat maailmaan
* Memory Fragmentit lisääntyvät
* Spiritwalker ja Mycelian saavat uusia vaihtoehtoja
* tapahtumat muuttuvat surullisemmiksi ja vaarallisemmiksi

---

# 16. Hearthwoodin tärkein pelattava päätös

Jokaisessa vuorossa pelaajan pitäisi joutua valitsemaan vähintään kahden hyvän vaihtoehdon välillä.

Esimerkiksi:

### Vaihtoehto A

Guardian liikkuu suojaamaan Healeria.

Seuraukset:

* Healer pysyy turvassa
* Guardian ei hyökkää
* vihollinen saa aikaa valmistautua

### Vaihtoehto B

Guardian hyökkää vihollisen kimppuun.

Seuraukset:

* vihollinen menettää HP:tä
* Healer jää suojaamatta
* pelaaja voi voittaa nopeammin

### Vaihtoehto C

Guardian käyttää Intercept-reaktion säästämistä.

Seuraukset:

* Guardian ei tee nyt mitään
* mutta voi estää vihollisen seuraavan hyökkäyksen

Tämä on Hearthwoodin taktinen ydin.

---

# 17. MVP:n liikkumisjärjestelmä

Ensimmäiseen pelattavaan versioon tarvitaan vain seuraavat ominaisuudet:

## Pakolliset

* ruutupohjainen kenttä
* 4–6 yksikön joukkue
* Movement-arvo
* AP-järjestelmä
* esteet
* Zone of Control
* perusreaktiohyökkäys
* liike ja hyökkäys samassa vuorossa
* korkeusero tai suoja
* vähintään kolme maastotyyppiä
* vihollisen telegraph
* voitto- ja tappiotavoitteet

## MVP:n maastot

1. Polku
2. Metsä
3. Kallio
4. Vesi
5. Myrkkyalue
6. Pyhä alue

## MVP:n liiketyypit

1. Normal Move
2. Dash
3. Charge
4. Retreat
5. Intercept

## MVP:n luokat

1. Guardian
2. Striker
3. Ranger
4. Healer
5. Controller
6. Assassin

---

# 18. Engine-ready Movement Model

```json
{
  "unitId": "guardian_01",
  "position": {
    "x": 4,
    "y": 6
  },
  "facing": "north",
  "movement": {
    "movementPoints": 4,
    "remainingMovementPoints": 4,
    "movementType": "ground",
    "canDash": false,
    "canCharge": true,
    "canRetreat": true
  },
  "actionPoints": {
    "current": 2,
    "maximum": 2
  },
  "reactions": {
    "reactionSlots": 1,
    "available": [
      "intercept",
      "guard_reaction"
    ]
  },
  "zones": {
    "zoneOfControlRadius": 1,
    "zoneType": "protective"
  },
  "terrainAffinity": [
    "forest",
    "sacred_ground",
    "roots"
  ],
  "statusEffects": []
}
```

---

# 19. Movement Action Model

```json
{
  "actionId": "move_001",
  "actorId": "guardian_01",
  "actionType": "MOVE",
  "from": {
    "x": 4,
    "y": 6
  },
  "to": {
    "x": 4,
    "y": 5
  },
  "movementCost": 1,
  "apCost": 0,
  "requiresLineOfSight": false,
  "triggers": [
    "enemy_zone_of_control_check",
    "terrain_entered",
    "formation_updated"
  ],
  "telegraph": {
    "visible": true,
    "pathPreview": true
  }
}
```

---

# 20. Movement Resolver

Liikkumisjärjestelmän tulee ratkaista seuraavat asiat tässä järjestyksessä:

1. Onko kohderuutu olemassa?
2. Onko kohderuutu vapaa?
3. Onko reitti kuljettavissa?
4. Onko Movement-arvo riittävä?
5. Onko yksikkö Root-, Freeze- tai Stun-tilassa?
6. Onko Zone of Control -alueella reaktioita?
7. Laukeaako Overwatch?
8. Muuttuuko maasto?
9. Päivitetäänkö Facing?
10. Päivitetäänkö Formation?
11. Laukeaako liikkeeseen liittyvä passiivinen kyky?
12. Päivitetäänkö taisteluloki?

---

# 21. Acceptance Criteria

Hearthwoodin liikkumisjärjestelmä hyväksytään MVP:hen, kun:

* pelaaja voi valita yksikön
* pelaaja näkee sallitut liikeruudut
* pelaaja näkee liikkeen kustannuksen
* pelaaja näkee vihollisen hallitsemat ruudut
* pelaaja voi peruuttaa suunnitellun liikkeen ennen vahvistamista
* liike ei voi kulkea esteiden läpi ilman kykyä
* liike voi laukaista vihollisen reaktion
* liike päivittää yksikön suunnan
* liike vaikuttaa maastoon
* liike näkyy Combat Logissa
* AI osaa liikkua tavoitteellisesti
* pelaaja voi voittaa taistelun ilman kaikkien vihollisten tappamista
* kaikki liikkeet voidaan toistaa deterministisesti Seed-arvon avulla
* käyttöliittymä näyttää selkeästi AP:n, Movementin, reaktiot ja vaaralliset ruudut

---

# 22. Hearthwoodin pelattava identiteetti

Hearthwood ei ole peli, jossa pelaaja vain optimoi suurimman vahingon.

Se on peli, jossa pelaaja:

* lukee taistelukenttää
* ennakoi vihollisen aikomuksia
* käyttää metsää hyväkseen
* rakentaa joukkueen rooleista
* liikuttaa yksiköitä tarkoituksella
* tekee uhrauksia
* suojaa muistoja
* muuttaa maastoa
* päättää, milloin taistellaan ja milloin paetaan

## Lopullinen pelifilosofia

> Älä kysy vain: "Kuka tekee eniten vahinkoa?"
>
> Kysy: "Missä minun täytyy olla, jotta seuraava vuoro olisi minun?"
