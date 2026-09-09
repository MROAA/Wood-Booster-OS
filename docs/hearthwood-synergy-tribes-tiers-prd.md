> **North-star design doc — the unit/build architecture.** Marc pasted
> this in full on 2026-09-09, during the economy-crew round (PR #430,
> which itself implements this doc's §11 / §44 / §50 "Economy synergy —
> Merchant + Banker + Forager = economic build"). It specifies the
> three-layer unit model (Tribe → Role → Tier), a **behavioural**
> synergy system (synergies change how the squad *plays*, not just
> +stat — §8-9, §18), 7 synergy types (tribe / role / tag / status /
> elemental / **economy** / death — §11), cross-tribe hybrids as
> first-class builds (§12, §69-74), a 5-tier rarity model where **tier ≠
> value** (§24-33, §75, §85), the star-up / evolution paths (§34-37), a
> unit data model (§98) + synergy (§99) + tribe (§100) + tier (§101)
> shape, and acceptance checklists for a new unit (§95), synergy (§96)
> and tier (§97). Its proposed core tribes (Rootborn / Mosskin /
> Wildclaw / Mycelian / Sunwarden / Frostroot / Fenborn / Ashen) are a
> *rename/reframe* of the shipped 13-tribe set (`synergies.js` `TRIBES`:
> grove / thorn / wood / fang / ember / stone / warden / …) — treat as
> direction, not a migration order. Slice one system per round behind
> the fairness gate; run new units through §95's 10-point checklist.
> Related: docs/hearthwood-unit-roles-build-system-prd.md (its nearest
> sibling — roles/tags/positioning), docs/hearthwood-economy-system-prd.md,
> docs/hearthwood-strategic-foundation-prd.md,
> docs/hearthwood-combat-system-v2-prd.md,
> docs/hearthwood-seed-playstyle-systems-prd.md,
> docs/hearthwood-adaptive-enemy-build-ai-prd.md.

---

# HEARTHWOOD

## PRD — Synergy System, Tribes & Unit Tiers

### Strategic Unit & Build Architecture

**Version:** 1.0
**Status:** Master Gameplay Specification
**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy

---

# 1. SYSTEM VISION

Hearthwoodin yksikköjärjestelmän kolme peruspilaria ovat:

```text
TRIBE
↓
UNIT
↓
TIER
↓
SYNERGY
↓
BUILD
```

Näiden tarkoitus ei ole tehdä yksiköistä pelkkiä numeroita.

Yksikön arvo syntyy siitä:

* mihin heimoon se kuuluu
* mikä sen rooli on
* kuinka harvinainen se on
* mitä se osaa yksin
* minkä muiden yksiköiden kanssa se toimii
* mitä upgradeja se saa
* miten se sijoitetaan
* millaisen buildin pelaaja rakentaa sen ympärille

---

# 2. CORE DESIGN PRINCIPLE

> **A unit should be useful alone, but become interesting with others.**

Yksikkö ei saa olla täysin hyödytön ilman synergiaa.

Samalla synergy ei saa tarkoittaa vain:

```text
3 Forest
= +10% HP
```

Synergian pitää muuttaa sitä, **miten joukkue pelaa**.

---

# 3. THREE-LAYER UNIT MODEL

Jokaisella yksiköllä on kolme strategista identiteettikerrosta.

## Layer 1 — Tribe

Kuka yksikkö on maailmassa?

## Layer 2 — Role

Mitä yksikkö tekee combatissa?

## Layer 3 — Tier

Kuinka harvinainen ja voimakas yksikkö on?

Esimerkiksi:

```text
MOSS GUARDIAN

Tribe:
Rootborn

Role:
Tank / Protector

Tier:
2
```

Sen jälkeen synergyt määrittävät, miten se toimii muiden kanssa.

---

# 4. TRIBES

Heimo kertoo Hearthwoodin maailmasta ja rakentaa yhden tärkeimmistä build-akselista.

Heimo vaikuttaa:

* unit pooleihin
* synergioihin
* itemeihin
* relickeihin
* eventteihin
* biomeihin
* loreen
* vihollisiin
* economy-mahdollisuuksiin

---

# 5. TRIBE ≠ CLASS

Heimo ei ole luokka.

Esimerkiksi Rootborn-heimon jäsen voi olla:

* Tank
* Healer
* DPS
* Support
* Control

Sama heimo voi siis rakentaa erilaisia buildeja.

```text
TRIBE
≠
ROLE
```

Tämä on erittäin tärkeä sääntö.

---

# 6. CORE TRIBES

Hearthwoodin alkuperäinen heimojärjestelmä voidaan rakentaa esimerkiksi seuraavista pääheimoista:

## ROOTBORN

Metsän vanhat juuret.

Teemat:

* defense
* growth
* healing
* protection
* regeneration

Tyypillinen pelityyli:

> pitkä peli ja vahva frontline.

---

## MOSSKIN

Pienet metsän olennot.

Teemat:

* swarm
* utility
* poison
* resource generation
* adaptation

Pelityyli:

> paljon pieniä yksiköitä ja jatkuvaa etua.

---

## WILDCLAW

Metsän pedot.

Teemat:

* aggression
* burst
* mobility
* critical strikes
* hunting

Pelityyli:

> nopea ja aggressiivinen tempo.

---

## MYCELIAN

Sienimetsän olennot.

Teemat:

* poison
* decay
* resurrection
* spreading effects
* status manipulation

Pelityyli:

> vihollisen kuluttaminen ja statuskontrolli.

---

## SUNWARDEN

Auringon ja valon vartijat.

Teemat:

* radiant damage
* shields
* cleansing
* burst
* support

Pelityyli:

> turvallinen mutta voimakas mid/late game.

---

## FROSTROOT

Jään ja vanhojen juurten olennot.

Teemat:

* freeze
* slow
* defense
* control
* preservation

Pelityyli:

> vihollisen hidastaminen ja kontrollointi.

---

## FENBORN

Suon ja mutaisen metsän olennot.

Teemat:

* corruption
* poison
* risk
* sacrifice
* debuffs

Pelityyli:

> korkea riski / korkea palkinto.

---

## ASHEN

Palaneen metsän selviytyjät.

Teemat:

* sacrifice
* damage
* rebirth
* burn
* destruction

Pelityyli:

> yksiköiden kuoleman hyödyntäminen.

---

# 7. TRIBE DESIGN RULE

Jokaisella heimolla tulee olla:

```text
IDENTITY
+
STRENGTH
+
WEAKNESS
+
COUNTER
+
UNIQUE INTERACTIONS
```

Esimerkiksi:

```text
WILDCLAW

Strength:
Burst

Weakness:
Fragility

Counter:
Armor / Control

Unique:
Hunt mechanics
```

---

# 8. TRIBE SYNERGY

Kun pelaaja kerää saman heimon yksiköitä, tribe synergy aktivoituu.

Esimerkiksi:

```text
2 ROOTBORN
→ Rooted Protection I

4 ROOTBORN
→ Rooted Protection II

6 ROOTBORN
→ Ancient Forest
```

Mutta bonukset eivät saa olla pelkkää statin kasvattamista.

---

# 9. BEHAVIORAL SYNERGY

Parempi synergy:

```text
2 Rootborn
→ frontline units gain Guard

4 Rootborn
→ Guard creates healing pulses

6 Rootborn
→ Guarded allies grow stronger when attacked
```

Synergy muuttaa combatia.

---

# 10. SYNERGY LEVELS

Synergyllä voi olla esimerkiksi neljä tasoa:

```text
2
4
6
8
```

Mutta kaikkien heimojen ei tarvitse käyttää samaa breakpoint-rakennetta.

Joillakin voi olla:

```text
3 / 5 / 7
```

tai:

```text
2 / 3 / 5
```

Tämä lisää heimojen strategista identiteettiä.

---

# 11. SYNERGY TYPES

Hearthwoodissa on useita synergy-tyyppejä.

## TRIBE SYNERGY

Sama heimo.

```text
Rootborn + Rootborn
```

## ROLE SYNERGY

Samat tai täydentävät roolit.

```text
Tank + Support
```

## TAG SYNERGY

Yksiköiden erityistagit.

```text
Beast
Hunter
Poison
Summoner
```

## STATUS SYNERGY

Status effects.

```text
Poison + Decay
```

## ELEMENTAL SYNERGY

Maailman voimat.

```text
Fire + Ash
Frost + Root
Light + Sun
```

## ECONOMY SYNERGY

Talous.

```text
Merchant + Banker
```

## DEATH SYNERGY

Kuolema ja sacrifice.

```text
Ashen + Sacrifice
```

---

# 12. CROSS-TRIBE SYNERGY

Kaikki parhaat buildit eivät saa olla yhden heimon buildit.

Pelaaja voi yhdistää heimoja.

Esimerkiksi:

```text
Rootborn
+
Sunwarden
```

tuottaa:

> defensive healing build.

Tai:

```text
Wildclaw
+
Mosskin
```

tuottaa:

> swarm hunting build.

Tai:

```text
Mycelian
+
Fenborn
```

tuottaa:

> poison corruption build.

---

# 13. SYNERGY GRAPH

Synergyjärjestelmä voidaan ajatella graafina:

```text
                 ROOTBORN
                /        \
          DEFENSE         HEALING
            /               \
       SUNWARDEN -------- SUPPORT
            \
           SHIELD
```

Yksi yksikkö voi yhdistää useita haaroja.

---

# 14. UNIT TAG SYSTEM

Jokaisella yksiköllä voi olla:

### Tribe

```text
Rootborn
```

### Role

```text
Tank
```

### Tags

```text
Guardian
Ancient
Nature
Defender
```

### Mechanics

```text
Shield
Heal
Guard
```

Tämä mahdollistaa erittäin joustavan synergyjärjestelmän.

---

# 15. TAG SYNERGIES

Esimerkiksi:

```text
3 Guardian
→ Guardians gain Protection

2 Ancient
→ Ancient units gain Growth

3 Nature
→ Nature effects last longer
```

Tämä mahdollistaa buildit, joissa heimo ei ole tärkein asia.

---

# 16. ROLE SYNERGIES

Role-pohjaiset synergiat täydentävät heimoja.

Esimerkiksi:

```text
2 Tanks
→ Frontline Protection

2 Supports
→ Ability Recharge

2 DPS
→ Focus Fire

1 Tank + 1 Healer
→ Protected Recovery
```

Näin pelaaja voi rakentaa toimivan joukkueen myös ilman täydellistä tribe-synergiaa.

---

# 17. SYNERGY PRIORITY

Synergyjärjestelmän pitäisi toimia kolmella tasolla:

```text
BASE
Unit is useful alone.

COMBINATION
Unit becomes stronger with allies.

BUILD
Multiple interactions create an archetype.
```

---

# 18. SYNERGY SHOULD CHANGE BEHAVIOR

Huono:

```text
+10% damage
```

Hyvä:

```text
When a Rootborn unit blocks damage,
nearby allies gain Regrowth.
```

Synergy siis muuttaa päätöksiä ja combatia.

---

# 19. SYNERGY CHAIN

Synergiat voivat muodostaa ketjuja.

Esimerkiksi:

```text
Rootborn
↓
Guard
↓
Damage Taken
↓
Healing Pulse
↓
Nature Trigger
↓
Ability Recharge
```

Yksi tapahtuma voi käynnistää useita järjestelmiä.

---

# 20. SYNERGY BREAKPOINTS

Breakpointin saavuttaminen saa tuntua suurelta.

Esimerkiksi:

```text
3/4 ROOTBORN

ONE MORE UNIT

→ ANCIENT FOREST ACTIVATED
```

UI:n pitää tehdä tämä hetki näkyväksi.

---

# 21. SYNERGY ACTIVATION FEEL

Kun synergy aktivoituu:

* UI korostuu
* pieni visuaalinen efekti
* selkeä ilmoitus
* combatissa näkyvä vaikutus
* unit portrait reagoi

Tavoite:

> **"YES! Sain sen toimimaan."**

---

# 22. PARTIAL SYNERGY

Pelaajan ei pidä aina joutua saavuttamaan breakpointia.

Esimerkiksi:

```text
1 Rootborn
→ no bonus

2 Rootborn
→ small interaction

3 Rootborn
→ major effect

4 Rootborn
→ specialization
```

Näin yksittäinen unit voi silti olla hyödyllinen.

---

# 23. SYNERGY OVERLOAD PREVENTION

Kaikkia synergyjä ei näytetä yhtä aikaa.

UI näyttää:

### Active

Tärkeimmät aktiiviset synergiat.

### Near

Synergiat, jotka ovat lähellä breakpointia.

### Available

Mahdolliset synergyt.

### Advanced

Kaikki tag- ja hidden interactions.

---

# 24. UNIT TIERS

Unit tier määrittelee yksikön harvinaisuuden ja yleisen power budgetin.

Perusmalli:

```text
TIER 1
Common

TIER 2
Uncommon

TIER 3
Rare

TIER 4
Epic

TIER 5
Mythic
```

---

# 25. TIER DOES NOT EQUAL VALUE

Tier 5 ei automaattisesti tarkoita:

> "aina parempi kuin Tier 2."

Tier määrittelee:

* rarity
* complexity
* power ceiling
* shop availability
* upgrade potential

Mutta Tier 2 voi olla buildin kannalta tärkeämpi.

---

# 26. TIER 1 — FOUNDATION

Tier 1 -yksiköt ovat:

* helposti ymmärrettäviä
* yleisiä
* buildin perustuksia
* selkeitä rooleja

Esimerkki:

```text
Moss Guard

Tank

Simple:
Protects nearby allies.
```

---

# 27. TIER 2 — SPECIALIZATION

Tier 2 tuo:

* enemmän identityä
* ensimmäisiä build hooks
* vahvempia synergioita

Esimerkiksi:

```text
Root Medic

Healer

Synergy:
Rootborn
Nature
```

---

# 28. TIER 3 — BUILD DEFINING

Tier 3 -yksiköt voivat määrittää buildin suunnan.

Esimerkiksi:

```text
Mycelian Plaguecaller

Control / Debuffer

Build Hook:
Poison spreads when enemies die.
```

---

# 29. TIER 4 — BUILD CORE

Tier 4 -yksiköt ovat:

* erittäin voimakkaita
* harvinaisia
* buildin core-yksiköitä
* monimutkaisempia

Esimerkiksi:

```text
Ancient Warden

Tank / Support

Build Hook:
Damage taken by allies becomes Regrowth.
```

---

# 30. TIER 5 — MYTHIC

Tier 5 -yksiköt ovat Hearthwoodin harvinaisia strategisia huippuja.

Niillä voi olla:

* ainutlaatuisia mekaniikkoja
* useita rooleja
* build-transforming vaikutuksia
* voimakkaita downsideja

Tärkeä sääntö:

> Tier 5 ei saa tarkoittaa automaattista voittoa.

---

# 31. MYTHIC DESIGN

Tier 5 -yksikkö voi esimerkiksi sanoa:

```text
THE HEART OF THE GROVE

Ancient / Nature / Spirit

All Nature synergies count as +1.

BUT

Only one Heartborn unit may be fielded.
```

Näin yksikkö muuttaa koko buildin rakennetta.

---

# 32. TIER POWER BUDGET

Jokaisella tierillä on oma power budget.

```text
T1
Low power / high availability

T2
Moderate power / specialization

T3
High power / build influence

T4
Very high power / core

T5
Exceptional power / transformative
```

---

# 33. TIER + COMPLEXITY

Tierin noustessa ei tarvitse vain lisätä damagea.

Sen sijaan:

```text
T1
Simple effect

T2
Combination

T3
Interaction

T4
Build transformation

T5
System transformation
```

---

# 34. UNIT STAR / UPGRADE SYSTEM

Sama yksikkö voidaan yhdistää duplicate-yksiköillä.

Esimerkiksi:

```text
3 × Moss Guard
↓
2★ Moss Guard

3 × 2★ Moss Guard
↓
3★ Moss Guard
```

Mutta upgrade ei saa olla vain:

```text
+HP
+Damage
```

---

# 35. STAR UPGRADE DESIGN

Upgrade voi:

* muuttaa abilityä
* avata uuden synergy-interaktion
* muuttaa roolia
* antaa uuden target-priorityn
* lisätä status-interaktion
* muuttaa economy-vaikutusta

---

# 36. UNIT EVOLUTION

Jotkut yksiköt voivat kehittyä vaihtoehtoisesti.

Esimerkiksi:

```text
Moss Guard
       |
       +---- Ironbark Guardian
       |
       +---- Grove Protector
       |
       +---- Thorn Vanguard
```

Pelaaja valitsee suunnan.

---

# 37. EVOLUTION AS STRATEGY

Valinta voi riippua buildistä.

```text
Ironbark
→ Defense

Grove Protector
→ Healing

Thorn Vanguard
→ Damage
```

Näin sama lähtöyksikkö voi muuttua eri rooleihin.

---

# 38. UNIT ROLE + TRIBE + TIER

Jokainen yksikkö voidaan kuvata:

```text
UNIT
├── TRIBE
├── PRIMARY ROLE
├── SECONDARY ROLE
├── TIER
├── TAGS
├── ABILITY
├── SYNERGIES
├── UPGRADE PATH
└── WEAKNESS
```

---

# 39. UNIT DESIGN TEMPLATE

Jokaiselle unitille:

```text
Name:
Tribe:
Tier:

Primary Role:
Secondary Role:

Tags:

Core Mechanic:

Strength:

Weakness:

Ability:

Target Priority:

Synergies:

Upgrade Path:

Item Affinity:

Countered By:

Counters:
```

---

# 40. UNIT WEAKNESS

Jokaisella yksiköllä tulee olla ainakin yksi selkeä heikkous.

Esimerkiksi:

```text
High Damage
Low Defense
```

tai:

```text
Strong Control
Low DPS
```

tai:

```text
Amazing Economy
Weak Combat
```

Heikkous luo build-päätöksiä.

---

# 41. UNIT AFFINITY

Yksiköillä voi olla affinityjä:

```text
Nature
Fire
Frost
Decay
Spirit
Beast
Ancient
Arcane
```

Affinityt mahdollistavat cross-system-synergiat.

---

# 42. ITEM + UNIT SYNERGY

Itemit voivat tunnistaa:

```text
Tribe
Role
Tag
Ability
Status
```

Esimerkiksi:

```text
Thorn Crown

Best on:
Guardian / Nature

Effect:
Blocking damage applies Thorn.
```

---

# 43. RELIC + TRIBE

Relicit voivat muuttaa kokonaisen heimon toimintaa.

Esimerkiksi:

```text
RELIC:
Heart of Roots

Effect:
Rootborn units trigger Growth
one additional time per combat.
```

Tämä voi muuttaa koko runin buildin.

---

# 44. SYNERGY + ECONOMY

Jotkut synergyt voivat vaikuttaa talouteen.

Esimerkiksi:

```text
Mosskin 3
→ +1 Gold after first win

Mosskin 5
→ chance to find extra resource
```

Näin tribe voi vaikuttaa myös economyyn.

---

# 45. SYNERGY + POSITION

Synergy voi riippua sijoittelusta.

Esimerkiksi:

```text
Rootborn:
Adjacent allies gain Guard.

Sunwarden:
Backline units gain Radiance.
```

Tämä yhdistää:

```text
TRIBE
+
POSITION
```

---

# 46. SYNERGY + STATUS

Esimerkiksi:

```text
Mycelian
+
Poison
+
Decay
```

voi aiheuttaa:

```text
Poisoned enemies spread Decay
when damaged.
```

---

# 47. SYNERGY + DEATH

Ashen:

```text
When an Ashen unit dies:
Allies gain Ember.
```

Silloin kuoleminen voi olla osa strategiaa.

---

# 48. SYNERGY + HEALING

Rootborn:

```text
Healing a fully healed ally
creates Growth.
```

Tämä muuttaa overhealingin resurssiksi.

---

# 49. SYNERGY + CONTROL

Frostroot:

```text
Slowed enemies take increased Control duration.
```

Pelaaja voi rakentaa:

```text
Slow
→ Freeze
→ Control
→ Damage
```

---

# 50. SYNERGY + ECONOMY

Merchant:

```text
Shop discounts
```

Banker:

```text
Interest
```

Forager:

```text
Combat rewards
```

Yhdessä:

```text
Merchant
+
Banker
+
Forager
=
Economic Build
```

---

# 51. CROSS-SYSTEM SYNERGY

Parhaat synergyt voivat yhdistää useita järjestelmiä.

Esimerkiksi:

```text
Rootborn
+
Healing
+
Economy
+
Position
```

voi tuottaa täysin uuden buildin.

---

# 52. SYNERGY DISCOVERY

Pelaajan pitää pystyä löytämään synergyjä.

Discovery voi tapahtua:

* combatissa
* codexissa
* tooltipissa
* eventissä
* itemissä
* unit upgradeissa

---

# 53. HIDDEN DISCOVERY

Joidenkin yhdistelmien ei tarvitse olla etukäteen ilmeisiä.

Mutta kun ne aktivoituvat, peli kertoo:

```text
NEW INTERACTION DISCOVERED
```

Näin pelaaja kokee löytämisen.

---

# 54. NO UNREADABLE HIDDEN RULES

Hidden interaction saa olla yllätys.

Sen ei saa olla epäoikeudenmukainen.

Kun pelaaja löytää sen:

> "Ahaa!"

ei:

> "Mistä minun olisi pitänyt tietää tämä?"

---

# 55. SYNERGY DISCOVERY REWARD

Ensimmäisestä löydöstä voidaan antaa:

* codex entry
* lore
* cosmetic
* achievement
* small meta unlock

Ei kuitenkaan suurta pysyvää poweria.

---

# 56. SYNERGY GRAPH PER RUN

Runin aikana voidaan näyttää:

```text
CURRENT BUILD

Rootborn ████
Nature   ███
Healing  ██
Guardian ███
Growth   █
```

Pelaaja näkee oman buildinsa muotoutuvan.

---

# 57. NEAR SYNERGY

UI näyttää:

```text
ROOTBORN
3 / 4

Need:
1 more Rootborn unit
```

Mutta peli ei pakota pelaajaa hankkimaan sitä.

---

# 58. SYNERGY BAIT

Shop voi tarjota:

```text
Rare Rootborn
```

mutta pelaaja on rakentamassa:

```text
Wildclaw
```

Pelaajan pitää päättää:

> "Onko synergy sen arvoinen?"

Tämä on strateginen valinta.

---

# 59. SYNERGY PIVOT

Pelaaja voi vaihtaa buildia synergy-löydön perusteella.

Esimerkiksi:

```text
Current:
Wildclaw

Found:
Mycelian Plaguecaller

New opportunity:
Poison Build
```

Pelaaja voi pivotata.

---

# 60. SYNERGY FAILURE

Jos synergy ei toimi:

```text
Why?
```

Peli voi kertoa:

```text
Your build has strong Poison,
but lacks enough sustained damage.

Suggested considerations:
- Burst
- Control
- Scaling
```

Ei yhtä pakotettua ratkaisua.

---

# 61. UNIT POOL

Shopin unit pool riippuu:

```text
RUN SEED
+
BIOME
+
SHOP TIER
+
PLAYER STATE
+
UNIT AVAILABILITY
```

Tämä mahdollistaa strategisen draftingin.

---

# 62. UNIT CONTESTING

Jos sama unit on harvinainen ja vihollinen käyttää sitä:

```text
Enemy owns:
3 Moss Guardians
```

pelaajan mahdollisuus löytää niitä voi muuttua.

Tämä lisää strategista kilpailua.

---

# 63. SHARED WORLD POOL

Mahdollinen advanced-mekaniikka:

Pelaajan ja vihollisen unit pool voi olla osittain yhteinen.

Tämä tekee:

```text
DRAFTING
+
SCOUTING
+
DENIAL
```

merkitykselliseksi.

---

# 64. UNIT AVAILABILITY

Harvinaisuus:

```text
T1
Very common

T2
Common

T3
Less common

T4
Rare

T5
Extremely rare
```

Tarkat poolimäärät määritellään balance-dokumentissa.

---

# 65. TIER DISTRIBUTION

Early game:

```text
T1
T2
```

Mid game:

```text
T2
T3
T4
```

Late game:

```text
T3
T4
T5
```

Tämä luo progression.

---

# 66. TIER + SHOP TIER

Shop Tier määrää todennäköisyyden löytää korkeampia unit-tierryjä.

```text
Shop 1
→ T1

Shop 2
→ T1 / T2

Shop 3
→ T2 / T3

Shop 4
→ T3 / T4

Shop 5
→ T4 / T5
```

Todennäköisyydet balance-testataan.

---

# 67. RARITY PROTECTION

Huono RNG ei saa lukita pelaajaa kokonaan.

Peli voi käyttää:

* pity
* targeted reroll
* tribe discovery
* controlled pool
* event rewards
* choice rewards

---

# 68. TRIBE DIVERSITY

Jokaisen heimon pitää tarjota vähintään:

* frontline possibility
* damage possibility
* support possibility
* unique mechanic

Kaikkien ei tarvitse olla yhtä hyviä jokaisessa roolissa.

---

# 69. TRIBE HYBRIDIZATION

Heimoja voidaan yhdistää.

Esimerkiksi:

```text
Rootborn
+
Frostroot
=
Frozen Fortress
```

tai:

```text
Wildclaw
+
Sunwarden
=
Radiant Hunt
```

tai:

```text
Mycelian
+
Fenborn
=
Rot Swarm
```

---

# 70. BUILD ARCHETYPES GENERATED BY SYSTEM

Peli ei määrittele jokaista buildia käsin.

Build syntyy:

```text
Tribe
+
Roles
+
Tags
+
Items
+
Relics
+
Position
+
Economy
```

---

# 71. EXAMPLE BUILD

## "THE ANCIENT GROVE"

```text
Rootborn
× 4

Nature
× 4

Guardian
× 3

Healing
× 2
```

Core:

```text
Ancient Warden
Root Medic
Moss Guard
Grove Protector
```

Strategy:

> absorboi damage → heal → scale → outlast.

---

# 72. EXAMPLE BUILD

## "THE WILD HUNT"

```text
Wildclaw
× 4

Hunter
× 3

Beast
× 3
```

Strategy:

> identify weak target → focus → execute → snowball.

---

# 73. EXAMPLE BUILD

## "THE ROT"

```text
Mycelian
× 4

Fenborn
× 3

Poison
× 4

Decay
× 2
```

Strategy:

> stack statuses → spread → deny healing → overwhelm.

---

# 74. EXAMPLE HYBRID

## "SUNROOT"

```text
Rootborn
× 3

Sunwarden
× 3

Guardian
× 2

Radiance
× 2
```

Strategy:

> defensive frontline + radiant support.

Tämä buildi ei tarvitse kuutta saman heimon yksikköä ollakseen tehokas.

---

# 75. UNIT POWER ≠ BUILD POWER

Yksi erittäin tärkeä sääntö:

```text
STRONG UNIT
≠
STRONG BUILD
```

ja:

```text
AVERAGE UNIT
+
CORRECT SYNERGY
=
STRONG BUILD
```

Tämä pitää draftin kiinnostavana.

---

# 76. CARRY SYSTEM

Buildillä voi olla:

### Core Carry

Pääasiallinen damage / win condition.

### Secondary Carry

Varasuunnitelma.

### Support Core

Yksiköt, jotka mahdollistavat carryn.

Esimerkiksi:

```text
Carry
↑
Support
↑
Tank
↑
Economy
```

---

# 77. SYNERGY SUPPORT

Kaikkien yksiköiden ei tarvitse tehdä damagea.

Yksikön tehtävä voi olla:

> tehdä toinen yksikkö paremmaksi.

Tämä on tärkeää synergiapohjaisessa auto-battlerissa.

---

# 78. UNIT SACRIFICE VALUE

Joskus yksikkö voi olla arvokas myös kuollessaan.

Esimerkiksi:

```text
Ashen Scout

On Death:
Apply Burn
+
Generate Ember
```

Tällainen unit muuttaa sijoittelun merkitystä.

---

# 79. TEMPORARY UNITS

Eventit voivat antaa väliaikaisia yksiköitä.

Ne voivat olla:

* erittäin vahvoja
* niche
* riskialttiita
* biome-specific

Näin pelaaja voi kokeilla uusia strategioita ilman pysyvää sitoutumista.

---

# 80. TRIBE COUNTERPLAY

Heimoilla ei saa olla täydellistä counteria.

Esimerkiksi:

```text
Poison-heavy Mycelian
```

voidaan haastaa:

* cleanse
* burst
* resistance
* anti-status
* fast combat

Mutta Mycelian voi vastata:

* spread
* anti-cleanse
* control
* alternate damage

---

# 81. STRATEGIC TRIANGLE

Jokainen build voidaan analysoida:

```text
POWER
SURVIVAL
UTILITY
```

Buildin ei pitäisi maksimoida kaikkia kolmea ilman kustannuksia.

---

# 82. UNIT DESIGN QUALITY

Jokaisen yksikön pitää vastata:

### Miksi haluan tämän?

### Mitä tämä tekee?

### Mitä tämä mahdollistaa?

### Mitä tämä ei osaa tehdä?

### Minkä kanssa tämä toimii?

### Mitä vastaan tämä on heikko?

---

# 83. SYNERGY DESIGN QUALITY

Jokaisen synergian pitää vastata:

### Mitä se muuttaa?

### Mikä sen breakpoint on?

### Mikä sen tradeoff on?

### Mitä vastaan se on heikko?

### Voiko pelaaja pivotata siitä pois?

---

# 84. TIER DESIGN QUALITY

Jokaisen tierin pitää vastata:

### Miksi tämä on harvinaisempi?

### Mitä uutta se tarjoaa?

### Onko sen power erilainen vai vain suurempi?

### Voiko alempi tier olla edelleen relevantti?

---

# 85. STRATEGIC FAIRNESS

Hearthwoodissa:

```text
Rare
≠
Automatic Win

Common
≠
Useless
```

Tämä on tärkeää koko economy- ja draft-järjestelmälle.

---

# 86. PLAYER EXPERIENCE

Aloittelija näkee:

```text
Guardian
Tank
Protects allies.
```

Kokenut pelaaja näkee:

```text
Rootborn
Guardian
Nature
Ancient

Synergies:
Rootborn 3/4
Guardian 2/3
Nature 3/4

Threat:
High

Scaling:
Medium

Countered by:
Anti-Armor / Control
```

Sama järjestelmä palvelee molempia.

---

# 87. STRATEGIC DISCOVERY

Pelaaja saa välillä tilanteita:

> "Minulla ei ole täydellistä buildia."

Ja joutuu rakentamaan ratkaisun siitä, mitä on tarjolla.

Tämä on Hearthwoodin tärkeä roguelite-elementti.

---

# 88. DRAFT PHILOSOPHY

Shopin pitää tarjota:

```text
KNOWN VALUE
+
NEW POSSIBILITY
+
RISKY OPTION
```

Esimerkiksi:

```text
Guardian
→ safe

Poisoncaller
→ synergy

Mythic Beast
→ risky pivot
```

---

# 89. UNIT POOL DESIGN

Rosterin pitää sisältää:

* simple units
* synergy units
* economy units
* pivot units
* carry units
* support units
* counter units
* niche units
* mythic units

---

# 90. UNIT ROSTER BALANCE

Jokaisella tierillä pitää olla:

```text
FOUNDATION
SPECIALIST
SYNERGY
UTILITY
```

Ei vain:

```text
T1 = weak
T5 = strong
```

---

# 91. ADVANCED SYNERGY SYSTEM

Korkean tason pelaajat voivat yhdistää:

```text
TRIBE
+
ROLE
+
TAG
+
STATUS
+
POSITION
+
ITEM
+
RELIC
+
ECONOMY
```

Esimerkiksi:

```text
Rootborn
+
Guardian
+
Nature
+
Healing
+
Shield
+
Adjacent Position
+
Growth Relic
```

voi synnyttää kokonaan uuden strategisen arkkitehtuurin.

---

# 92. SYNERGY DISCOVERY MATRIX

Jokainen yksikkö voi olla osa useita verkostoja:

```text
                 TRIBE
                   │
             ┌─────┴─────┐
             │           │
           ROLE         TAG
             │           │
             └─────┬─────┘
                   │
               ABILITY
                   │
             ┌─────┴─────┐
             │           │
          STATUS       ITEM
             │           │
             └─────┬─────┘
                   │
                RELIC
```

---

# 93. DESIGN GOAL

Yhden unitin tulisi pystyä liittymään vähintään kahteen tai kolmeen erilaiseen build-polkuun.

Tämä lisää rosterin tehokasta strategista kokoa.

---

# 94. ROSTER SCALABILITY

Kun uusia yksiköitä lisätään, niitä ei saa suunnitella tyhjiössä.

Uuden unitin pitää:

* liittyä olemassa olevaan heimojärjestelmään
* luoda uusi interaction
* täydentää olemassa olevaa strategiaa
* tai avata uuden strategisen polun

Ei pelkästään:

> "Lisätään uusi DPS."

---

# 95. NEW UNIT CHECKLIST

Uusi yksikkö hyväksytään vain jos:

```text
✓ Clear identity
✓ Clear role
✓ Clear weakness
✓ Tribe connection
✓ At least 2 synergy hooks
✓ Counterplay
✓ Build potential
✓ Upgrade potential
✓ Interesting positioning
✓ Interesting item affinity
```

---

# 96. NEW SYNERGY CHECKLIST

Uusi synergy hyväksytään jos:

```text
✓ Easy to understand
✓ Changes behavior
✓ Has breakpoint
✓ Has counterplay
✓ Has tradeoff
✓ Supports multiple builds
✓ Does not create auto-win
✓ Produces satisfying feedback
```

---

# 97. NEW TIER CHECKLIST

Uuden tierin tai rarity-luokan pitää:

```text
✓ Add meaningful progression
✓ Increase strategic possibilities
✓ Not invalidate lower tiers
✓ Have clear availability rules
✓ Fit economy
✓ Fit shop progression
```

---

# 98. CORE DATA MODEL

Yksikkö voidaan mallintaa:

```text
Unit {
    id
    name

    tribe[]
    role[]
    tags[]

    tier

    stats
    ability

    synergies[]
    counters[]
    affinities[]

    upgradePaths[]
    itemAffinities[]

    targetPriority
    positioningProfile

    economyEffects[]
}
```

---

# 99. SYNERGY DATA MODEL

```text
Synergy {
    id
    name

    requirements[]
    breakpoints[]

    effects[]

    tribe
    roles[]
    tags[]

    counterplay[]
}
```

---

# 100. TRIBE DATA MODEL

```text
Tribe {
    id
    name
    lore

    identity
    strengths[]
    weaknesses[]

    units[]

    synergyRules[]
    biomeAffinities[]
    itemAffinities[]
    relicAffinities[]
}
```

---

# 101. TIER DATA MODEL

```text
UnitTier {
    id
    name

    rarity
    powerBudget
    shopAvailability
    complexityLevel

    upgradePotential
}
```

---

# 102. SYSTEM INTEGRATION

Synergy System integroidaan:

```text
Economy
Shop
Units
Combat
Items
Relics
Map
Biomes
Events
Enemy AI
Seed
Progression
```

---

# 103. ENEMY AI + SYNERGY

Enemy AI pystyy rakentamaan synergyjä.

Esimerkiksi:

```text
Enemy sees:
Player uses Poison

Enemy chooses:
Sunwarden

Then:
Cleanse synergy
```

Enemy ei vain osta yksiköitä.

Se rakentaa kokonaisuuden.

---

# 104. ENEMY SCOUTING

Enemy voi tunnistaa:

```text
Player Tribe
Player Core
Player Carry
Player Weakness
Player Synergies
```

ja reagoida niihin.

---

# 105. PLAYER SCOUTING

Pelaaja voi tehdä saman viholliselle.

```text
Enemy:
3 Wildclaw
2 Hunter
1 Assassin
```

Pelaaja ymmärtää:

> "Backline on vaarassa."

Sitten hän muuttaa positioningia tai ostaa counterin.

---

# 106. SYNERGY COUNTERPLAY

Jokaisella suurella synergialla pitää olla vähintään:

```text
DIRECT COUNTER
INDIRECT COUNTER
POSITIONAL COUNTER
```

Esimerkiksi Poison:

```text
Direct:
Cleanse

Indirect:
Burst

Positional:
Kill Poison source
```

---

# 107. BUILD VS BUILD

Hearthwoodin combat voidaan nähdä:

```text
BUILD A
vs
BUILD B
```

ei vain:

```text
POWER 80
vs
POWER 90
```

Tämä tekee matchupista strategisen.

---

# 108. STRATEGIC BUILD SCORE

Buildin arvio voidaan muodostaa:

```text
BUILD SCORE =
Role Coverage
+
Synergy
+
Economy
+
Position
+
Scaling
+
Counterplay
```

Scorea ei kuitenkaan saa käyttää "voittoprosenttiarvauksena".

Se on diagnostinen työkalu.

---

# 109. CORE PRINCIPLE

> **A build should be stronger than the sum of its units, but weaker than the player's ability to adapt it.**

---

# 110. FINAL SYSTEM FORMULA

```text
TRIBE
+
ROLE
+
TIER
+
TAG
+
ABILITY
+
SYNERGY
+
POSITION
+
ITEM
+
RELIC
+
ECONOMY
+
PLAYER DECISION
=
UNIT VALUE
```

Ja:

```text
UNIT VALUE
+
UNIT VALUE
+
INTERACTIONS
+
PLAYER STRATEGY
=
BUILD POWER
```

---

# 111. THE HEARTHWOOD SYNERGY PRINCIPLE

Hearthwoodin synergia ei tarkoita:

> "Kerää kuusi samaa yksikköä."

Se tarkoittaa:

> **"Ymmärrä, miten nämä yksiköt voivat tehdä toisistaan parempia."**

---

# 112. THE HEARTHWOOD TRIBE PRINCIPLE

Heimo ei määritä pelaajan buildia.

Se tarjoaa:

> **strategisen kielen, jolla build voidaan rakentaa.**

---

# 113. THE HEARTHWOOD TIER PRINCIPLE

Tier ei määritä:

> "Onko tämä hyvä yksikkö?"

Se määrittää:

> **"Kuinka harvinainen, monimutkainen ja potentiaalisesti transformatiivinen tämä yksikkö on?"**

---

# 114. FINAL PLAYER EXPERIENCE

Aloittelija:

> "Tämä on tankki."

Kokenut pelaaja:

> "Tämä on Rootborn Guardian."

Edistynyt pelaaja:

> "Se aktivoi Rootborn 4-breakpointin."

Asiantuntija:

> "Jos vaihdan yhden supportin tähän, saan Guardian + Nature + Healing -ketjun."

Mestari:

> "Jos ostan tämän nyt, menetän economy breakpointin, mutta saan power spiken ennen seuraavaa Assassin-encounteria. Voin käyttää tätä temporary frontlinea ja pivotata myöhemmin."

**Sama yksikkö.**

**Eri syvyystaso.**

---

# 115. MASTER DESIGN GOAL

Hearthwoodin unit- ja synergyjärjestelmän pitää mahdollistaa tilanne, jossa pelaaja löytää:

```text
A UNIT
```

ja ajattelee:

> "Tämä on hyvä."

Sitten:

```text
A SYNERGY
```

ja ajattelee:

> "Tämä voisi toimia."

Sitten:

```text
A SECOND UNIT
```

ja:

> "Odota..."

Sitten:

```text
AN ITEM
```

ja:

> **"Nyt minä tiedän, mitä rakennan."**

Tämä on Hearthwoodin buildcraftingin tärkein tunne.

---

# 116. FINAL NORTH STAR

> **Units are pieces.**
>
> **Tribes are identities.**
>
> **Tiers are possibilities.**
>
> **Synergies are relationships.**
>
> **Builds are strategies.**
>
> **The player creates the combination.**

## HEARTHWOOD

### **Don't collect the strongest units.**

### **Build the strongest idea.**
