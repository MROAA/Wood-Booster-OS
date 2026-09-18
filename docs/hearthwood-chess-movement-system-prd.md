> **Status: north-star vision, not a work order — logged verbatim, no
> code change.** Marc pasted this in full (2026-09-18), no "jatketaan"
> trigger — the same bare-paste pattern as every other full PRD logged
> in this repo (Pixel Graphics & Visual UI, Class System, Enemy
> Ecosystem, ...). Delivered here as a docs-only PR, that precedent's
> own discipline.
>
> **How this relates to the doc already on file with a similar name**
> (`docs/hearthwood-movement-tactical-prd.md`, Marc's own earlier
> "Movement & Tactical Gameplay" PRD): that one is already extensively
> SHIPPED in the Hearthwood Frontier tactics engine —
> `docs/hearthwood-turn-based-tactical-prd.md`'s topic file has the
> full history — its §4.2 (Facing, front/side/back multipliers,
> per-class flank benefit/resist, Block-weaken, Crit) and §4.3 (all 5
> Zone of Control sub-types: Basic, Threat, Fear, Frost, Thorn) are
> COMPLETE, and §4.4 has 2 of its 4 named reactions shipped (Guardian's
> Intercept, Retreat Step) with 2 remaining (Sidestep, Spirit Shift).
> **This new PRD is a different, far more ambitious proposal**: not an
> incremental extension of that shipped system, but a wholesale
> replacement of how movement itself is computed — chess-piece MOVEMENT
> PATTERNS (Rook/Bishop/Knight/King/Queen/Pawn) as the core mechanic
> every unit's class is built from, rather than the current engine's
> single generic model (a flat `move` stat, one plain BFS
> `reachableTilesFor`, identical movement shape for every unit
> regardless of class).
>
> **A real mismatch worth flagging up front, not discovered later**:
> this PRD's own named classes (Guardian, Warden, Juggernaut, Striker,
> Assassin, Ranger, Artillery, Healer, Controller, Frostbinder,
> Summoner, Beastmaster, Commander, Scout, Spiritwalker, Chronomancer)
> match NEITHER the real roster's own role taxonomy
> (`roles.js`'s `unitProfile` — tank / dps / healer / support / control
> / debuffer / assassin / summoner / economy, PR #420) NOR the earlier
> Class System PRD's own vocabulary
> (`docs/hearthwood-class-system-tactical-roles-prd.md`, §3's Frontline
> / Damage / Control / Support / Summoning & Economy / Specialist
> groups). All three are genuine, independently-authored "class"
> taxonomies for the same game, each with a different vocabulary and
> grouping. Adopting this PRD's movement-pattern idea would need a
> fresh mapping pass from ITS 16 classes onto the 60+ real recruitable
> units (`units.js`) - not something to assume lines up.
>
> **Scale, for context.** This proposes: a full `MovementEngine` module
> (§14) with its own pathfinding, a `MovementProfile`/`ClassMovement`
> JSON data model (§13) for every unit, 6 chess-piece movement pattern
> types plus 16 per-class movement profiles (§5) each with their own
> special-move rules, a full movement-event bus (§15) separate from the
> combat-event system, enemy AI rewritten to path-find with the same
> engine (§18), and terrain/obstacle interactions well beyond the
> engine's current single `TERRAIN` cost-per-tile map (§3.1's real
> tileset: `terrainAt`/`TERRAIN = {path, forest, rock, water, poison}`
> — no walls, no jump-over, no diagonal movement, no per-tile line-of-
> sight blocking today). This is comparable in scope to the Hearthwood
> Frontier pivot itself, on the movement-computation axis specifically,
> not a round-sized slice.
>
> No implementation attempted this round. Full PRD verbatim below.

---

# HEARTHWOOD — LIIKKUMISJÄRJESTELMÄ PRD

## Shakkipohjainen taktinen liikkuminen

### Genre

Turn-Based Tactical Roguelite RPG

### Ydinajatus

Hearthwoodin taistelukentällä jokainen unit liikkuu ruudukossa shakin inspiroimilla säännöillä.

Kaikilla uniteilla on:

* oma liikkumismuoto
* oma liikkumisalue
* oma liikkumisrajoitus
* oma taktinen tarkoitus
* oma suhde maastoon
* oma suhde vihollisiin ja esteisiin

Liikkuminen ei ole pelkkä tapa siirtyä paikasta toiseen. Se on tärkeä osa:

* hyökkäyksiä
* puolustusta
* asemointia
* synergioita
* vihollisen houkuttelua
* tavoitteiden hallintaa
* pakoreittejä
* ansakenttiä
* taistelun rytmiä

---

# 1. Vision

Hearthwoodin liikkumisen tulee tuntua samanaikaisesti:

* helposti ymmärrettävältä
* shakkimaiselta
* taktisesti syvältä
* luokkasidonnaiselta
* visuaalisesti selkeältä
* reilulta
* ennakoitavalta

Pelaajan tulee pystyä katsomaan unittia ja ymmärtämään:

> "Tämä unit liikkuu näin, koska se kuuluu tähän classiin."

Esimerkiksi:

* Guardian liikkuu hitaasti ja pitää linjaa.
* Ranger liikkuu suoraviivaisesti ja tarvitsee etäisyyttä.
* Assassin liikkuu nopeasti vihollisen taakse.
* Warden hallitsee alueita ja kulkureittejä.
* Frostbinder muuttaa maastoa ja rajoittaa vihollisen liikettä.
* Spiritwalker voi siirtyä normaalien esteiden läpi.
* Summoner voi luoda uusia liikkumisen mahdollisuuksia summonien avulla.

---

# 2. Tavoitteet

## 2.1 Päätavoitteet

1. Luoda shakkimainen ruutupohjainen liikkumisjärjestelmä.
2. Antaa jokaiselle classille tunnistettava liikkumisidentiteetti.
3. Erottaa liikkuminen, hyökkäys ja erikoiskyvyt toisistaan.
4. Mahdollistaa taktinen asemointi.
5. Tehdä liikkumisesta visuaalisesti helposti luettavaa.
6. Tukea erilaisia maastoja ja biomeja.
7. Mahdollistaa luokat, jotka rikkovat normaaleja liikkumissääntöjä.
8. Pitää kaikki liikkuminen deterministisenä ja ennakoitavana.
9. Tukea vihollisten käyttämää samaa järjestelmää.
10. Rakentaa järjestelmä, joka voidaan yhdistää uuteen Hearthwood Game Engineen.

## 2.2 Ei-tavoitteet

MVP-versiossa ei tehdä:

* vapaata hiirellä liikkumista ilman ruudukkoa
* fysiikkapohjaista liikkumista
* reaaliaikaista liikkumista
* täysin satunnaisia liikkumissääntöjä
* piilotettuja liikkumissääntöjä
* liikkumista, jota pelaaja ei voi ennakoida

---

# 3. Perusperiaatteet

## 3.1 Ruudukko

Taistelukenttä koostuu ruuduista.

Jokaisella ruudulla voi olla:

* maastotyyppi
* kulkukelpoisuus
* korkeustaso
* yksikkö
* este
* tavoite
* statusvaikutus
* ansa
* ympäristövaikutus

Esimerkkiruudukko:

```text
[ ][ ][ ][ ][ ][ ][ ]
[ ][ ][ ][ ][ ][ ][ ]
[ ][ ][G][ ][ ][ ][ ]
[ ][ ][ ][ ][ ][ ][ ]
[ ][ ][ ][R][ ][ ][ ]
[ ][ ][ ][ ][ ][ ][ ]
[ ][ ][ ][ ][ ][ ][ ]
```

`G` = Guardian
`R` = Ranger

## 3.2 Yksi ruutu vastaa yhtä sijaintia

Unit voi yleensä päättää vuoronsa vain yhdelle ruudulle.

Liikkuminen tapahtuu ruudusta toiseen:

```text
A1 → A2 → A3 → A4
```

Tai classin mukaan:

```text
Ritari-tyyppinen:
A1 → B3

Torni-tyyppinen:
A1 → A4

Lähetti-tyyppinen:
A1 → D4
```

## 3.3 Liikkuminen kuluttaa Movement Pointseja

Jokaisella unitilla on:

```text
movementPoints
```

Esimerkiksi:

```text
Guardian: 3 MP
Ranger: 4 MP
Assassin: 6 MP
Warden: 2 MP
Spiritwalker: 5 MP
```

Movement Pointsin lisäksi class määrittelee, millaisia ruutuja unit voi käyttää.

---

# 4. Shakkipohjaiset liikkumismuodot

Hearthwood käyttää kuutta päätyyppiä.

## 4.1 Rook Movement — Torniliike

Unit liikkuu:

* vaakasuoraan
* pystysuoraan
* useita ruutuja samaan suuntaan

```text
← ← ←
↑ U ↓
→ → →
```

### Ominaisuudet

* ei voi liikkua vinottain
* liike pysähtyy ensimmäiseen esteeseen
* voi liikkua useita ruutuja
* sopii linjojen hallintaan

### Sopivat classit

* Guardian
* Warden
* Sentinel
* Artillery
* Engineer

### Taktinen identiteetti

Torniliike tekee unitista:

* linjan pitäjän
* käytävien hallitsijan
* puolustusasemien rakentajan
* suorien hyökkäyslinjojen käyttäjän

---

## 4.2 Bishop Movement — Lähettiliike

Unit liikkuu:

* vinottain
* useita ruutuja samaan suuntaan
* ilman suunnan vaihtamista saman liikkeen aikana

```text
↖   ↗
  U
↙   ↘
```

### Ominaisuudet

* liikkuu vain diagonaalisesti
* hyvä avoimella kentällä
* heikompi suorissa käytävissä
* voi kiertää joitakin esteitä

### Sopivat classit

* Spellblade
* Frostbinder
* Hexer
* Ritualist
* Spiritwalker

### Taktinen identiteetti

Lähettiliike tukee:

* kulmista hyökkäämistä
* sivustaan siirtymistä
* diagonaalisia loitsuja
* maaston kiertämistä
* epäsuoraa uhkaa

---

## 4.3 Knight Movement — Ratsu-liike

Unit liikkuu L-muodossa:

```text
..X.
X...
.U..
X...
..X.
```

Todellinen liike:

* kaksi ruutua yhteen suuntaan
* yksi ruutu sivulle

### Ominaisuudet

* voi hypätä muiden unitien yli
* ei tarvitse avointa reittiä
* erittäin hyvä yllätyshyökkäyksiin
* sopii liikkuville melee-uniteille

### Sopivat classit

* Assassin
* Duelist
* Scout
* Beastmaster
* Saboteur

### Taktinen identiteetti

Ratsu-liike antaa:

* läpimurtoja
* takalinjan saavuttamista
* yllätyshyökkäyksiä
* esteiden ylitystä
* mahdollisuuden ohittaa frontline

---

## 4.4 King Movement — Kuninkaan liike

Unit liikkuu yhden ruudun:

* vaakasuoraan
* pystysuoraan
* vinottain

```text
XXX
XUX
XXX
```

### Ominaisuudet

* enintään yksi ruutu
* erittäin tarkka asemointi
* sopii hitaille ja vahvoille uniteille
* voi yhdistyä vahvaan puolustukseen

### Sopivat classit

* Juggernaut
* Gravekeeper
* Relic Keeper
* Desperation Knight

### Taktinen identiteetti

Kuninkaan liike korostaa:

* asemassa pysymistä
* lähietäisyyden uhkaa
* puolustamista
* alueen hallintaa
* vahvaa mutta hidasta etenemistä

---

## 4.5 Queen Movement — Kuningattaren liike

Unit voi liikkua:

* vaakasuoraan
* pystysuoraan
* vinottain
* useita ruutuja

### Ominaisuudet

* erittäin vapaa liikkuminen
* korkea taktinen arvo
* ei saa olla tavallinen perusominaisuus
* yleensä sidottu harvinaiseen classiin tai ultimateen

### Sopivat classit

* Chronomancer
* Shapeshifter
* Void Walker
* Mythic-tier unitit

### Taktinen identiteetti

Kuningattaren liike on tarkoitettu:

* myöhäisen pelin erikoisyksiköille
* harvinaisille sankareille
* voimakkaille transformaatioille
* korkean riskin ja korkean palkinnon buildien palkinnoksi

---

## 4.6 Pawn Movement — Sotilasliike

Unit liikkuu pääasiassa:

* eteenpäin
* rajatun määrän ruutuja
* classin määrittelemään suuntaan

### Ominaisuudet

* vahva etenemissuunta
* heikompi sivuttaisliike
* sopii joukkojen muodostamiseen
* voi saada erikoissääntöjä etenemiseen

### Sopivat classit

* Summoner
* Gatherer
* Merchant
* Basic militia enemies
* Swarm units
* Escort units

### Taktinen identiteetti

Sotilasliike tukee:

* linjojen muodostamista
* saattamista
* etenemistehtäviä
* resurssien keräämistä
* massaliikettä

---

# 5. Class-kohtaiset liikkumisprofiilit

## 5.1 Guardian

### Liikkumistyyppi

King + Rook hybrid

### Perusliike

* 1 ruutu kaikkiin suuntiin
* voi käyttää erityiskykyä liikkuakseen 2 ruutua suoraan
* ei voi hypätä yksiköiden yli

### Erikoissäännöt

* voi liikkua liittolaisen viereen Intercept-reaktiolla
* voi vaihtaa paikkaa suojeltavan unitin kanssa
* voi pysyä paikallaan ja saada puolustusbonuksen

### Taktinen tarkoitus

Guardian ei voita liikkumalla nopeasti.

Guardian voittaa:

* pitämällä käytävän
* suojaamalla takalinjan
* estämällä vihollisen etenemisen
* pakottamalla vihollisen kiertämään

---

## 5.2 Warden

### Liikkumistyyppi

Rook, rajattu kantama

### Perusliike

* 1–2 ruutua suoraan
* ei diagonaalista perusliikettä

### Erikoissäännöt

* voi luoda Thorn Boundary -alueen
* voi liikkua omassa metsämaastossa yhden lisäruudun
* voi estää vihollisia kulkemasta tietyistä ruuduista
* voi vahvistua, jos päättää vuoron hallitsemalleen alueelle

### Taktinen tarkoitus

Warden hallitsee:

* kulmia
* siltoja
* kapeita reittejä
* tavoitteita
* metsäalueita

---

## 5.3 Juggernaut

### Liikkumistyyppi

King + Charge

### Perusliike

* 1 ruutu kaikkiin suuntiin

### Erikoisliike

`Charge`

* liikkuu 2–4 ruutua suoraan
* päättyy ensimmäiseen viholliseen tai esteeseen
* voi työntää vihollista
* ei voi kääntyä kesken chargen

### Rajoitukset

* heikko sivuttaisliike
* suuri kääntymisen kustannus
* ei voi käyttää Chargea, jos lähtöruutu on estetty

### Taktinen tarkoitus

Juggernaut on:

* läpimurtaja
* seinänrikkoja
* raskas uhka
* vihollisen muodostelman hajottaja

---

## 5.4 Striker

### Liikkumistyyppi

King + lyhyt Rook

### Perusliike

* 1 ruutu kaikkiin suuntiin
* voi käyttää 2 ruudun suoraliikettä, jos ei hyökkää samalla vuorolla

### Erikoissäännöt

* saa bonusliikkeen, jos kaataa vihollisen
* voi liikkua kohti Marked-kohdetta
* voi käyttää Exploit Opening -liikettä avoimeen viereiseen ruutuun

### Taktinen tarkoitus

Striker yhdistää:

* lähitaistelun
* nopean asemoinnin
* hyökkäyksen jälkeisen liikkeen
* vihollisen aukkojen hyödyntämisen

---

## 5.5 Assassin

### Liikkumistyyppi

Knight

### Perusliike

* L-muotoinen liike
* voi hypätä unitien yli

### Erikoissäännöt

* Shadow Step: teleporttaa näkyvään ruutuun vihollisen lähellä
* Backstab vaatii vihollisen taka- tai sivuruudun
* voi liikkua vihollisen Threat-alueen läpi Shadow Stepillä
* saa bonusliikkeen, jos hyökkäys tappaa kohteen

### Rajoitukset

* heikko suora puolustus
* ei halua jäädä frontlineen
* tarvitsee tilaa kohteen ympärillä

### Taktinen tarkoitus

Assassin käyttää liikettä:

* takalinjan saavuttamiseen
* healerien metsästämiseen
* yksittäisten kohteiden poistamiseen
* pakoon hyökkäyksen jälkeen

---

## 5.6 Ranger

### Liikkumistyyppi

Rook, rajattu kantama

### Perusliike

* 1–3 ruutua vaakasuoraan tai pystysuoraan
* diagonaalinen liike vain erikoiskyvyllä

### Erikoissäännöt

* Retreat Shot: hyökkää ja siirtyy taaksepäin
* Camouflage: voi siirtyä metsäruutuun ilman Overwatch-reaktiota
* Aimed Shot: saa bonuksen, jos ei liiku vuorolla
* Hunter's Mark: voi liikkua Marked-kohteen linjaa pitkin

### Rajoitukset

* tarvitsee Line of Sightin hyökkäyksiin
* heikko lähietäisyydellä
* ei voi ampua oman unitin läpi

### Taktinen tarkoitus

Ranger hallitsee:

* pitkiä linjoja
* avointa maastoa
* sivustaa
* korkeita paikkoja
* liikkuvaa ampumista

---

## 5.7 Artillery

### Liikkumistyyppi

King, erittäin rajattu

### Perusliike

* 1 ruutu kaikkiin suuntiin
* voi siirtyä 2 ruutua vain valmistautumisvuorolla

### Erikoissäännöt

* voi ampua pitkälle ilman liikkumista
* saa bonuskantaman, jos pysyy paikallaan
* voi sijoittaa Siege Mode -tilaan
* Siege Mode estää normaalin liikkeen

### Taktinen tarkoitus

Artillery pakottaa pelaajan päättämään:

> Liikunko turvaan vai pysynkö paikallani ja teen enemmän vahinkoa?

---

## 5.8 Healer

### Liikkumistyyppi

King + diagonaalinen yhden ruudun liike

### Perusliike

* 1 ruutu kaikkiin suuntiin

### Erikoissäännöt

* voi liikkua liittolaisen viereen Mend-kyvyllä
* voi vaihtaa paikkaa suojeltavan unitin kanssa
* voi teleportata Hearth-ruudulle
* saa lisäliikettä, jos parantaa kriittisesti haavoittunutta unitia

### Taktinen tarkoitus

Healerin liikkuminen keskittyy:

* turvallisuuteen
* etäisyyden säilyttämiseen
* liittolaisten saavuttamiseen
* kuoleman välttämiseen

---

## 5.9 Controller

### Liikkumistyyppi

Bishop, rajattu kantama

### Perusliike

* 1–3 ruutua diagonaalisesti

### Erikoissäännöt

* voi liikkua omien kontrollialueiden välillä
* voi luoda Root-, Slow- ja Silence-alueita
* voi vetäytyä, jos vihollinen tulee liian lähelle
* voi vaihtaa paikkaa kontrolloidun vihollisen kanssa tietyllä kyvyllä

### Taktinen tarkoitus

Controller liikkuu luodakseen:

* pullonkauloja
* ansa-alueita
* turvallisia kulmia
* vihollisen liikkeen rajoituksia

---

## 5.10 Frostbinder

### Liikkumistyyppi

Bishop

### Perusliike

* 1–3 ruutua diagonaalisesti

### Erikoissäännöt

* voi liikkua Frost Terrainilla ilman lisäkustannusta
* voi luoda Ice Wall -esteitä
* voi käyttää Frozen Groundia vihollisten reittien katkaisemiseen
* voi liikkua yhden ruudun Ice Wallin läpi kerran vuorossa

### Taktinen tarkoitus

Frostbinder ei ainoastaan liiku.

Se muuttaa koko liikkumiskartan.

---

## 5.11 Summoner

### Liikkumistyyppi

Pawn

### Perusliike

* 1 ruutu eteenpäin
* 1 ruutu sivulle vain tietyillä kyvyillä

### Erikoissäännöt

* voi luoda summon-unitin viereiseen ruutuun
* voi vaihtaa paikkaa summonin kanssa
* voi käyttää Summon Bridge -kykyä
* voi kutsua tilapäisen yksikön estämään reitin

### Taktinen tarkoitus

Summoner käyttää liikettä:

* tilan luomiseen
* vihollisten pysäyttämiseen
* pakoreittien rakentamiseen
* muodostelman laajentamiseen

---

## 5.12 Beastmaster

### Liikkumistyyppi

Knight + King hybrid

### Perusliike

* 1 ruutu kaikkiin suuntiin
* voi käyttää L-muotoista Hunt-liikettä eläinsummonin kanssa

### Erikoissäännöt

* Beastmaster ja peto voivat liikkua vuorotellen
* Guard-komento voi siirtää pedon liittolaisen viereen
* peto voi hypätä esteiden yli
* Beastmaster voi vaihtaa paikkoja pedon kanssa

### Taktinen tarkoitus

Beastmaster hallitsee kahta sijaintia samanaikaisesti:

* omaa sijaintia
* pedon sijaintia

---

## 5.13 Commander

### Liikkumistyyppi

Rook, rajattu kantama

### Perusliike

* 1–2 ruutua suoraan

### Erikoissäännöt

* voi antaa liittolaiselle yhden ruudun Reposition Orderin
* voi siirtää muodostelmaa
* voi käyttää Hold Formation -kykyä
* saa bonusliikettä, jos vähintään kaksi liittolaista on vierekkäisillä ruuduilla

### Taktinen tarkoitus

Commander ei tarvitse itse nopeaa liikettä.

Sen voima tulee siitä, että se muuttaa koko ryhmän liikkumista.

---

## 5.14 Scout

### Liikkumistyyppi

Knight

### Perusliike

* L-muotoinen liike
* voi hypätä unitien yli

### Erikoissäännöt

* voi liikkua piilotettujen ansojen yli
* voi paljastaa ruutuja liikkeen aikana
* voi käyttää Escape Route -kykyä
* saa bonusliikettä, jos liikkuu tutkimattomaan ruutuun

### Taktinen tarkoitus

Scout on:

* tiedustelija
* ansanpaljastaja
* sivustaja
* nopea pakoyksikkö

---

## 5.15 Spiritwalker

### Liikkumistyyppi

Bishop + Phase

### Perusliike

* 1–3 ruutua diagonaalisesti

### Erikoissäännöt

* voi liikkua esteiden läpi Spirit Phase -tilassa
* voi kulkea vihollisten kontrollialueiden läpi rajatusti
* voi teleportata Spirit Mark -ruutuun
* voi palata Hearth-ruudulle

### Rajoitukset

* Phase kuluttaa Spirit Energyä
* ei voi hyökätä samassa vuorossa Phase-liikkeen jälkeen ilman erikoiskykyä
* ei voi päättää vuoroa suljetun seinän sisään

### Taktinen tarkoitus

Spiritwalker rikkoo normaaleja reittejä, mutta maksaa siitä resursseja.

---

## 5.16 Chronomancer

### Liikkumistyyppi

Queen, vain erikoissäännöillä

### Perusliike

* 1 ruutu kaikkiin suuntiin

### Erikoissäännöt

* Rewind: palaa edelliseen sijaintiin
* Temporal Step: siirtyy aiemmin merkittyyn ruutuun
* Haste Time: antaa liittolaiselle bonusliikkeen
* Slow Time: vähentää vihollisen liikkumisaluetta
* Cooldown Echo: voi toistaa aiemman liikkeen rajoitetusti

### Taktinen tarkoitus

Chronomancer manipuloi:

* vuorojärjestystä
* sijainteja
* liikkeen ajoitusta
* virheiden korjaamista

---

# 6. Liikkumisen kustannukset

## 6.1 Movement Points

Jokaisella unitilla on:

```text
movementPointsMax
movementPointsRemaining
```

Esimerkki:

```json
{
  "movementPointsMax": 4,
  "movementPointsRemaining": 4
}
```

## 6.2 Ruutukustannukset

```text
Normal Ground: 1 MP
Forest: 1 MP
Deep Forest: 2 MP
Mud: 2 MP
Snow: 2 MP
Ice: 1 MP, mutta liike voi jatkua
Water: Ei sallittu
Mountain: Ei sallittu
Road: 0.5 MP
```

MVP-versiossa voidaan käyttää kokonaislukuja:

```text
Road: 1
Normal Ground: 1
Forest: 1
Mud: 2
Snow: 2
Deep Forest: 2
```

## 6.3 Class-kohtaiset maastobonukset

Esimerkiksi:

```text
Warden:
Forest = 1 MP

Frostbinder:
Ice = 1 MP

Mosskin:
Moss Terrain = 1 MP

Wildclaw:
Forest = 1 MP

Frostroot:
Snow = 1 MP

Fenborn:
Swamp = 1 MP
```

---

# 7. Liikkuminen ja hyökkäys

Liikkuminen ja hyökkäys ovat erillisiä toimintoja.

Unit voi yleensä:

1. liikkua
2. hyökätä
3. käyttää kykyä

Tai:

1. hyökätä
2. liikkua
3. käyttää reaktiota

## 7.1 Action Point -malli

Esimerkkisäännöt:

```text
Movement = MP
Attack = 1 AP
Ability = 1–3 AP
Guard = 1 AP
Special Movement = 1–2 AP
```

Unitilla voi olla:

```text
AP: 2
MP: 4
```

Esimerkiksi:

```text
Move 2 ruutua → 2 MP
Attack → 1 AP
Guard → 1 AP
```

## 7.2 Liikkeen ja hyökkäyksen yhdistelmät

Class voi määritellä:

* voiko hyökätä liikkeen jälkeen
* voiko liikkua hyökkäyksen jälkeen
* voiko liikkua hyökkäyksen aikana
* saako bonusliikettä tapon jälkeen
* saako hyökkäys lisäliikettä

Esimerkkejä:

```text
Assassin:
Move → Attack → Bonus Move

Ranger:
Move → Attack

Artillery:
No Move → Powerful Attack

Striker:
Attack → Short Move

Guardian:
Move → Guard

Chronomancer:
Move → Rewind
```

---

# 8. Kontrollialueet

Jokaisella melee-unitilla voi olla Threat Zone.

Normaali Threat Zone:

```text
XXX
XUX
XXX
```

Jos vihollinen poistuu kontrollialueelta, unit voi saada:

* Opportunity Attackin
* Slow-efektin
* Markin
* Rootin
* automaattisen reaktion

## 8.1 Class-kohtaiset kontrollialueet

### Guardian

* 8 viereistä ruutua
* voi estää liittolaisen ohittamisen

### Warden

* Thorn Boundaryn sisällä olevat ruudut
* voi rajoittaa kulkua

### Ranger

* suora Overwatch-linja
* ei normaalia melee-kontrollialuetta

### Assassin

* kontrollialue vain Marked-kohteen lähellä

### Frostbinder

* Ice Terrainin viereiset ruudut
* voi hidastaa poistuvia vihollisia

### Artillery

* pitkä Overwatch-linja
* heikko lähietäisyydellä

---

# 9. Esteet ja ruutujen käyttö

## 9.1 Esteiden tyypit

* seinä
* puu
* kallio
* jääseinä
* juurimuuri
* rakennus
* barricade
* yksikkö
* suljettu portti
* korkea maasto

## 9.2 Esteiden vaikutus

Este voi:

* estää liikkumisen
* estää Line of Sightin
* antaa Cover-bonuksen
* muuttaa liikkumiskustannusta
* mahdollistaa erikoisliikkeen
* hajota liikkumisreitin

## 9.3 Esteiden ylitys

Vain tietyt classit voivat:

* hypätä
* teleportata
* kulkea seinien läpi
* tuhota esteitä
* kiivetä
* kaivautua
* liikkua veden yli

---

# 10. Classien liikkumisidentiteetti

| Class        | Pääliike        | Tärkein ominaisuus             |
| ------------ | --------------- | ------------------------------- |
| Guardian     | King + Rook     | Linjan pitäminen                |
| Warden       | Rook            | Alueen hallinta                 |
| Juggernaut   | King + Charge   | Läpimurto                       |
| Striker      | King + Rook     | Hyökkäyksen jälkeinen liike     |
| Assassin     | Knight          | Takalinjaan pääsy               |
| Ranger       | Rook            | Etäisyys ja suorat linjat       |
| Artillery    | King            | Paikallaan pysymisen palkinto   |
| Healer       | King            | Liittolaisten saavuttaminen     |
| Controller   | Bishop          | Kulmien ja alueiden hallinta    |
| Frostbinder  | Bishop          | Maaston muuttaminen             |
| Summoner     | Pawn            | Tilapäisten reittien luominen   |
| Beastmaster  | Knight + King   | Kahden unitin koordinaatio      |
| Commander    | Rook            | Ryhmän liikuttaminen            |
| Scout        | Knight          | Tiedustelu ja pakoreitit        |
| Spiritwalker | Bishop + Phase  | Esteiden ohittaminen            |
| Chronomancer | King + Temporal | Ajan ja sijainnin manipulointi  |

---

# 11. Liikkumisen visualisointi

Kun pelaaja valitsee unitin, käyttöliittymä näyttää:

## 11.1 Siniset ruudut

Normaalisti saavutettavat ruudut.

## 11.2 Tummansiniset ruudut

Ruudut, joihin voi päästä erikoisliikkeellä.

## 11.3 Punaiset ruudut

Hyökkäyksen kohteet.

## 11.4 Keltaiset ruudut

Tavoite- tai objective-ruudut.

## 11.5 Violetit ruudut

Teleportti-, spirit- tai aikaliikkeen kohteet.

## 11.6 Harmaat ruudut

Estetyt tai saavuttamattomat ruudut.

## 11.7 Liikkumisreitti

Pelaajalle näytetään:

* valittu reitti
* MP-kustannus
* viimeinen pysähdyspaikka
* vihollisen kontrollialueet
* mahdolliset Opportunity Attackit
* vaaralliset ruudut
* saapumisen jälkeiset hyökkäyskohteet

Esimerkki:

```text
[ ][ ][ ][ ][ ]
[ ][B][B][ ][ ]
[ ][B][U][ ][ ]
[ ][ ][ ][ ][ ]
```

`B` = saavutettava ruutu
`U` = valittu unit

---

# 12. Liikkumisreitit ja pathfinding

Engine tarvitsee pathfinding-järjestelmän.

## 12.1 MVP

MVP käyttää:

* BFS- tai Dijkstra-hakua
* ruutukohtaista kustannusta
* classin liikkumissääntöä
* esteiden tarkistusta
* kontrollialueiden tarkistusta

## 12.2 Myöhemmin

Myöhemmin voidaan lisätä:

* A*
* vaaran arviointi
* vihollisen Threat Zone -ennuste
* vaihtoehtoiset reitit
* turvallisin reitti
* nopein reitti
* tavoitekohtainen reitti
* vihollisen AI:n taktinen pathfinding

## 12.3 Pathfindingin tulee palauttaa

```json
{
  "reachable": true,
  "path": [
    { "x": 3, "y": 4 },
    { "x": 3, "y": 5 },
    { "x": 4, "y": 5 }
  ],
  "movementCost": 3,
  "entersThreatZone": true,
  "triggersOpportunityAttack": true,
  "blockedBy": null
}
```

---

# 13. Engine Data Model

## 13.1 Movement Profile

```json
{
  "id": "movement.guardian",
  "pattern": "KING",
  "range": 1,
  "canJump": false,
  "canMoveThroughUnits": false,
  "canMoveThroughEnemies": false,
  "diagonalAllowed": true,
  "orthogonalAllowed": true,
  "requiresLineOfSight": false,
  "terrainModifiers": {},
  "specialRules": [
    "intercept",
    "hold_position",
    "protect_adjacent_ally"
  ]
}
```

## 13.2 Class Movement Configuration

```json
{
  "classId": "guardian",
  "movement": {
    "profileId": "movement.guardian",
    "movementPoints": 3,
    "movementActionCost": 0,
    "canMoveAndAttack": true,
    "canAttackAndMove": false,
    "canUseSpecialMovement": true,
    "specialMovementAbilities": [
      "guardian.intercept",
      "guardian.shield_charge"
    ]
  }
}
```

## 13.3 Movement Pattern Enum

```text
KING
ROOK
BISHOP
KNIGHT
QUEEN
PAWN
CUSTOM
TELEPORT
PHASE
CHARGE
SWAP
PULL
PUSH
BURROW
FLY
```

## 13.4 Movement Rule

```json
{
  "id": "movement.assassin",
  "pattern": "KNIGHT",
  "range": 1,
  "canJump": true,
  "canMoveThroughUnits": false,
  "canMoveThroughEnemies": false,
  "ignoresThreatZones": false,
  "requiresLineOfSight": false,
  "cost": 1
}
```

---

# 14. Movement Engine Interface

```text
MovementEngine
```

## Vastuut

* laskee saavutettavat ruudut
* tarkistaa classin liikkumissäännöt
* tarkistaa maaston
* tarkistaa esteet
* tarkistaa kontrollialueet
* laskee liikkumiskustannuksen
* palauttaa mahdolliset reitit
* käsittelee erikoisliikkeet
* lähettää movement-eventit

## API-esimerkki

```text
getReachableTiles(unitId, battlefieldState)
```

```text
getMovementPath(unitId, targetTile, battlefieldState)
```

```text
validateMovement(unitId, targetTile, battlefieldState)
```

```text
executeMovement(unitId, path)
```

```text
getThreatenedTiles(unitId, battlefieldState)
```

```text
getMovementPreview(unitId, battlefieldState)
```

---

# 15. Movement Events

Engine käyttää tapahtumia.

```text
MOVEMENT_STARTED
MOVEMENT_STEP
MOVEMENT_BLOCKED
MOVEMENT_COMPLETED
MOVEMENT_INTERRUPTED
ENTERED_TERRAIN
LEFT_TERRAIN
ENTERED_THREAT_ZONE
LEFT_THREAT_ZONE
OPPORTUNITY_ATTACK_TRIGGERED
SPECIAL_MOVEMENT_USED
TELEPORT_STARTED
TELEPORT_COMPLETED
PHASE_STARTED
PHASE_ENDED
CHARGE_STARTED
CHARGE_COLLISION
```

## Event-esimerkki

```json
{
  "type": "MOVEMENT_COMPLETED",
  "unitId": "unit.guardian.01",
  "from": {
    "x": 2,
    "y": 4
  },
  "to": {
    "x": 3,
    "y": 4
  },
  "movementCost": 1,
  "enteredThreatZone": false,
  "triggeredReaction": null
}
```

---

# 16. Liikkuminen ja statusvaikutukset

Statusvaikutukset voivat muuttaa liikettä.

| Status   | Vaikutus                                          |
| -------- | -------------------------------------------------- |
| Root     | Ei voi liikkua                                    |
| Slow     | MP-kustannus kasvaa                               |
| Freeze   | Ei voi liikkua                                    |
| Haste    | Lisää MP:tä                                       |
| Stun     | Menettää liikevuoron                              |
| Silence  | Ei voi käyttää teleportti- tai spirit-kykyjä      |
| Mark     | Tietty kohde voi seurata tai hyökätä              |
| Taunt    | Liikkuminen voi rajoittua kohti tauntin lähdettä  |
| Fear     | Liike voi muuttua pakoliikkeeksi                  |
| Burrowed | Voi käyttää maanalaista liikettä                  |
| Flying   | Voi ohittaa tietyt maastoesteet                   |

---

# 17. Liikkuminen ja maasto

## Autumnwood

* lehdet: normaali kustannus
* tiheä metsä: lisäkustannus
* juuret: voivat estää suoran liikkeen
* polut: halvempi liike
* syksyn sumu: rajoittaa näkyvyyttä

## Frostroot

* lumi: lisäkustannus
* jää: liike voi jatkua pidemmälle
* Ice Wall: este
* jääkenttä: liukumisefekti
* Frostbinder saa maastobonuksia

## Sunspire

* kivitasot: normaali kustannus
* aurinkopylväät: Line of Sight -esteitä
* pyhät ruudut: bonusliike Sunwarden-uniteille
* kuumuusalueet: voivat aiheuttaa Burnin

## Mirefall

* muta: korkea liikkumiskustannus
* suo: voi Rootata
* myrkyllinen vesi: vahingoittaa
* sumu: rajoittaa näkyvyyttä
* Fenborn saa liikkumisbonuksia

---

# 18. Enemy AI ja liikkuminen

Vihollisten tulee käyttää samoja sääntöjä kuin pelaajan unitit.

Enemy AI arvioi:

1. saavutettavat ruudut
2. hyökkäyskohteet
3. suojaruudut
4. kontrollialueet
5. tavoitteet
6. pakoreitit
7. vihollisen vaaralliset ruudut
8. classin taktisen tarkoituksen

## AI-liikkumisprioriteetit

### Guardian enemy

* suojaa bossia
* pitää käytävän
* estää pelaajan etenemistä

### Assassin enemy

* etsii healeria
* kiertää frontlinen
* hyökkää heikkoon kohteeseen

### Ranger enemy

* etsii Line of Sightin
* pysyy kaukana melee-uniteista
* käyttää korkeaa maastoa

### Controller enemy

* sulkee reittejä
* luo alueita
* pakottaa pelaajan kiertämään

---

# 19. Liikkumisen tasapainosäännöt

## 19.1 Jokaisella liikkeellä pitää olla heikkous

Esimerkiksi:

* Rook-liike on vahva käytävissä mutta heikko diagonaalisesti.
* Bishop-liike on vahva avoimella kentällä mutta heikko suorissa käytävissä.
* Knight-liike ohittaa esteitä mutta sillä on rajattu kohdevalinta.
* King-liike on turvallinen mutta hidas.
* Queen-liike on joustava mutta harvinainen.
* Pawn-liike on ennakoitava mutta helposti pysäytettävä.

## 19.2 Liikkumisnopeus ei saa yksin ratkaista taistelua

Nopea unit voi olla:

* hauras
* heikosti panssaroitu
* riippuvainen asemoinnista
* riippuvainen cooldownista
* heikko kontrollialueilla

## 19.3 Teleportaatio ei saa ohittaa kaikkia sääntöjä

Teleportaatio voi olla rajoitettu:

* kantamalla
* näkyvyyteen
* Spirit Energyyn
* cooldowniin
* laskeutumisruutuun
* vihollisen kontrollialueisiin

## 19.4 Liikkumisen tulee olla ennakoitavaa

Pelaajan pitää nähdä:

* mihin voi liikkua
* paljonko liike maksaa
* laukeaako reaktio
* voiko vihollinen hyökätä
* pääseekö unit hyökkäysetäisyydelle
* jääkö unit vaaralliseen paikkaan

---

# 20. MVP-liikkumisjärjestelmä

## MVP-luokat

Ensimmäiseen versioon toteutetaan:

1. Guardian — King movement
2. Ranger — Rook movement
3. Assassin — Knight movement
4. Healer — King movement
5. Controller — Bishop movement
6. Summoner — Pawn movement

## MVP-ominaisuudet

* 2D ruudukko
* 8-suuntaiset naapuriruudut
* King movement
* Rook movement
* Bishop movement
* Knight movement
* Pawn movement
* Movement Points
* esteet
* maastokustannukset
* liikkumispreview
* pathfinding
* kontrollialueet
* Opportunity Attack
* liikkeen peruminen ennen vahvistusta
* Movement Engine
* movement-eventit
* combat log
* deterministic movement

## MVP:n ulkopuolelle

* Queen movement
* teleportaatio
* phase movement
* lentäminen
* burrow
* aikamatkustus
* monimutkainen korkeusero
* monikerroksiset taistelukentät

---

# 21. Acceptance Criteria

Järjestelmä hyväksytään, kun:

* unitit liikkuvat ruudukossa.
* jokaisella classilla voi olla oma movement pattern.
* Guardian ei voi liikkua kuten Assassin.
* Assassin voi käyttää Knight-liikettä.
* Ranger voi käyttää suoraviivaista liikettä.
* Controller voi käyttää diagonaalista liikettä.
* esteet estävät normaalin liikkeen.
* Knight-liike voi hypätä unitien yli.
* liikkumiskustannukset lasketaan oikein.
* pelaaja näkee saavutettavat ruudut.
* pelaaja näkee liikkumisen kustannuksen.
* pelaaja näkee vaaralliset ruudut.
* kontrollialueet toimivat.
* Opportunity Attack voidaan laukaista.
* statusvaikutukset voivat estää tai rajoittaa liikettä.
* viholliset käyttävät samaa Movement Engineä.
* liikkuminen voidaan toistaa samalla seedillä.
* kaikki movement-eventit kirjataan Combat Logiin.
* classin liikkumissäännöt ovat data-driven.
* uusia movement profileja voidaan lisätä ilman Movement Enginen uudelleenkirjoittamista.

---

# 22. Lopullinen tavoite

Hearthwoodin liikkumisjärjestelmän tulee tehdä jokaisesta unitista taktisesti erilainen.

Pelaaja ei ajattele vain:

> "Mihin voin mennä?"

Pelaaja ajattelee:

> "Miten tämän classin liike muuttaa koko taistelukentän?"

Guardian pitää linjan.

Ranger hallitsee suoria ampumalinjoja.

Assassin ohittaa puolustuksen.

Warden lukitsee alueita.

Frostbinder muuttaa maastoa.

Summoner rakentaa uusia reittejä.

Spiritwalker rikkoo esteet.

Chronomancer muuttaa liikkeen ajoitusta.

Näin shakkimainen liikkuminen muodostaa Hearthwoodin taktisen ytimen.
