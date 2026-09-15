> **North-star design doc — multi-round.** Marc pasted this in full on
> 2026-09-09, right after PR #422 merged. It is the run-architecture umbrella:
> deterministic seed engine + per-system RNG streams, seeded / daily / challenge
> run modes, a 6-axis Strategic Playstyle profile that emerges from choices and
> drives systemic opportunities, run state / run memory / decision history,
> build momentum & strategic pivot (with cost), risk / information-as-resource /
> foresight, systemic interaction & emergent gameplay, seed signatures + replay
> + community seeds, multi-seed balance, and a 1→10 development priority order
> (seed engine → run state → build state → playstyle tracking → dynamic shop →
> advanced combat → enemy build AI → adaptation → event consequences → seed
> modifiers). It is **not** a single build target — it is sliced one system per
> round, each behind the fairness gate. Related: docs/hearthwood-combat-system-v2-prd.md,
> docs/hearthwood-adaptive-enemy-build-ai-prd.md, docs/hearthwood-unit-roles-build-system-prd.md,
> docs/hearthwood-challenging-fair-deep-prd.md.

---

# HEARTHWOOD

## Seed System, Strategic Playstyle & Dynamic Game Mechanics

### Dynamic Roguelite World + Strategic Player Identity + Systemic Gameplay

**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy
**Core Identity:** *Cosy tactics with deep synergy*
**Design Goal:** Jokainen run muodostaa oman strategisen tarinansa.

---

# 1. VISION

Hearthwoodin jokainen pelikerta ei saa tuntua samalta peliltä eri yksiköillä.

Jokaisen runin pitäisi muodostaa:

* oma maailma
* oma seed
* oma resurssitilanne
* oma shop-kierto
* oma unit pool
* omat eventit
* oma vihollisjärjestys
* oma build
* oma strateginen pelityyli
* oma vastustajan strategia
* oma tarina

Pelaaja ei vain kysy:

> "Mikä on paras build?"

Vaan:

> **"Mitä tästä runista kannattaa rakentaa?"**

---

# 2. THREE CORE SYSTEMS

Hearthwoodin uusi gameplay-arkkitehtuuri:

```text
                    HEARTHWOOD RUN
                          │
             ┌────────────┼────────────┐
             │            │            │
           SEED        PLAYSTYLE     SYSTEMS
             │            │            │
          WORLD        STRATEGY      COMBAT
          EVENTS       IDENTITY      SHOP
          LOOT         DECISIONS     ECONOMY
          ENEMIES      BUILD         UPGRADES
          SHOP         RISK          SYNERGIES
             │            │            │
             └────────────┼────────────┘
                          │
                       PLAYER
                          │
                        BUILD
                          │
                       COMBAT
                          │
                       ADAPT
```

---

# 3. SEED SYSTEM

Seed määrittelee runin generatiivisen lähtökohdan.

Seed vaikuttaa esimerkiksi:

* nodeihin
* vihollisiin
* shoppeihin
* unit pooliin
* item pooliin
* relicseihin
* eventteihin
* biomeihin
* rewardeihin
* elite-kohtaamisiin
* bossiin
* economy-tapahtumiin

Seed ei kuitenkaan saa määrittää kaikkea täysin deterministisesti näkyvällä tavalla.

Se luo **rakenteen**, jonka sisällä pelaaja tekee päätökset.

---

# 4. SEED IDENTITY

Jokaisella runilla on:

```text
Seed
World Pattern
Encounter Pattern
Economy Pattern
Loot Pattern
Event Pattern
Boss Pattern
```

Esimerkiksi:

```text
Seed:
HW-7F3A-91C2

World:
Autumnwood → Mirefall → Frostroot

Economy:
High early / low mid

Enemy:
Aggressive

Loot:
Poison-heavy

Boss:
Control-focused
```

---

# 5. DETERMINISTIC SEED

Sama seed tuottaa saman maailman rakenteen.

```text
Seed
↓
Seed Generator
↓
World State
↓
RNG Streams
↓
Game Systems
```

Tärkeää:

**eri järjestelmillä pitää olla omat RNG-streaminsä.**

Esimerkiksi:

```text
World RNG
Shop RNG
Loot RNG
Combat RNG
Event RNG
Enemy RNG
```

Näin yksi satunnainen tapahtuma ei sotke koko runin determinismiä.

---

# 6. SEED REPRODUCIBILITY

Sama:

```text
Seed
+
Game Version
+
Ruleset Version
```

tuottaa saman runin.

Tämä mahdollistaa:

* replayt
* debuggingin
* kilpailulliset seed-haasteet
* daily challenge -tyyppiset pelitilat
* AI-testauksen
* balance-testauksen

---

# 7. SEEDED RUN MODES

Myöhemmin voidaan tarjota:

### NORMAL RUN

Satunnainen seed.

### SEEDED RUN

Pelaaja antaa seedin.

### DAILY SEED

Kaikille sama seed.

### CHALLENGE SEED

Erityinen sääntömodifikaatio.

### DEV SEED

Testaamiseen.

---

# 8. SEED SHOULD NOT MEAN PREDICTABLE

Vaikka seed on deterministinen, pelaaja ei saa pystyä helposti tietämään koko runia etukäteen.

Esimerkiksi:

```text
Seed:
ABC123
```

ei tarkoita:

> "Saat Poison Witchin round 4."

Seed luo RNG:n.

Pelaajan valinnat vaikuttavat siihen, mitä maailmasta lopulta paljastuu.

---

# 9. BRANCHING RNG

Hearthwood käyttää tarvittaessa branching RNG -mallia.

```text
Seed
 ↓
World RNG
 ↓
Current State
 ↓
Player Decision
 ↓
New RNG State
```

Näin pelaajan päätökset voivat vaikuttaa tulevien vaihtoehtojen rakenteeseen.

---

# 10. SEED-BASED WORLD

Seed voi määritellä:

```text
Act I
  ├── Forest
  ├── Event
  ├── Combat
  └── Shop

Act II
  ├── Mire
  ├── Elite
  ├── Shop
  └── Event

Act III
  ├── Frost
  ├── Elite
  ├── Boss
```

Mutta nodeissa on vaihtoehtoja.

---

# 11. STRATEGIC PLAYSTYLE

Hearthwoodissa pelaajalla on **Strategic Playstyle**.

Se ei ole perinteinen character class.

Se kuvaa sitä, **miten pelaaja pelaa runia**.

---

# 12. PLAYSTYLE ARCHETYPES

Esimerkkejä:

### AGGRESSIVE

* paljon DPS
* vähän sustainia
* nopea tempo
* korkea riski

### DEFENSIVE

* Tank
* Healing
* Shield
* pitkä combat

### CONTROL

* stun
* root
* slow
* interrupt

### SYNERGY

* keskittyy tribe/keyword-comboihin

### ECONOMIC

* säästää
* investoi
* shop-optimointi

### ADAPTIVE

* vaihtaa buildia tilanteen mukaan

### HIGH RISK

* sacrifice
* low HP mechanics
* gamble rewards

### SCALING

* heikompi alku
* erittäin vahva loppupeli

---

# 13. PLAYSTYLE IS NOT A CLASS

Pelaaja ei valitse:

```text
☐ Aggressive
☐ Defensive
☐ Control
```

pelin alussa.

Pelaajan päätökset **muodostavat pelityylin**.

---

# 14. PLAYSTYLE DETECTION

Peli seuraa:

```text
Purchases
Upgrades
Positioning
Combat duration
Risk decisions
Economy decisions
Unit roles
Items
Synergies
```

Näistä muodostetaan playstyle-profiili.

Esimerkiksi:

```text
Aggression     82
Defense        41
Control        65
Economy        28
Risk           73
Adaptation     51
```

---

# 15. PLAYSTYLE EVOLUTION

Pelityyli voi muuttua runin aikana.

```text
Early:
Aggressive

Mid:
Aggressive + Poison

Late:
Poison Scaling
```

Pelaajaa ei lukita alkuperäiseen strategiaan.

---

# 16. PLAYSTYLE CONSEQUENCES

Pelityylillä voi olla systeemisiä vaikutuksia.

Esimerkiksi korkea:

```text
Risk
```

voi avata:

* risk/reward eventtejä
* gambler shoppeja
* dangerous relicsejä

Korkea:

```text
Economy
```

voi avata:

* economy-eventtejä
* merchant opportunities
* investment mechanics

Mutta näiden pitää olla **mahdollisuuksia**, ei pakollisia palkintoja.

---

# 17. STRATEGIC IDENTITY

Runin aikana muodostuu:

```text
PLAYER IDENTITY

Build:
Poison Forest

Primary Strategy:
Scaling

Combat:
Sustain

Economy:
Conservative

Risk:
Medium

Core:
Poison Witch
```

Tämä on pelaajan runikohtainen strateginen identiteetti.

---

# 18. STRATEGIC DECISION TYPES

Hearthwoodin päätökset jaetaan:

### TEMPO

Paranna nykyistä taistelua.

### VALUE

Hanki pitkän aikavälin hyöty.

### SYNERGY

Aktivoi build.

### ECONOMY

Säästä tai investoi.

### RISK

Ota riski suuresta palkinnosta.

### ADAPTATION

Muuta buildia.

### COUNTER

Vastaa viholliseen.

---

# 19. GAMEPLAY SHOULD CREATE TRADE-OFFS

Hyvä päätös ei ole:

```text
A = +10
B = +5
```

Hyvä päätös on:

```text
A:
+damage now

B:
+future scaling

C:
fix build weakness
```

Pelaajan pitää valita strategia.

---

# 20. MULTI-LAYER GAME MECHANICS

Hearthwoodin gameplay koostuu seuraavista kerroksista:

```text
WORLD
 ↓
MAP
 ↓
EVENTS
 ↓
SHOP
 ↓
ECONOMY
 ↓
BUILD
 ↓
UPGRADES
 ↓
POSITION
 ↓
COMBAT
 ↓
REWARDS
 ↓
ADAPTATION
```

Jokaisen kerroksen pitää vaikuttaa seuraavaan.

---

# 21. WORLD SYSTEM

Maailma ei ole vain taustakuva.

Biome vaikuttaa:

* unit pooliin
* tuotteisiin
* vihollisiin
* eventteihin
* status effecteihin
* terrainiin
* bossiin
* economy-tapahtumiin

---

# 22. MAP SYSTEM

Kartalla on nodeja:

```text
Combat
Elite
Shop
Event
Treasure
Rest
Challenge
Boss
Mystery
```

Pelaaja valitsee reitin.

---

# 23. ROUTE STRATEGY

Reitin valinta on osa buildiä.

Esimerkiksi:

```text
Shop
 ↓
Elite
 ↓
Treasure
```

vs.

```text
Combat
 ↓
Event
 ↓
Rest
```

Ensimmäinen voi olla riskialttiimpi mutta tuottoisampi.

---

# 24. EVENT SYSTEM

Eventit käyttävät seed-järjestelmää.

Event voi tarjota:

```text
Reward
Trade
Risk
Curse
Upgrade
Information
Alternative route
```

Pelaaja tekee päätöksen.

---

# 25. EVENT CONSEQUENCES

Event ei aina pääty heti.

Esimerkiksi:

```text
Take cursed relic
↓
Immediate power
↓
Future drawback
```

Näin runin päätökset kasaantuvat.

---

# 26. SHOP SYSTEM

Shop on yksi Hearthwoodin tärkeimmistä strategisista tiloista.

Shopissa voi olla:

```text
Units
Items
Relics
Consumables
Services
Upgrade opportunities
```

Shopin sisältö perustuu:

* seediin
* biomeen
* shop tieriin
* pelaajan buildiin
* run stateen.

---

# 27. ECONOMY

Economy yhdistää lähes kaikki järjestelmät.

Resursseja voidaan käyttää:

* unitteihin
* upgradeihin
* shop refreshiin
* shop tieriin
* tuotteisiin
* eventteihin
* healingiin
* services-palveluihin

Goldilla pitää olla vaihtoehtoisia käyttötapoja.

---

# 28. ECONOMIC STRATEGY

Pelaaja voi valita:

### SPEND

Vahvistu nyt.

### SAVE

Vahvistu myöhemmin.

### INVEST

Kasvata tulevaa economyä.

### GAMBLE

Yritä saada suuri hyöty.

---

# 29. UNIT BUILD SYSTEM

Yksiköillä on:

```text
Role
Stats
Ability
Tags
Synergies
Level
Upgrade Path
Position
Strength
Weakness
```

Yksiköt eivät ole vain numeroita.

---

# 30. UNIT DEVELOPMENT

Level-up voi tarjota:

```text
Power
Defense
Synergy
Utility
```

Sama yksikkö voi kehittyä eri suuntaan eri runeissa.

---

# 31. PRODUCT SYSTEM

Tuotteet voivat olla:

```text
Offensive
Defensive
Support
Control
Economy
Scaling
Risk
Adaptation
```

Tuotteet muuttavat buildin toimintaa.

---

# 32. BUILD SYSTEM

Build koostuu:

```text
Units
+
Roles
+
Position
+
Upgrades
+
Items
+
Relics
+
Synergies
+
Economy
```

---

# 33. COMBAT SYSTEM

Combat käyttää kaikkia buildin osia.

```text
Role
Position
Ability
Status
Target
Threat
Synergy
Items
Upgrades
```

---

# 34. COMBAT STRATEGY

Combatissa syntyy:

* frontline
* backline
* target priority
* protection
* burst
* sustain
* control
* combo
* counterplay

---

# 35. ENEMY BUILD SYSTEM

Act II:ssa vihollinen rakentaa oman buildinsä.

```text
Enemy Seed
↓
Enemy Personality
↓
Build Archetype
↓
Shop
↓
Units
↓
Upgrades
↓
Position
↓
Combat
↓
Adaptation
```

Vihollinen käyttää samoja pelimekaniikkoja.

---

# 36. ENEMY ADAPTATION

Vihollinen analysoi pelaajaa.

Se voi huomata:

```text
High Healing
High Armor
Backline Carry
Poison
Summons
Control
```

ja rakentaa counterin.

---

# 37. PLAYER ADAPTATION

Pelaaja tekee saman.

```text
Observe Enemy
↓
Understand Build
↓
Identify Weakness
↓
Modify Own Build
↓
Counter
```

Tämä luo:

**Build vs Build** -pelin.

---

# 38. SYSTEMIC INTERACTION

Hearthwoodin tärkeä tavoite:

Yksi systeemi voi vaikuttaa toiseen.

Esimerkiksi:

```text
Biome
↓
Poison enemies
↓
Player takes poison resistance
↓
Shop offers poison synergy
↓
Player changes build
↓
Enemy detects poison build
↓
Enemy buys cleanse
↓
Player adapts again
```

Tämä on systeemisen gameplayn ydin.

---

# 39. EMERGENT GAMEPLAY

Pelissä saa syntyä tilanteita, joita ei ole käsikirjoitettu.

Esimerkiksi:

```text
Seed
+
Shop
+
Player Choice
+
Enemy AI
+
Combat
=
Unexpected Build
```

Peli ei kerro valmiiksi, mikä tarina tapahtuu.

Pelaaja luo sen.

---

# 40. RUN STATE

Koko runin tila tallennetaan:

```json
{
  "seed": "HW-7F3A-91C2",
  "version": "0.2.0",

  "act": 2,

  "economy": {
    "gold": 14
  },

  "playerBuild": {
    "archetype": "poison_sustain",
    "coreUnit": "poison_witch"
  },

  "playstyle": {
    "aggression": 62,
    "defense": 55,
    "control": 31,
    "economy": 48,
    "risk": 71,
    "adaptation": 64
  },

  "enemy": {
    "archetype": "anti_heal_control"
  }
}
```

---

# 41. RUN MEMORY

Run pitää muistaa:

* tehdyt valinnat
* ostetut unitit
* upgrade-polut
* eventit
* relicsit
* tärkeät combatit
* vihollisen strategiat
* player playstyle

Tämä mahdollistaa myöhemmät systeemiset seuraukset.

---

# 42. PLAYER DECISION HISTORY

Pelaajan päätöshistoriaa voidaan käyttää:

```text
Current Build
+
Past Choices
+
Playstyle
```

Tämä voi vaikuttaa myöhempiin eventteihin ja tarjouksiin.

---

# 43. NO HARD LOCKING

Pelaajaa ei saa lukita liian aikaisin buildiin.

Jos pelaaja aloittaa:

```text
Poison
```

hän voi myöhemmin vaihtaa:

```text
Poison
→
Control
```

tai:

```text
Poison
→
Poison + Summon
```

---

# 44. BUILD MOMENTUM

Buildillä on kuitenkin momentum.

Mitä enemmän pelaaja on investoinut tiettyyn suuntaan:

```text
Units
+
Upgrades
+
Items
+
Synergies
```

sitä arvokkaammaksi sen jatkaminen tulee.

Näin pelaaja joutuu arvioimaan:

> "Vaihdanko vai sitoudunko?"

---

# 45. STRATEGIC PIVOT

Jos build ei toimi, pelaaja voi tehdä pivotin.

```text
Current:
Glass Cannon

Problem:
Enemy counters burst

Pivot:
Add Control
+
Add Sustain
```

Pivotilla on kustannus.

Tämä tekee päätöksestä merkityksellisen.

---

# 46. RISK SYSTEM

Risk ei ole vain satunnainen bonus.

Risk voidaan ottaa tietoisesti.

Esimerkiksi:

```text
Safe Reward:
+100 gold

Risk:
Lose 30 HP

Reward:
Rare relic
```

---

# 47. INFORMATION AS RESOURCE

Tieto voi olla strateginen resurssi.

Pelaaja voi saada tietoa:

* tulevasta bossista
* vihollisen buildistä
* shop poolista
* eventin riskeistä
* mahdollisista rewardeista

Tieto auttaa tekemään parempia päätöksiä.

---

# 48. FORESIGHT SYSTEM

Harvinaiset mechanics voivat näyttää pelaajalle osan tulevaisuudesta.

Esimerkiksi:

```text
Reveal next 2 encounters.
```

tai:

```text
Reveal one future shop category.
```

Tämä tekee tiedosta arvokasta.

---

# 49. COMBAT + WORLD

Combatin tulokset voivat vaikuttaa runiin.

Esimerkiksi:

```text
Win with no deaths
→ bonus reputation

Lose heavily
→ recovery event

Defeat elite
→ unlock rare shop
```

---

# 50. HEALTH AS STRATEGIC RESOURCE

HP ei ole vain "elämät".

Pelaaja voi joutua päättämään:

```text
Take dangerous elite
```

saadakseen paremman rewardin.

HP toimii riskibudjettina.

---

# 51. META PROGRESSION

Runin ulkopuolinen progression ei saa tuhota strategista haastetta.

Meta progression voi avata:

* uusia yksiköitä
* uusia biomeja
* uusia relicsejä
* uusia eventtejä
* uusia build possibilities

Ei suoraan:

```text
+100% damage forever
```

---

# 52. SEED + PLAYSTYLE + AI

Kolme järjestelmää yhdistyvät:

```text
SEED
↓
creates conditions

PLAYER
↓
creates strategy

ENEMY AI
↓
responds strategically
```

Tästä syntyy jokaisen runin oma konflikti.

---

# 53. EXAMPLE RUN

Seed:

```text
HW-9182-AF
```

World:

```text
Autumnwood
→ Mirefall
→ Frostroot
```

Early shop:

```text
Tank
Poison DPS
Support
```

Pelaaja valitsee:

```text
Tank
+
Poison DPS
```

Playstyle alkaa muodostua:

```text
Defense: 55
Aggression: 61
Poison: 72
Risk: 40
```

---

# 54. MID RUN

Pelaaja löytää:

```text
Poison Healer
```

Build muuttuu:

```text
Poison Sustain
```

Vihollinen huomaa:

```text
Player relies on Poison scaling.
```

Enemy alkaa rakentaa:

```text
Cleanse
+
Burst
```

---

# 55. PLAYER RESPONSE

Pelaaja huomaa:

```text
Enemy has anti-poison.
```

Hän muuttaa buildiä:

```text
Poison
+
Direct Damage
+
Control
```

Tämä on emergent gameplay.

Kukaan ei käsikirjoittanut tätä buildiä.

Se syntyi järjestelmistä.

---

# 56. SEED SIGNATURE

Runille voidaan muodostaa jälkikäteen:

```text
SEED SIGNATURE

"THE POISON WAR"

Primary Build:
Poison Sustain

Enemy:
Anti-Poison Control

Difficulty:
High

Major Pivot:
Poison → Hybrid

Outcome:
Victory
```

Tätä voidaan käyttää:

* replayhin
* sharingiin
* statisticsiin
* daily challengeihin.

---

# 57. RUN REPLAY

Sama seed voidaan replayata.

Pelaaja voi yrittää:

> "Pystynkö voittamaan tämän seedin eri buildillä?"

Tämä lisää uudelleenpelattavuutta valtavasti.

---

# 58. COMMUNITY SEEDS

Myöhemmin voidaan rakentaa:

### Daily Seed

Kaikille sama.

### Weekly Seed

Vaikeampi.

### Community Challenge

Yksi seed + erityinen tavoite.

Esimerkiksi:

```text
Win without Healer.
```

---

# 59. DEVELOPER BENEFITS

Seed-järjestelmä tekee myös kehityksestä paremmin testattavaa.

Developer voi tallentaa:

```text
Seed:
HW-10082
```

ja toistaa ongelman.

Esimerkiksi:

> "Boss AI voittaa aina tämän buildin."

Seed mahdollistaa ongelman toistamisen.

---

# 60. AI SIMULATION

Enemy AI voi käyttää samaa seed-järjestelmää.

Developer voi simuloida:

```text
Seed
+
Player Build
+
Enemy Build
+
1000 simulations
```

ja löytää balance-ongelmia.

---

# 61. MULTI-SEED BALANCE

Yksikkö ei saa olla hyvä vain yhdessä seedissä.

Balance-testauksessa käytetään:

```text
100 seeds
+
1000 battles
```

ja tarkastellaan:

* win rate
* pick rate
* upgrade rate
* synergy rate
* role performance

---

# 62. GAMEPLAY VARIETY

Monipuolisuus syntyy:

```text
Seeds
+
Biomes
+
Events
+
Shops
+
Units
+
Upgrades
+
Items
+
Relics
+
Enemy AI
+
Player Decisions
```

Ei pelkästään suuresta määrästä contentia.

---

# 63. DESIGN RULE: SYSTEMS SHOULD INTERACT

Jokaisen uuden mekaniikan kohdalla kysytään:

> "Mihin muihin järjestelmiin tämä vaikuttaa?"

Esimerkiksi uusi Poison-mechanics voi vaikuttaa:

```text
Units
Items
Relics
Shop
Enemies
AI
Biomes
Events
Boss
Upgrades
```

Jos mekaniikka toimii täysin yksin, sen strateginen arvo on pienempi.

---

# 64. COMPLEXITY CONTROL

Monipuolisuus ei saa tarkoittaa kaaosta.

Jokaisella järjestelmällä pitää olla:

```text
Input
↓
Decision
↓
Outcome
```

Pelaajan pitäisi aina ymmärtää:

> "Miksi tämä tapahtui?"

---

# 65. INFORMATION HIERARCHY

UI:ssa:

### LEVEL 1

Mitä tapahtuu?

### LEVEL 2

Miksi?

### LEVEL 3

Miten voin hyödyntää sitä?

Esimerkiksi:

```text
POISON x5

Toxic Burst triggered.

Why:
5 Poison stacks.

Opportunity:
More Poison increases burst frequency.
```

---

# 66. STRATEGIC DEPTH MODEL

Hearthwoodin kokonaisstrategia:

```text
LEVEL 1
Unit choice

LEVEL 2
Role composition

LEVEL 3
Position

LEVEL 4
Synergy

LEVEL 5
Economy

LEVEL 6
Enemy adaptation

LEVEL 7
Route selection

LEVEL 8
Risk management

LEVEL 9
Build pivot

LEVEL 10
Long-term run strategy
```

---

# 67. ACT PROGRESSION

## TUTORIAL / ACT I

Pelaaja oppii:

* combat
* roles
* shop
* economy
* upgrades
* basic synergies

## ACT II

Avautuu:

* Enemy Build AI
* advanced combat
* strategic counters
* deeper builds
* adaptive enemies

## ACT III

Avautuu:

* advanced seed effects
* environmental mechanics
* boss build strategies
* complex events
* advanced build pivots

---

# 68. ENDGAME STRATEGY

Myöhäisessä pelissä pelaajan pitää ajatella:

```text
What is my build?

What is my weakness?

What is the enemy building?

What will the next biome punish?

What should I buy?

What should I save?

Should I pivot?

What is my win condition?
```

---

# 69. WIN CONDITION

Jokaisella buildillä pitäisi olla selkeä win condition.

Esimerkiksi:

```text
Poison:
Win through scaling.

Burst:
Kill before enemy stabilizes.

Tank:
Outlast enemy.

Summon:
Overwhelm board.

Control:
Prevent enemy from executing strategy.

Economy:
Reach late-game power spike.
```

---

# 70. LOSS CONDITION

Samoin buildillä pitää olla selkeä failure mode.

```text
Poison:
Cleansed

Burst:
Survived opening

Tank:
Armor penetration

Summon:
AOE

Control:
Resistance
```

Pelaaja ymmärtää, mitä vastaan hän hävisi.

---

# 71. HEARTHWOOD STRATEGIC LOOP

```text
SEE
↓
UNDERSTAND
↓
CHOOSE
↓
BUILD
↓
FIGHT
↓
LEARN
↓
ADAPT
↓
COMMIT OR PIVOT
↓
FIGHT AGAIN
```

---

# 72. CORE PRINCIPLE

Hearthwood ei saa tuntua:

> "Satunnaiset asiat tapahtuvat minulle."

Sen pitää tuntua:

> **"Seed antaa minulle tilanteen. Minä päätän, mitä teen sillä."**

---

# 73. FINAL GAME FORMULA

Hearthwoodin gameplay voidaan määritellä:

```text
SEED
+
WORLD
+
PLAYER DECISIONS
+
BUILD
+
ECONOMY
+
COMBAT
+
ENEMY AI
+
ADAPTATION
+
RISK
+
SYNERGY
=
RUN
```

Ja:

```text
RUN
+
PLAYER STYLE
+
EMERGENT EVENTS
=
UNIQUE STORY
```

---

# 74. ULTIMATE DESIGN GOAL

Hearthwoodin tavoitteena ei ole antaa pelaajalle yhtä optimaalista tapaa pelata.

Tavoitteena on antaa pelaajalle:

**tilanne,**

**työkalut,**

**riskejä,**

**mahdollisuuksia**

ja **vastustaja, joka reagoi hänen päätöksiinsä.**

Sitten pelaaja tekee loput.

Jokaisen runin pitäisi pystyä kertomaan erilainen tarina:

> "Tässä seedissä löysin oudon Poison-yksikön."

> "Rakensin sen ympärille koko buildin."

> "Vihollinen alkoi counteroida minua."

> "Jouduin vaihtamaan Carryni."

> "Economyni romahti."

> "Otin riskin."

> "Löysin uuden synergian."

> "Viimeinen boss pakotti minut muuttamaan formationia."

> **"Ja voitin omalla tavalla."**

---

# 75. DEVELOPMENT PRIORITY

Järjestelmät toteutetaan tässä järjestyksessä:

```text
1. Deterministic Seed Engine
        ↓
2. Run State
        ↓
3. Strategic Build State
        ↓
4. Playstyle Tracking
        ↓
5. Dynamic Shop
        ↓
6. Advanced Combat
        ↓
7. Enemy Build AI
        ↓
8. Adaptation
        ↓
9. Event Consequences
        ↓
10. Advanced Seed Modifiers
```

Näin rakennetaan ensin vakaa tekninen perusta ja vasta sen jälkeen monimutkaisemmat emergentit järjestelmät.

---

# 76. ACCEPTANCE CRITERIA

Järjestelmä hyväksytään, kun:

* jokaisella runilla on yksilöllinen seed
* sama seed voidaan toistaa
* RNG on deterministinen määritellyissä olosuhteissa
* world generation käyttää seediä
* shop käyttää seediä
* loot käyttää seediä
* eventit käyttävät seediä
* vihollisjärjestys käyttää seediä
* boss voidaan määrittää seedin kautta
* pelaajan build tallennetaan run stateen
* pelaajan strateginen pelityyli voidaan arvioida
* pelityyli voi muuttua runin aikana
* pelaaja voi pivotata buildiä
* buildillä on win condition
* buildillä on failure condition
* economy vaikuttaa buildiin
* shop vaikuttaa buildiin
* combat vaikuttaa runiin
* vihollis-AI analysoi pelaajan buildiä
* pelaaja voi analysoida vihollisen buildiä
* järjestelmät voivat vaikuttaa toisiinsa
* run voidaan replayata seedin avulla
* combat voidaan simuloida samalla seedillä
* järjestelmät ovat testattavissa ilman visuaalista clientia.

---

# 77. HEARTHWOOD'S CORE IDENTITY

Hearthwoodin lopullinen pelikokemus:

```text
THE SEED
     ↓
gives you a world

THE SHOP
     ↓
gives you possibilities

THE BUILD
     ↓
gives you identity

THE COMBAT
     ↓
tests your strategy

THE ENEMY AI
     ↓
challenges your strategy

THE WORLD
     ↓
creates new problems

YOUR DECISIONS
     ↓
create your run
```

**Hearthwood ei kerro pelaajalle, millainen build hänen pitää tehdä.**

**Hearthwood antaa hänelle maailman, jossa hänen pitää keksiä se itse.**
