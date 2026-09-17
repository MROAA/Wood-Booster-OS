> **Status: north-star vision, not a work order — logged verbatim, no
> code change.** Marc pasted this in full (2026-09-17), no "jatketaan"
> trigger — the same bare-paste pattern as every other full PRD logged
> in this repo (Class System, Enemy Ecosystem, Progressive Challenge,
> the original Visual/UI shell doc below, ...). Delivered here as a
> docs-only PR, exactly that precedent's own discipline.
>
> **How this relates to the doc already on file with a similar name**
> (`docs/hearthwood-visual-ui-prd.md`, pasted 2026-09-09): that one is a
> broad aesthetic + information-architecture doc — clarity-first visual
> hierarchy, master layout, per-screen specs, a data-driven/event-driven
> presentation-layer architecture (`GameUI/`, a visual event bus,
> logic/presentation separation) — written for the era before the
> Hearthwood Frontier tactics engine existed, and deliberately silent on
> *what rendering technology* draws a unit on screen. **This new PRD is
> the specific, technical answer to that silence**: an actual pixel-art
> spec — a fixed internal render resolution (320×180), nearest-neighbor
> pixel-perfect scaling, sprite-sheet frame sizes, a 16px tileset, a
> named 8-colour palette, and a concrete `assetRegistry.js` /
> `animationRegistry.js` data format. The two documents don't conflict;
> this one is one layer more concrete than the other, on the same
> "clarity first, data-driven presentation, logic never coupled to
> visuals" foundation §24-27 of this PRD state directly.
>
> **What this PRD's own `battle/` component list clearly targets:** its
> named components (`TacticalGrid`, `UnitSprite`, `MovementPreview`,
> `ReactionIndicator`, `EnemyIntent`, `InitiativeBar`, `AbilityBar` with
> AP-cost pips) map one-to-one onto concepts the **Hearthwood Frontier**
> turn-based tactics engine (`tacticsEngine.js`, `/heartwood-tactics`,
> `docs/hearthwood-turn-based-tactical-prd.md`) already ships today —
> Action Points, per-unit reactions (Guardian's Intercept, and now
> Fear/Frost/Thorn Zones), enemy-intent telegraphs, initiative/turn
> order, terrain. This PRD is not describing the older auto-battler
> (which has no grid, no AP, no reactions) — it's a pixel-art re-skin
> proposal for the *tactics board specifically*.
>
> **The real gap between this PRD and what's shipping today.** Both the
> live auto-battler and the Hearthwood Frontier tactics board currently
> render through styled DOM/CSS — real photographic/painted unit
> portrait *images* (`units.js`/`enemies.js`'s own `image: xxxImg`
> fields, ~90 of them already authored) on card-shaped or token-shaped
> HTML elements, plain CSS colour/gradient terrain tiles, and Unicode-
> glyph status badges (➤ ⏳ ⚡ ▲ ☾ ☠, the "no new icon asset" precedent
> named throughout the Frontier build log) — never a pixel sprite, never
> a tile atlas, never a fixed low-res canvas. Adopting this PRD literally
> means a genuinely new rendering pipeline (canvas or sprite-sheet-based,
> pixel-perfect integer scaling) *and* a full new art production pipeline
> (sprite sheets with named animation frame ranges per unit/enemy, 16px
> tilesets per terrain type, ~20-30 ability icons, 10-15 status icons,
> particle/burst effects) — comparable in scope to the Frontier
> tactics-engine pivot itself, just on the art/rendering side instead of
> the combat-logic side.
>
> **Why that's not a blocker to logging it as-is.** The PRD's own §31
> Acceptance Criteria states its own intended boundary directly:
> *"placeholder-grafiikat voidaan vaihtaa ilman pelilogiikan
> muuttamista"* (placeholder graphics can be swapped without changing
> game logic) — this is explicitly meant as a swappable *presentation*
> layer, not a combat-logic rewrite, and its own §29 production pipeline
> (Style Bible → Graybox → Visual Prototype → Production Assets → Visual
> QA) already prescribes exactly the same "build it in isolation, prove
> it small before going wide" discipline that shaped the Frontier
> engine's own Phase 1 prototype. That makes this the kind of large PRD
> that gets delivered *incrementally*, one round at a time, like every
> other Hearthwood PRD — not one requiring an immediate architecture
> decision the way the tactics-engine pivot itself did (that one asked
> to REPLACE the live auto-battler outright; this one asks to eventually
> reskin a rendering surface, never touching what any of it *does*).
>
> No implementation attempted this round. Full PRD verbatim below.

---

# HEARTHWOOD

## Pixel Graphics & Visual UI PRD

**Version:** 1.0
**Status:** Visual Direction & UI Specification
**Genre:** Turn-Based Tactical Roguelite RPG
**Visual Style:** Premium Pixel Fantasy / Cozy Dark Folklore
**Primary Platforms:** Desktop PC / Linux / Windows
**Primary Input:** Mouse and keyboard

---

# 1. Visuaalinen visio

Hearthwood on visuaalisesti kaunis, tunnelmallinen ja selkeä pixel-art-peli, jossa yhdistyvät:

* lämmin metsäfantasia
* syvä pohjoismainen mytologia
* taktinen ruutupohjainen taistelu
* korttimainen kykyjen esitystapa
* roguelite-seikkailun tunnelma
* elävä metsä ja muistot
* selkeä, helposti luettava käyttöliittymä

## Visuaalinen ydinlause

> Pieniä eläviä pikselimaailmoja, suuria mytologisia tunteita.

Hearthwoodin ei pidä näyttää geneeriseltä retro-peliltä.

Sen tulee näyttää tarkoituksella tehdyltä, yhtenäiseltä ja modernilta pixel-art-peliltä.

---

# 2. Visuaalinen identiteetti

## 2.1 Tyylin nimi

**Cozy Mythic Pixel Fantasy**

Vaihtoehtoinen sisäinen nimi:

**Living Forest Pixel Art**

## 2.2 Tärkeimmät vaikutelmat

Pelaajan tulee tuntea:

* rauha ennen taistelua
* jännitys ennen vihollisen vuoroa
* tyydytys onnistuneesta taktisesta liikkeestä
* metsämaailman elävyys
* mysteeri ja vanha historia
* pieni surumielisyys
* lämpö ja turvallisuus Hearth-alueilla
* vaaran tunne korruptoituneilla alueilla

## 2.3 Visuaaliset vastakohdat

Hearthwood tarvitsee selkeitä vastakohtia:

| Turvallinen            | Vaarallinen             |
| ---------------------- | ----------------------- |
| lämmin valo            | kylmä pimeys            |
| pehmeä vihreä          | korruptoitunut violetti |
| pyöreät muodot         | terävät muodot          |
| pieni liike            | aggressiivinen liike    |
| luonnollinen symmetria | rikkinäinen rakenne     |
| lämmin oranssi         | myrkyllinen vihreä      |

---

# 3. Pixel-artin tekninen perusta

## 3.1 Suositeltu resoluutio

Hearthwoodin ensimmäinen versio käyttää sisäistä renderöintiresoluutiota:

```text
320 × 180
```

Tai suuremmassa käyttöliittymässä:

```text
384 × 216
```

Näyttö skaalataan kokonaislukukertoimella.

Esimerkiksi:

```text
320 × 180 → 1280 × 720
320 × 180 → 1600 × 900
320 × 180 → 1920 × 1080
```

## 3.2 Pixel-perfect-säännöt

* ei sumeaa skaalausta
* ei automaattista kuvan pehmennystä
* käytä nearest-neighbor-skaalausta
* pikselien pitää pysyä terävinä
* kaikki sprite- ja tileset-grafiikat käyttävät samaa mittakaavaa
* animaatiot eivät saa rikkoa pikseliruudukkoa
* kameran liike lukitaan tarvittaessa pikseliruudukkoon

## 3.3 Sprite-mittakaava

Suositeltu yksikkö:

```text
32 × 32 px
```

Suuremmat yksiköt:

```text
48 × 48 px
64 × 64 px
```

Bossit ja suuret olennot:

```text
96 × 96 px
128 × 128 px
```

## 3.4 Tileset

Suositeltu tileset-koko:

```text
16 × 16 px
```

Vaihtoehtoinen:

```text
32 × 32 px
```

MVP käyttää ensisijaisesti 16 × 16 px -tilejä ja suurempia spritejä niiden päällä.

---

# 4. Väripaletti

Hearthwood käyttää rajattua, tarkoituksellista väripalettia.

## 4.1 Päävärit

### Forest Green

* metsä
* luonto
* Rootborn
* turvallisuus

### Moss Green

* sammal
* parantuminen
* kasvu
* rauha

### Bark Brown

* puu
* maa
* rakennukset
* käyttöliittymän reunat

### Hearth Orange

* tuli
* koti
* lämpö
* tärkeä valinta

### Moon Blue

* yö
* henget
* taikuus
* muistot

### Frost Cyan

* jää
* Frostroot
* hidastus
* jäädytys

### Rot Purple

* korruptio
* Mycelian
* Decay
* vaaralliset alueet

### Sun Gold

* Sunwarden
* pyhä energia
* harvinaiset palkinnot
* legendaariset kyvyt

---

# 5. Palettisäännöt

## 5.1 Käyttöliittymässä

Käyttöliittymän tulee käyttää:

* tummia neutraaleja taustoja
* vaaleaa tekstiä
* yhtä pääkorosteväriä kerrallaan
* värikoodattuja statusvaikutuksia
* pieniä, selkeitä symboleja

## 5.2 Taistelukentällä

Jokaisella maastotyypillä pitää olla oma visuaalinen tunniste.

| Maasto    | Visuaalinen tunniste           |
| --------- | ------------------------------ |
| Polku     | ruskea ja vaalea reunus        |
| Metsä     | vihreät lehdet ja varjo        |
| Kallio    | harmaat pikselipinnat          |
| Vesi      | siniset vaakaviivat            |
| Suo       | tumma vihreä ja kuplat         |
| Jää       | cyan-reunat ja kiilto          |
| Tuli      | oranssi, punainen ja keltainen |
| Myrkky    | vihreät kuplat                 |
| Pyhä maa  | kultaiset pienet hiukkaset     |
| Korruptio | violetti halkeilu              |

---

# 6. Kamera ja näkymä

## 6.1 Kameratyyppi

Suositus:

**2D top-down / tactical three-quarter view**

Kamera näyttää:

* ruudukon
* yksiköt
* maaston
* korkeuserot
* tavoitteet
* vihollisten intentit
* liikeradat

## 6.2 Kameran ominaisuudet

MVP:

* kiinteä kamera
* pieni zoomaus
* taistelukenttä keskitetään automaattisesti
* ei vapaata pyöritystä
* ei monimutkaista 3D-kameraa

Myöhemmin:

* zoomaus
* kameran siirto
* pieni kallistus
* biomekohtaiset kameratehosteet
* bossikohtaiset kamerasiirtymät

## 6.3 Kameran liike

Kameran liike saa tapahtua:

* taistelun alussa
* bossin ilmestyessä
* erityiskyvyn aikana
* suuren maastonmuutoksen yhteydessä
* taistelun lopussa

Kamera ei saa liikkua jatkuvasti ilman tarkoitusta.

---

# 7. Taistelukentän visuaalinen rakenne

Taistelukenttä koostuu kolmesta visuaalisesta tasosta.

## Taso 1 — Ground Layer

* maa
* polut
* vesi
* lumi
* suo
* kivet
* juuret

## Taso 2 — Tactical Layer

* ruudukko
* liikeruudut
* Zone of Control
* tavoitteet
* vihollisen uhka-alueet
* suoja-alueet
* korkeuserot

## Taso 3 — Character Layer

* yksiköt
* varusteet
* statusikonit
* HP-palkit
* AP-merkit
* reaktiosymbolit
* valintakehykset

Näiden kerrosten pitää olla visuaalisesti erotettavissa.

---

# 8. Ruudukon käyttöliittymä

Ruudukko ei saa olla jatkuvasti raskas tai kirkas.

## Normaalitila

* ruudukko lähes huomaamaton
* maasto ja sprite-grafiikka pääosassa

## Liiketila

Kun pelaaja valitsee yksikön:

* saavutettavat ruudut korostetaan
* vaaralliset ruudut näkyvät punaisina
* liikerata näkyy pisteviivana
* viimeinen ruutu korostetaan
* Movement-kustannus näytetään

## Hyökkäystila

* kantama näkyy
* kohderuudut korostetaan
* esteet näkyvät selkeästi
* vihollisen Zone of Control näytetään
* mahdolliset reaktiot näkyvät symboleina

## Tavoitetila

* tavoiteruudut saavat selkeän kuvakkeen
* hallinta-alue näkyy pehmeänä väripintana
* tavoitteen eteneminen näytetään erillisessä UI-paneelissa

---

# 9. Yksikköjen pixel-art

## 9.1 Yksikön visuaalinen rakenne

Jokaisella yksiköllä on:

1. Siluetti
2. Päävärit
3. Heimon tunnus
4. Luokan tunnus
5. Ase tai työkalu
6. Liikeanimaatio
7. Hyökkäysanimaatio
8. Vahinkoreaktio
9. Kuolema- tai poistumisanimaatio
10. Valintakehys

## 9.2 Siluetin merkitys

Yksikön pitää tunnistaa jo pelkän siluetin perusteella.

Esimerkkejä:

* Guardian: suuri kilpi
* Ranger: jousi ja viitta
* Assassin: terävä profiili ja tumma huppu
* Healer: sauva, kasvit tai valo
* Summoner: kelluvat henget
* Juggernaut: suuri massa ja raskas ase
* Controller: sauva, ketjut tai maagiset symbolit

## 9.3 Heimon ja luokan erottaminen

Heimo näkyy:

* väripaletissa
* kasvoissa
* koristeissa
* materiaaleissa
* auraefekteissä

Luokka näkyy:

* aseessa
* asennossa
* varusteissa
* toimintaan liittyvissä animaatioissa

Sama luokka voi näyttää erilaiselta eri heimossa.

---

# 10. Yksikön animaatiot

## MVP-animaatiot

Jokaisella pelattavalla yksiköllä tulee olla:

* Idle
* Move
* Attack
* Ability
* Hit
* Defend
* Low HP
* Defeat
* Victory

## Animaatioiden suositeltu pituus

| Animaatio    |       Pituus |
| ------------ | -----------: |
| Idle         |   4–8 framea |
| Move         |  6–10 framea |
| Basic Attack |  6–12 framea |
| Heavy Attack | 10–18 framea |
| Ability      |  8–24 framea |
| Hit          |   3–6 framea |
| Defeat       |  8–16 framea |
| Victory      |  8–16 framea |

## Animaation periaate

Pixel-animaatio ei tarvitse suurta määrää frameja.

Tärkeämpää on:

* hyvä poseeraus
* selkeä liikesuunta
* ennakointi
* osumahetki
* palautuminen
* vahva siluetti

---

# 11. Liikkumisen visuaalinen palaute

Koska liikkuminen on Hearthwoodin tärkeä pelijärjestelmä, sen tulee tuntua hyvältä.

## 11.1 Valittu yksikkö

Valittu yksikkö saa:

* pehmeän valintakehyksen
* pienen varjon
* luokan tunnuksen
* HP- ja AP-tiedot
* mahdollisen reaktiokuvakkeen

## 11.2 Liikerata

Kun pelaaja osoittaa kohderuutua:

* reitti näytetään selkeänä viivana
* jokainen ruutu näyttää Movement-kustannuksen
* vaaralliset ruudut vaihtavat väriä
* mahdollinen vihollisreaktio näytetään
* viimeinen ruutu saa vahvemman korostuksen

## 11.3 Liikkeen toteutus

Liikkeessä:

1. yksikkö valmistautuu
2. sprite liikkuu ruudusta toiseen
3. pieni pöly-, lehti-, lumi- tai vesiefekti syntyy
4. Facing päivittyy
5. ruudun maastovaikutus aktivoituu
6. status- tai reaktioefekti näytetään
7. Combat Log päivittyy

## 11.4 Erikoisliikkeet

### Dash

* nopea jälkikuva
* tuuliviiva
* lyhyt kameran tärähdys

### Charge

* valmistautumispose
* etenemisviiva
* osumahetken isku
* vihollisen työntöefekti

### Blink

* sprite hajoaa pikseleiksi
* kohderuutuun ilmestyy pieni valo
* yksikkö ilmestyy uudelleen

### Burrow

* maa avautuu
* yksikkö katoaa juurten alle
* uusi sijainti paljastuu

### Spirit Shift

* haamumainen kaksoiskuva
* sininen tai hopeinen aura
* lyhyt välähdys

---

# 12. Taistelun käyttöliittymä

## 12.1 Yläreuna

Yläreunassa näytetään:

* kierrosnumero
* nykyinen vuoro
* aloitejärjestys
* Forest Mood
* taistelun tavoite
* mahdollinen bossivaihe

Esimerkki:

```text
ROUND 04

PLAYER TURN

Forest Mood: Suspicious

Objective:
Protect the Memory Shrine
```

## 12.2 Vasemman reunan yksikköpaneeli

Kun yksikkö valitaan:

* nimi
* heimo
* luokka
* HP
* Armor
* Resistance
* AP
* Movement
* Energy
* statusvaikutukset
* reaktiot
* passiiviset kyvyt

## 12.3 Alapalkki

Alapalkissa näytetään:

* yksikön kyvyt
* AP-kustannus
* cooldown
* energia
* esineet
* Guard
* End Turn
* Undo Preview
* Combat Log

## 12.4 Oikea reuna

Oikealla näytetään:

* vihollisen intent
* tavoitteen eteneminen
* aktiiviset ympäristöefektit
* viimeisin tapahtuma
* mahdolliset reaktiot

---

# 13. Kykyjen korttimainen UI

Hearthwood voi käyttää korttimaisia kykykuvakkeita ilman, että peli muuttuu varsinaiseksi korttipeliksi.

## Kykykortin rakenne

```text
┌─────────────────────┐
│ ICON                │
│                     │
│ Shield Wall         │
│                     │
│ Protect adjacent    │
│ allies.             │
│                     │
│ AP 2     CD 3       │
└─────────────────────┘
```

## Kykykortin osat

* kyvyn nimi
* pikseli-ikoni
* lyhyt kuvaus
* AP-kustannus
* Energy-kustannus
* cooldown
* kantama
* kohteen tyyppi
* status- tai elementtitunnus
* mahdollinen reaktiotunnus

## Kortin tilat

### Available

* kirkas
* selkeä reunus
* normaali kontrasti

### Selected

* korostettu reunus
* kohdealue näkyy kentällä

### Unavailable

* tummennettu
* syy näkyy tooltipissä

### Cooldown

* numero kortin päällä
* harmaa sävy
* jäljellä oleva kierrosmäärä

### Reaction Ready

* pieni erillinen reaktiovalo
* ei saa sekoittua normaaliin kykyyn

---

# 14. Statusvaikutusten visuaalinen kieli

Statusvaikutukset pitää tunnistaa nopeasti.

| Status     | Ikoni-idea                         | Väri           |
| ---------- | ----------------------------------- | -------------- |
| Poison     | pisara / kupla                     | myrkynvihreä   |
| Burn       | liekki                              | oranssi        |
| Bleed      | pisara                              | punainen       |
| Freeze     | lumihiutale                        | cyan           |
| Slow       | raskas jalka                       | siniharmaa     |
| Stun       | tähti / salama                     | keltainen      |
| Root       | juuret                              | vihreä         |
| Silence    | suljettu suu / rikkinäinen symboli | violetti       |
| Shield     | kilpi                               | sininen        |
| Regrowth   | lehti                               | vihreä         |
| Weak       | alaspäin osoittava murtunut nuoli  | harmaa         |
| Vulnerable | haljennut kilpi                    | punainen       |
| Haste      | tuuliviiva                         | vaalea sininen |
| Barrier    | ympyräkilpi                        | kultainen      |
| Curse      | silmä / riimu                      | violetti       |
| Decay      | sieni / halkeama                   | tumma violetti |
| Mark       | kohde                               | punainen       |
| Taunt      | huutomerkki                        | oranssi        |

## Säännöt

* sama status käyttää aina samaa ikonia
* sama status käyttää aina samaa pääväriä
* ikonit näkyvät yksikön vieressä
* pinot näytetään numerolla
* pitkäkestoiset statukset näkyvät UI-paneelissa
* statusreaktiot käyttävät yhdistelmäanimaatiota

---

# 15. Damage- ja healing-numerot

Taistelun numerot pitää tehdä luettaviksi.

## Vahinko

* punainen tai tumma oranssi
* nouseva numero
* pieni iskuanimaatio

## Parantuminen

* vihreä numero
* ylöspäin liikkuva numero
* lehti- tai valoefekti

## Shield

* sininen numero
* kilpisymboli

## Critical

* suurempi fontti
* lyhyt pysähdys
* erityinen ääni
* pieni burst-efekti

## Miss

* harmaa "MISS"
* nopea sivuliike

## Block

* kilpi-ikoni
* pieni metallinen isku

## Resist

* violetti tai sininen numero
* vastustuksen symboli

---

# 16. Vihollisen intent UI

Vihollisen aikomus näytetään yksikön yläpuolella tai oikean reunan paneelissa.

## Intent-ikonit

* miekka: hyökkäys
* nuoli: kaukohyökkäys
* kilpi: puolustus
* jalka: liike
* silmä: paljastaminen
* riimu: rituaali
* liekki: maaston polttaminen
* kutsusymboli: vahvistusten kutsuminen
* portti: pakeneminen
* kohde: tiettyyn ruutuun liikkuminen

## Intentin värit

* harmaa: normaali toiminto
* keltainen: uhkaava toiminto
* punainen: korkea vaara
* violetti: erityinen tai rituaalinen toiminto
* sininen: puolustava toiminto

## Intentin tavoite

Pelaajan pitää pystyä ymmärtämään:

* mitä vihollinen tekee
* ketä se aikoo vahingoittaa
* mihin se aikoo liikkua
* voiko toiminnon keskeyttää
* miten siihen voi vastata

---

# 17. Valinta- ja kohdistusjärjestelmä

## Yksikön valinta

Valittu yksikkö saa:

* kirkkaan reunuksen
* pienen varjon
* luokan symbolin
* lyhyen valintaäänen
* UI-paneelin

## Kohteen valinta

Kohderuutu saa:

* kohdistuskehän
* kohteen nimen
* arvioidun vaikutuksen
* mahdollisen reaktion
* kantaman tiedon

## Vaarallinen toiminto

Jos toiminto voi aiheuttaa vakavan riskin:

* kohdealue näytetään punaisena
* tooltip kertoo riskin
* pelaaja voi peruuttaa ennen vahvistusta

---

# 18. Maastojen visuaaliset paketit

## Autumnwood

Tunnelma:

* lämmin
* hieman melankolinen
* syksyinen
* muistojen täyttämä

Grafiikka:

* ruskeat puut
* oranssit lehdet
* sammaleiset kivet
* pienet sienet
* kultainen valo
* tuulen mukana liikkuvat lehdet

Erityisefektit:

* putoavat lehdet
* lämmin sumu
* Memory Fragment -hiukkaset

## Frostroot

Tunnelma:

* hiljainen
* kirkas
* kylmä
* muinainen

Grafiikka:

* jäätyneet juuret
* sininen lumi
* jääluolat
* valkoiset puut
* jäätyneet lammet

Erityisefektit:

* jääkiteet
* huurrepilvet
* jäätyvät ruudut

## Sunspire

Tunnelma:

* pyhä
* kirkas
* korkea
* majesteettinen

Grafiikka:

* kultaiset kasvit
* kiviset temppelit
* auringon säteet
* korkeat tasanteet
* valoisat kukat

Erityisefektit:

* kultaiset hiukkaset
* valonsäteet
* pyhät riimut

## Mirefall

Tunnelma:

* vaarallinen
* kostea
* rappeutunut
* salaperäinen

Grafiikka:

* tumma suo
* violetit sienet
* rikkoutuneet puut
* sumu
* myrkylliset lammet
* korruptoituneet juuret

Erityisefektit:

* kuplat
* myrkkysumu
* hitaasti leviävä korruptio

---

# 19. Hearth-alueen käyttöliittymä

Hearth on pelaajan turvallinen paikka.

Sen tulee erottua taistelusta.

## Hearth-näkymä

* lämmin keskitetty tuli
* puupaneelit
* pehmeät varjot
* hitaasti liikkuvat hahmot
* muistot ja esineet näkyvillä
* rauhallinen taustamusiikki

## Hearthin toiminnot

* joukkueen hallinta
* luokkien kehitys
* varusteet
* relicit
* Memory Archive
* Spacemonkeyn tarinakeskustelu
* seuraavan retken valinta
* codex
* asetukset

## Hearthin visuaalinen sääntö

Taistelukenttä näyttää vaaran.

Hearth näyttää jatkuvuuden.

---

# 20. Maailmankartan UI

Maailmankartta on roguelite-reitti.

## Solmut

* normaali taistelu
* elite-taistelu
* boss
* market
* event
* shrine
* memory
* rest
* mystery
* treasure
* challenge

## Solmun visuaalinen rakenne

Jokaisella solmulla on:

* pikseli-ikoni
* pieni animaatio
* värikoodi
* nimi tooltipissä
* mahdollinen uhkataso
* reittiviivat

## Reitin esitys

* nykyinen sijainti korostetaan
* saavutettavat solmut näkyvät kirkkaina
* lukitut solmut näkyvät himmeinä
* löydetyt salaiset reitit saavat erityisen symbolin
* boss-reitti erottuu muusta kartasta

---

# 21. Pixel-art-efektit

## Pakolliset efektit

* isku
* osuma
* kriittinen osuma
* parantuminen
* shield
* poison
* burn
* freeze
* root
* teleport
* dash
* kuolema
* summon
* terrain change
* objective complete
* boss entrance

## Efektien periaatteet

* lyhyt
* selkeä
* ei peitä koko taistelukenttää
* käyttää oikeaa elementtiväriä
* sisältää selkeän aloitus- ja loppuhetken
* ei käytä jatkuvaa glow-efektiä kaikkialla

## Pixel-burst

Useita kykyjä voidaan esittää pienillä pikselipurskeilla:

* 4–12 pikseliä
* lyhyt liikerata
* 2–5 framea
* selkeä väri
* nopea katoaminen

---

# 22. UI-animaatiot

UI:n tulee olla elävä mutta rauhallinen.

## Sallittu

* pieni hover-liike
* kortin kevyt korostus
* statusikonin pulssi
* AP-pisteen syttyminen
* ilmoituksen pieni sisääntulo
* kyvyn cooldown-numeron päivitys
* karttasolmun kevyt liike

## Vältettävä

* jatkuvasti pomppivat painikkeet
* liian suuret zoomaukset
* jatkuva kameran heiluminen
* liian kirkas glow
* kaikki elementit animoituna yhtä aikaa
* nopeasti vilkkuvat punaiset varoitukset

## Reduced Motion

Asetuksissa tulee olla:

```text
Reduced Motion: On / Off
```

Kun päällä:

* kameran liike vähenee
* efektit lyhenevät
* ruudun tärinä poistuu
* UI-animaatiot korvataan selkeillä tilamuutoksilla

---

# 23. Äänet ja visuaalinen palaute

Jokaisella tärkeällä visuaalisella tapahtumalla voi olla äänellinen vastine.

## Esimerkkejä

* valittu yksikkö: pieni puinen napsahdus
* liike: askel, lehti tai kivi
* Guardian Block: kilven metallinen ääni
* Healer: pehmeä kelloääni
* Freeze: lasimainen särö
* Root: puun halkeama
* Burn: nopea liekin humahdus
* Boss: matala metsän ääni
* Memory Fragment: hiljainen kuiskaus
* voitto: lämmin Hearth-sointu

Äänet eivät saa korvata visuaalista informaatiota.

---

# 24. UI-komponenttien rakenne

```text
src/
├── components/
│   └── hearthwood/
│       ├── ui/
│       │   ├── PixelButton.jsx
│       │   ├── PixelPanel.jsx
│       │   ├── PixelTooltip.jsx
│       │   ├── PixelIcon.jsx
│       │   ├── PixelProgressBar.jsx
│       │   ├── PixelBadge.jsx
│       │   └── PixelModal.jsx
│       ├── battle/
│       │   ├── BattleViewport.jsx
│       │   ├── TacticalGrid.jsx
│       │   ├── UnitSprite.jsx
│       │   ├── UnitInfoPanel.jsx
│       │   ├── AbilityBar.jsx
│       │   ├── InitiativeBar.jsx
│       │   ├── EnemyIntent.jsx
│       │   ├── MovementPreview.jsx
│       │   ├── ReactionIndicator.jsx
│       │   ├── StatusIcons.jsx
│       │   └── CombatLog.jsx
│       ├── world/
│       │   ├── WorldMap.jsx
│       │   ├── MapNode.jsx
│       │   ├── HearthView.jsx
│       │   └── BiomeBackground.jsx
│       └── units/
│           ├── UnitCard.jsx
│           ├── ClassBadge.jsx
│           ├── TribeBadge.jsx
│           ├── EquipmentPanel.jsx
│           └── UnitPortrait.jsx
├── assets/
│   └── hearthwood/
│       ├── sprites/
│       ├── tilesets/
│       ├── portraits/
│       ├── icons/
│       ├── effects/
│       ├── ui/
│       └── backgrounds/
└── services/
    └── hearthwood/
        ├── assetRegistry.js
        ├── animationRegistry.js
        ├── visualTheme.js
        └── pixelRenderer.js
```

---

# 25. Asset Registry

Kaikki grafiikat rekisteröidään dataohjattuun järjestelmään.

```json
{
  "id": "unit_guardian_rootborn",
  "type": "unit_sprite",
  "tribe": "rootborn",
  "class": "guardian",
  "spriteSheet": "rootborn_guardian.png",
  "frameSize": {
    "width": 48,
    "height": 48
  },
  "animations": {
    "idle": {
      "start": 0,
      "length": 6,
      "fps": 8
    },
    "move": {
      "start": 6,
      "length": 8,
      "fps": 12
    },
    "attack": {
      "start": 14,
      "length": 10,
      "fps": 12
    }
  },
  "palette": "rootborn",
  "shadow": true,
  "outline": "dark_bark"
}
```

---

# 26. UI-teeman tokenit

```json
{
  "theme": "hearthwood_dark",
  "colors": {
    "background": "#171A18",
    "panel": "#252B25",
    "panelRaised": "#303830",
    "border": "#625B43",
    "text": "#F1E8D2",
    "mutedText": "#A9A58F",
    "accent": "#D79B4A",
    "success": "#83B66B",
    "warning": "#D8B15D",
    "danger": "#C65B51",
    "magic": "#8E7BC7",
    "frost": "#80C7D5",
    "spirit": "#A5A4E8"
  },
  "pixel": {
    "baseUnit": 4,
    "borderWidth": 2,
    "cornerStyle": "pixel",
    "shadowOffset": 3
  }
}
```

Värien lopullinen toteutus voidaan muuttaa sprite- ja UI-paletin mukaan.

---

# 27. Käyttöliittymän saavutettavuus

Pixel-art ei saa tarkoittaa epäselvyyttä.

## Pakolliset vaatimukset

* teksti on luettavaa
* tärkeät tiedot eivät perustu vain väriin
* statusikonilla on tooltip
* valittu yksikkö erottuu muodolla ja värillä
* vihollisen intentillä on ikoni ja teksti
* fonttikokoa voidaan suurentaa
* UI-skaala voidaan valita
* kontrastia voidaan lisätä
* Reduced Motion on käytettävissä
* värisokeusystävällinen tila voidaan lisätä myöhemmin

## UI-skaala

Vaihtoehdot:

```text
100 %
125 %
150 %
200 %
```

---

# 28. MVP:n visuaalinen sisältö

## Pakolliset grafiikat

* 6 pelattavaa yksikköä
* 6–10 vihollistyyppiä
* 1 biome
* 1 Hearth-alue
* 1 bossi
* 6 maastotyyppiä
* 10–15 statusikonia
* 20–30 kykyikonia
* perusliike- ja hyökkäysefektit
* perus UI-paneelit
* maailmankartan solmut
* voitto- ja tappionäkymä

## MVP-biome

**Autumnwood**

Se toimii Hearthwoodin ensimmäisenä visuaalisena identiteettinä, koska siinä voidaan näyttää:

* metsä
* polut
* kivet
* lehdet
* juuret
* tuli
* pyhä alue
* muistot
* Hearth

---

# 29. Visuaalinen tuotantoputki

## Vaihe 1 — Style Bible

Määrittele:

* pikselikoko
* resoluutio
* paletti
* sprite-mittakaava
* varjot
* outline-tyyli
* animaatioiden nopeus
* UI-kulmat
* fontit
* efektien voimakkuus

## Vaihe 2 — Graybox

Toteuta ensin:

* ruudukko
* yksiköiden paikat
* maastotyypit
* liikeradat
* UI-paneelit
* vihollisen intentit

Kaikki voidaan tehdä placeholder-grafiikoilla.

## Vaihe 3 — Visual Prototype

Lisää:

* yksi biome
* kaksi yksikköä
* yksi vihollinen
* yksi kyky
* yksi liikeanimaatio
* yksi statusvaikutus

## Vaihe 4 — Production Assets

Tuotetaan:

* sprite-sheetit
* tilesetit
* ikonit
* UI-elementit
* efektit
* taustat
* portraits

## Vaihe 5 — Visual QA

Tarkista:

* spritejen luettavuus
* värien johdonmukaisuus
* UI:n kontrasti
* ruudukon selkeys
* animaatioiden nopeus
* efektien määrä
* eri resoluutiot
* eri UI-skaalat

---

# 30. Visual QA -säännöt

Jokaisen uuden grafiikan tulee vastata seuraaviin kysymyksiin:

1. Tunnistaako pelaaja sen nopeasti?
2. Erottuuko se taustasta?
3. Onko sen tarkoitus selkeä?
4. Käyttääkö se oikeaa palettia?
5. Onko sprite oikeassa mittakaavassa?
6. Onko sen animaatio tarpeeksi lyhyt?
7. Peittääkö efekti tärkeää informaatiota?
8. Näkyykö status myös ilman väriä?
9. Toimiiko se pienellä näytöllä?
10. Sopiko se Hearthwoodin visuaaliseen identiteettiin?

---

# 31. Acceptance Criteria

Visuaalinen MVP hyväksytään, kun:

* peli käyttää yhtenäistä pixel-art-mittakaavaa
* pikselit skaalautuvat terävinä
* yksi biome on visuaalisesti valmis
* taistelukenttä on helposti luettava
* yksiköt erottuvat toisistaan
* luokka ja heimo voidaan tunnistaa
* liikeruudut ovat selkeitä
* vihollisen intentit näkyvät
* kykykortit ovat luettavia
* statusvaikutukset tunnistetaan
* HP, AP ja Movement ovat helposti nähtävissä
* taistelun tavoite on aina selkeä
* käyttöliittymä ei peitä tärkeää taisteludataa
* animaatiot eivät hidasta pelaamista
* Reduced Motion toimii
* UI-skaala toimii
* placeholder-grafiikat voidaan vaihtaa ilman pelilogiikan muuttamista
* kaikki grafiikat ladataan Asset Registryn kautta
* visuaalinen tyyli ei riipu yksittäisistä hardkoodatuista komponenteista

---

# 32. Lopullinen visuaalinen tavoite

Hearthwoodin pitäisi näyttää peliltä, jonka voi tunnistaa yhdestä kuvakaappauksesta.

Sen visuaalisen identiteetin pitää muodostua seuraavista:

* lämmin mutta hieman melankolinen metsä
* terävä ja laadukas pixel-art
* selkeä taktinen ruudukko
* pienet mutta ilmeikkäät yksiköt
* korttimaiset kyvyt
* värikoodatut statusvaikutukset
* selkeät vihollisen intentit
* elävä maasto
* muistojen ja henkien visuaaliset efektit
* Hearthin lämmin turvallisuus
* korruption kylmä uhka

## Lopullinen periaate

> Kauneus luo maailman. Selkeys tekee siitä pelin.
