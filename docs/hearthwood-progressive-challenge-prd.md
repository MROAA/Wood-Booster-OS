> **North-star design doc — the difficulty side of the game.** Marc
> pasted this in full on 2026-09-09, during the round that shipped The
> Hunters (the 3rd enemy archetype). It specifies a **Progressive
> Challenge & Scaling System** — a `DifficultyEngine` service (§49,
> §65) that makes a run get harder along four axes (**Power, Complexity,
> Counterplay, Pressure** — §1, §64) *without* the naive "+20% HP / DMG /
> armour per area" (§3). Core content: 9 simultaneous difficulty layers
> (§4), a per-run difficulty curve (§5), an internal **DifficultyScore**
> (§6) and **PlayerPowerScore** (§7) with **BuildCoherence** (§8) so 6
> coherent mid-units can out-rate 5 strong incoherent ones, a
> **power-to-threat ratio** that is explicitly *not* rubber-banding
> (§9, §47) and *never* punishes good play (§9, §21, §62), a **soft
> scaling** priority order that puts stat scaling dead last (§10) with
> per-tier stat caps (§11) and diminishing returns (§12), encounter
> scaling by composition rather than stats (§13), a 6-level enemy
> **complexity progression** (basic → role-aware → synergy-aware →
> counter-aware → adaptive → boss intelligence — §14) matched by a
> **counter-scaling** ladder that must never invalidate a build (§15),
> a **build stress test** for late content (§16), a per-encounter
> **Difficulty Budget** of 100 points spent across power / synergy /
> control / counterplay / environment / mechanic / AI (§17), biome
> difficulty identities (Autumnwood / Frostroot / Sunwarden / Mirefall —
> §22) with environmental combat participation (§23), scaling for events
> / shop / bosses (§24–28), a **telegraph system** — *Difficulty =
> Decision, not Surprise* (§29) — 6 normal difficulty tiers T0–T5 (§30–36)
> plus a *separate* Ascension / Challenge-Modifier layer (§37–39), a hard
> **Fairness Rule** (the engine may never touch RNG, hand the enemy free
> gold/units, break its own rules, remove counterplay, or hide a hard
> counter — the enemy plays by the player's rules — §40, §54), difficulty
> transparency + a pre-fight scouting/warning panel + a map difficulty
> preview (§41–43), reward scaling on its own budget (§44–45), a
> difficulty **state machine** (SAFE → NORMAL → PRESSURED → DANGEROUS →
> CRITICAL → MASTER — §48), the full data models (`DifficultyProfile` /
> `EncounterDifficulty` / `PlayerPowerSnapshot` — §50–52), the difficulty
> event pipeline + fairness validator + 1000-run simulation validation
> (§53–56), win-rate balancing targets (early 80–95% … boss 25–60% —
> §56), defeat analysis + the learning loop (§57–58), anti-solving /
> meta-vs-run balance separation (§59–61), the recommended
> `systems/difficulty/` module layout + event bus + debug + telemetry
> (§65–68), QA and acceptance criteria (§69–70), and the MVP + 12-phase
> development order (§71–72). The North Star (§73–74): *Hearthwood ei
> kysy pelaajalta, kuinka paljon voimaa hänellä on — vaan kuinka hyvin
> hän osaa käyttää sitä.* Easy to enter → hard to master → fair to lose
> → rewarding to learn → endlessly replayable.
>
> **Status: north star, not a work order.** It ties directly into the
> systems already shipped this session — the seed engine (#429), the
> threat preview + telegraph contract (#432), the enemy archetypes
> (#433 Swarm, #434 Fortress, this round's Hunters), `evaluateBuild`
> (#421), `analyzeOutcome` / defeat analysis (#423), `evaluatePlaystyle`
> (#426), the per-Act `DIFFICULTY_TIERS` ramp + `difficultyFactor` in
> `runEngine.js`, and the `EnemyAI/` adaptive-build-AI PRD. The
> `PlayerPowerAnalyzer` (§72 Phase 1) is the natural first slice and
> largely reuses `evaluateBuild`. Nothing here changes a shipped system
> until picked up as its own round.

---

# HEARTHWOOD

## PRD — Progressiivinen haasteen nousu ja skaalaus

**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy
**Core Fantasy:** Cosy tactics with deep synergy
**Järjestelmä:** Dynamic Progressive Challenge & Scaling System
**Status:** Core Game System
**Version:** 1.0

---

# 1. VISION

Hearthwoodin haasteen tulee kasvaa yhdessä pelaajan kanssa.

Peli ei saa tuntua siltä, että jokaisen uuden alueen jälkeen vihollisille vain annetaan:

```text
+20% HP
+20% Damage
+20% Armor
```

Sen sijaan haasteen tulee kehittyä:

```text
HELPPO YMMÄRTÄÄ
        ↓
OPETTAA
        ↓
TESTAA
        ↓
PAKOTTAA SOPEUTUMAAN
        ↓
RANKAISEE HUONOISTA PÄÄTÖKSISTÄ
        ↓
TESTAA BUILDIN KESTÄVYYTTÄ
        ↓
TESTAA MESTARUUTTA
```

Hearthwoodin vaikeus perustuu neljään pääakseliin:

```text
POWER
COMPLEXITY
COUNTERPLAY
PRESSURE
```

Näiden tulee kasvaa asteittain eikä yhtä aikaa maksimaalisesti.

---

# 2. PÄÄTAVOITE

Progressiivisen haastejärjestelmän pitää:

* pitää alku helposti lähestyttävänä
* opettaa järjestelmät luonnollisesti
* palkita hyvää rakentamista
* estää yhden buildin automaattinen dominointi
* pakottaa pelaajaa mukautumaan
* tehdä vihollisista älykkäämpiä asteittain
* säilyttää counterplay
* tehdä biomeista erilaisia
* tehdä eliteistä aidosti uhkaavia
* tehdä bosseista strategisia testejä
* mahdollistaa erittäin korkea endgame-haaste
* välttää epäreilu scaling
* pitää epäonnistuminen opettavaisena

---

# 3. CORE PRINCIPLE

## Difficulty should test decisions, not patience.

Huono:

```text
Enemy HP × 10
Enemy Damage × 10
```

Hyvä:

```text
Enemy Build
+
Enemy Synergy
+
Counterplay
+
Positioning
+
Mechanics
+
Environmental Pressure
+
Decision Pressure
```

---

# 4. DIFFICULTY LAYERS

Hearthwood käyttää useita samanaikaisia haastekerroksia.

```text
LAYER 1 — BASE POWER
LAYER 2 — ENCOUNTER COMPLEXITY
LAYER 3 — ENEMY INTELLIGENCE
LAYER 4 — COUNTERPLAY
LAYER 5 — ENVIRONMENT
LAYER 6 — RESOURCE PRESSURE
LAYER 7 — BOSS PRESSURE
LAYER 8 — RUN MODIFIERS
LAYER 9 — META DIFFICULTY
```

Kaikki kerrokset eivät aktivoidu samanaikaisesti.

---

# 5. DIFFICULTY CURVE

Perusrunin rakenne:

```text
ACT 1
│
├── Tutorial pressure
├── Basic enemies
├── Simple synergies
└── Low punishment
        ↓
ACT 2
│
├── Specialized enemies
├── Stronger synergies
├── Counter mechanics
└── Resource pressure
        ↓
ACT 3
│
├── Advanced enemies
├── Build counters
├── Elite pressure
└── Complex encounters
        ↓
ACT 4
│
├── Adaptive enemies
├── Build stress tests
├── Environmental mechanics
└── High strategic pressure
        ↓
FINAL
│
├── Boss
├── Phase mechanics
├── Build-specific counters
└── Mastery test
```

---

# 6. DIFFICULTY SCORE

Järjestelmä käyttää sisäistä Difficulty Scorea.

```text
DifficultyScore =
    BaseDifficulty
  + ActDifficulty
  + BiomeDifficulty
  + EncounterDifficulty
  + EnemyDifficulty
  + PlayerPowerAdjustment
  + RunModifier
  + BossModifier
```

Esimerkiksi:

```text
Act 1 = 10
Act 2 = 25
Act 3 = 45
Act 4 = 70
Boss = 100
```

Arvot ovat placeholder-arvoja ja tasapainotetaan playtestissä.

---

# 7. PLAYER POWER SCORE

Peli arvioi pelaajan todellisen voimatason.

Älä käytä pelkästään Goldia tai Unit Tieriä.

Player Power Score muodostuu:

```text
PlayerPower =
    UnitPower
  + StarPower
  + SynergyPower
  + ItemPower
  + RelicPower
  + FormationPower
  + EconomyPower
  + BuildCoherence
```

---

# 8. BUILD COHERENCE

Pelkkä vahvojen yksiköiden määrä ei saa määrittää voimaa.

Peli arvioi:

```text
Unit → Role
Unit → Tribe
Unit → Synergy
Unit → Item
Unit → Formation
Unit → Ability
```

Esimerkiksi:

```text
5 vahvaa mutta ristiriitaista yksikköä
```

voi olla heikompi kuin:

```text
6 keskivahvaa yksikköä
+
3 aktiivista synergyä
+
toisiaan tukevat itemit
+
hyvä formation
```

---

# 9. POWER-TO-THREAT RATIO

Järjestelmä vertaa:

```text
PLAYER POWER
        VS
EXPECTED ENCOUNTER POWER
```

Jos pelaaja on erittäin vahva:

```text
Threat Level ↑
```

Jos pelaaja on heikko:

```text
Threat Level ↓
```

Mutta:

**Peli ei saa rangaista pelaajaa tarkoituksellisesti siitä, että tämä pelaa hyvin.**

Scalingin tarkoitus on estää pelin trivialisoituminen, ei poistaa palkintoa hyvästä buildista.

---

# 10. SOFT SCALING

Ensisijainen skaalaus tapahtuu pehmeästi.

Prioriteettijärjestys:

```text
1. Encounter complexity
2. Enemy composition
3. Enemy synergy
4. Positioning
5. Counterplay
6. Ability timing
7. Environmental pressure
8. Enemy stats
```

Stat scaling on viimeinen työkalu.

---

# 11. STAT SCALING

Kun tilastoja skaalataan, käytetään cappeja.

Esimerkiksi:

```text
Enemy HP:
+5–10% / difficulty tier

Enemy Damage:
+3–8%

Armor:
+2–5%

Resistance:
+2–5%

Ability frequency:
+0–10%
```

Älä koskaan anna kaikkien arvojen kasvaa täydellä nopeudella yhtä aikaa.

---

# 12. DIMINISHING RETURNS

Scaling käyttää diminishing returns -mallia.

Esimerkiksi:

```text
1 → 2 = suuri ero
2 → 3 = suuri ero
3 → 4 = keskisuuri ero
4 → 5 = pieni ero
5 → 6 = erittäin pieni ero
```

Tämä estää late-gamen eksponentiaalisen stat inflationin.

---

# 13. ENCOUNTER SCALING

Encounterin vaikeus voidaan nostaa ilman statteja.

Esimerkiksi:

### Early

```text
3 × Basic Enemy
```

### Mid

```text
Tank
+
DPS
+
Support
```

### Advanced

```text
Tank
+
DPS
+
Control
+
Synergy
```

### Endgame

```text
Frontline
+
Backline
+
Support
+
Counter Unit
+
Environmental Mechanic
```

---

# 14. ENEMY COMPLEXITY PROGRESSION

## Level 1 — Basic

Vihollinen:

* hyökkää
* käyttää yksinkertaista abilityä
* käyttää perus-targetointia

## Level 2 — Role-aware

Vihollinen ymmärtää:

* Tank
* DPS
* Healer
* Support

## Level 3 — Synergy-aware

Vihollinen rakentaa:

```text
Tribe
+
Role
+
Tag
```

synergioita.

## Level 4 — Counter-aware

Vihollinen tunnistaa pelaajan buildin.

Esimerkiksi:

```text
Player:
Poison Build

Enemy:
Cleanse
+
Resistance
```

## Level 5 — Adaptive

Vihollinen muuttaa:

* targetointia
* formationia
* ostoksia
* itemeitä
* abilityjen käyttöä

pelaajan toiminnan mukaan.

## Level 6 — Boss Intelligence

Boss:

* vaihtaa vaihetta
* muuttaa strategiaa
* reagoi pelaajan buildiin
* käyttää ympäristöä
* pakottaa pelaajan muuttamaan strategiaa.

---

# 15. COUNTER SCALING

Counterplay kasvaa asteittain.

Early:

```text
Soft Counter
```

Mid:

```text
Specialized Counter
```

Late:

```text
Build Stress Test
```

Boss:

```text
Mechanic Counter
```

Esimerkiksi:

```text
Poison build

Early:
small cleanse

Mid:
resistance unit

Late:
cleanse + anti-status synergy

Boss:
poison conversion mechanic
```

Tärkeä sääntö:

> Counter ei saa tehdä buildista käyttökelvotonta.

---

# 16. BUILD STRESS TEST

Late-game encounterit eivät kysy:

> “Onko buildisi tarpeeksi vahva?”

Ne kysyvät:

> “Toimiiko buildisi useissa tilanteissa?”

Testattavia ominaisuuksia:

```text
Single Target
AOE
Sustain
Burst
Control
Anti-Control
Frontline
Backline Protection
Healing
Anti-Healing
Status
Anti-Status
Long Fight
Short Fight
```

---

# 17. DIFFICULTY BUDGET

Jokaisella encounterilla on Difficulty Budget.

```text
Encounter Budget = 100
```

Esimerkiksi:

```text
Enemy Power       30
Enemy Synergy     20
Control           10
Counterplay       15
Environment       10
Special Mechanic  10
AI Intelligence    5
```

Yhteensä:

```text
100
```

Jos encounter saa +20 vaikeutta:

```text
ei:
+20 enemy HP
```

vaan:

```text
+5 synergy
+5 mechanic
+5 positioning
+5 AI
```

---

# 18. PLAYER PERFORMANCE SCALING

Peli voi seurata pelaajan menestystä.

Metrics:

```text
Win Rate
Damage Taken
Gold Efficiency
Reroll Efficiency
Unit Upgrade Rate
Synergy Utilization
Formation Quality
Boss Damage
Average HP
Combat Duration
```

Näitä käytetään pääasiassa matchmaking-/challenge- ja endgame-järjestelmissä.

Normaalissa roguelite-runissa scalingin pitää olla ennustettavaa eikä salaa manipuloitua.

---

# 19. HP AS DIFFICULTY SIGNAL

Player HP on strateginen resurssi.

Jos pelaaja on menettänyt paljon HP:tä:

```text
Danger State
```

Peli voi tarjota:

* recovery event
* defensive shop option
* healing opportunity
* risk/reward event
* comeback encounter

Mutta ei ilmaista automaattista voittoa.

---

# 20. COMEBACK SCALING

Peli tunnistaa tilanteen:

```text
Player Power << Expected Power
```

Tällöin:

```text
Comeback Opportunity ↑
```

Mahdollisia mekanismeja:

* risk/reward events
* high-value shop
* temporary unit
* emergency relic
* alternate route
* comeback boss mechanic

Tavoite:

```text
HELP WEAK PLAYERS RECOVER
```

ei:

```text
GIVE THEM FREE POWER
```

---

# 21. DOMINANT BUILD DETECTION

Peli seuraa buildien käyttöä.

Jos esimerkiksi:

```text
Build X
Win Rate = 90%
```

järjestelmä voi havaita metan.

Mutta normaalissa runissa:

**Älä automaattisesti spawnkaa hard counteria.**

Sen sijaan:

```text
Meta Analysis
→ Balance Data
→ Future Patch
```

Dynamic scalingia voidaan käyttää vain tietyissä challenge-modeissa.

---

# 22. BIOME SCALING

Jokaisella biomella on oma difficulty identity.

## AUTUMNWOOD

Teema:

```text
Resource + Tempo
```

Haasteet:

* economy pressure
* swarm
* tempo
* positioning

---

## FROSTROOT

Teema:

```text
Control + Preservation
```

Haasteet:

* freeze
* slow
* defensive enemies
* prolonged fights

---

## SUNWARDEN

Teema:

```text
Purification + Burst
```

Haasteet:

* cleanse
* shields
* radiant damage
* anti-corruption

---

## MIREFALL

Teema:

```text
Decay + Uncertainty
```

Haasteet:

* poison
* corruption
* status effects
* hidden risks
* environmental hazards

---

# 23. ENVIRONMENTAL SCALING

Myöhemmissä alueissa ympäristö osallistuu taisteluun.

Esimerkiksi:

```text
Roots
Fog
Ice
Fire
Poison pools
Falling leaves
Mushroom spores
Darkness
Sacred ground
Corrupted ground
```

Ympäristö voi:

* muuttaa movementia
* muuttaa rangea
* aiheuttaa statuksia
* muuttaa targetointia
* tarjota buffeja
* tuhota formationin.

---

# 24. EVENT DIFFICULTY

Eventit skaalautuvat myös.

Early:

```text
Low Risk
Low Reward
```

Mid:

```text
Medium Risk
Medium Reward
```

Late:

```text
High Risk
High Reward
```

Dynamic event:

```text
Player Build
+
Biome
+
HP
+
Economy
+
Previous Choices
```

määrittävät tarjotut vaihtoehdot.

---

# 25. SHOP SCALING

Shop ei saa muuttua pelkäksi stat inflationiksi.

Myöhemmillä alueilla:

```text
More options
+
More specialization
+
More risk
+
More build-defining units
```

Esimerkiksi:

```text
Early:
Common units

Mid:
Specialists

Late:
Build-defining units

Endgame:
Transformative units
```

---

# 26. BOSS SCALING

Bossien vaikeus perustuu vaiheisiin.

```text
PHASE 1
Learn

PHASE 2
Pressure

PHASE 3
Adapt

PHASE 4
Desperation
```

Bossin HP ei yksin määritä vaikeutta.

Boss voi muuttaa:

* targetingia
* arena-efektejä
* ability rotationia
* summon patternia
* resistances
* positioningia
* damage patternia.

---

# 27. BOSS COMEBACK MECHANIC

Bossilla voi olla:

```text
Desperation Phase
```

Kun HP:

```text
< 30%
```

Boss saa uuden käyttäytymisen.

Esimerkiksi:

```text
The Root King

Phase 1:
Roots

Phase 2:
Summons

Phase 3:
Arena corruption

Phase 4:
Desperation
```

---

# 28. ADAPTIVE BOSS

Endgame-bossi voi arvioida pelaajan buildia.

Esimerkiksi:

```text
Player:
Heavy Frontline

Boss:
Backline pressure
+
Armor break
```

Tai:

```text
Player:
Summon build

Boss:
AOE
```

Tai:

```text
Player:
Healing build

Boss:
Anti-heal
```

Counterin pitää kuitenkin olla ennakkoon telegraphattu.

Pelaajalle pitää antaa mahdollisuus ymmärtää:

> “Miksi tämä tapahtuu?”

---

# 29. TELEGRAPH SYSTEM

Kaikki merkittävät vaikeat mekaniikat pitää näyttää pelaajalle.

Esimerkiksi:

```text
⚠ BOSS WILL CAST MASS ROOT NEXT TURN
```

tai visuaalisesti:

```text
Arena alkaa kasvaa juurista
```

Tavoite:

```text
Difficulty = Decision
```

ei:

```text
Difficulty = Surprise
```

---

# 30. DIFFICULTY TIERS

Normal-runissa:

```text
T0 — Introduction
T1 — Learning
T2 — Developing
T3 — Advanced
T4 — Elite
T5 — Mastery
```

---

# 31. TIER T0 — INTRODUCTION

Tavoite:

Opeta peli.

Viholliset:

* yksinkertaisia
* vähän synergyä
* vähän statusvaikutuksia

Ei:

* monimutkaisia countereita
* instant-kill mechanics
* vaikeita environmental mechanicseja

---

# 32. TIER T1 — LEARNING

Pelaaja oppii:

* roleja
* tribeja
* synergyjä
* formationia
* economyä.

---

# 33. TIER T2 — DEVELOPING

Peli alkaa vaatia:

* build coherencea
* pivotointia
* counterplayta
* resource managementia.

---

# 34. TIER T3 — ADVANCED

Pelaajan täytyy ymmärtää:

```text
Enemy Build
+
Player Weakness
+
Positioning
+
Timing
```

---

# 35. TIER T4 — ELITE

Encounterit voivat käyttää:

* advanced synergies
* elite modifiers
* adaptive AI
* environmental effects
* complex abilities.

---

# 36. TIER T5 — MASTERY

T5 on tarkoitettu pelaajille, jotka ymmärtävät järjestelmät syvällisesti.

Haaste:

```text
Adaptation
+
Planning
+
Optimization
+
Risk Management
+
Execution
```

---

# 37. ASCENSION / CHALLENGE SYSTEM

Normaalin progression päälle voidaan lisätä Ascension.

```text
Ascension 0
Normal

Ascension 1
+Enemy Complexity

Ascension 2
+Elite Frequency

Ascension 3
+Environmental Pressure

Ascension 4
+Resource Pressure

Ascension 5
+Enemy Adaptation

Ascension 6
+Boss Modifier

Ascension 7
+Reduced Recovery

Ascension 8
+Advanced Encounters

Ascension 9
+Extreme Synergy

Ascension 10
Mastery
```

Ascension-modifierit eivät saa kaikki olla stat buffeja.

---

# 38. CHALLENGE MODIFIERS

Erilliset challenge-modifierit:

```text
DOUBLE TROUBLE
More elite encounters

STARVING FOREST
Reduced economy

WILD GROWTH
Enemies gain temporary buffs

DEEP FOG
Reduced information

ANCIENT LAW
Certain synergies behave differently

BROKEN ROOTS
Formation restrictions

CORRUPTED WORLD
Environmental hazards

RIVALRY
Nemesis appears more often
```

---

# 39. DAILY / SEEDED DIFFICULTY

Seeded run:

```text
Seed
+
Ruleset
+
Difficulty
+
Modifier
```

Kaikki pelaajat voivat pelata saman haasteen.

Esimerkiksi:

```text
Daily Seed
Seed: HW-2049-X
Difficulty: 7
Modifier:
Mirefall Corruption
```

---

# 40. FAIRNESS RULE

Difficulty engine ei saa:

* muuttaa RNG:tä pelaajaa vastaan
* antaa viholliselle ilmaista Goldia
* antaa viholliselle ylimääräisiä unitteja ilman sääntöä
* rikkoa omia pelisääntöjään
* poistaa pelaajan counterplayta
* tehdä hidden hard counteria
* muuttaa RNG seed -logiikkaa salaa.

Enemy pelaa samoilla perussäännöillä kuin pelaaja.

---

# 41. DIFFICULTY TRANSPARENCY

Pelaajalle voidaan näyttää:

```text
Threat:
██████░░░░

Encounter:
Advanced

Enemy Strategy:
Control + Poison

Primary Threat:
Backline pressure

Recommended Responses:
Cleanse
+
Frontline protection
```

Tämä tekee vaikeudesta ymmärrettävää.

---

# 42. STRATEGIC WARNING SYSTEM

Ennen encounteria:

```text
SCOUTING

Enemy:
Frostroot Control

Threat:
★★★★★

Weakness:
Low Burst

Expected:
Long Combat
```

Pelaaja voi muuttaa:

* formationia
* unitteja
* itemeitä
* reliccejä
* routea.

---

# 43. DIFFICULTY PREVIEW

Kartalla:

```text
○ Easy
△ Moderate
◆ Dangerous
★ Elite
☠ Boss
```

Lisäksi:

```text
Enemy Complexity
Environmental Risk
Reward
```

---

# 44. REWARD SCALING

Suurempi haaste antaa paremman mahdollisuuden palkintoihin.

Mutta:

```text
Difficulty ↑
≠
Guaranteed Legendary
```

Reward quality käyttää omaa budgettia:

```text
Risk
+
Reward
+
Build relevance
```

---

# 45. DIFFICULTY × REWARD

Esimerkki:

```text
Easy
Reward Power: 10

Moderate
Reward Power: 18

Dangerous
Reward Power: 30

Elite
Reward Power: 45

Boss
Reward Power: 70
```

Arvot ovat balansointia varten.

---

# 46. DYNAMIC DIFFICULTY

Järjestelmä voi arvioida:

```text
Player Power
Enemy Power
Run Progress
HP
Economy
Build Stability
```

ja muodostaa:

```text
Encounter Recommendation
```

Mutta encounterin pitäisi pysyä ennustettavana.

---

# 47. NO RUBBER-BANDING

Hearthwood ei käytä aggressiivista rubber-bandingia.

Huono:

```text
Player gets strong
→
Enemies instantly become equally strong
```

Hyvä:

```text
Player gets strong
→
Later content naturally tests that power
```

---

# 48. DIFFICULTY STATE MACHINE

```text
SAFE
 ↓
NORMAL
 ↓
PRESSURED
 ↓
DANGEROUS
 ↓
CRITICAL
 ↓
MASTER
```

State perustuu:

```text
Run Progress
+
Encounter
+
Player Power
+
HP
+
Difficulty Mode
```

---

# 49. DIFFICULTY ESCALATION ENGINE

Uusi palvelu:

```text
DifficultyEngine
```

Vastuut:

* laskea difficulty
* laskea encounter budget
* laskea enemy power
* valita complexity
* valita modifiers
* arvioida player power
* arvioida threat
* validoida fairness
* tuottaa difficulty preview.

---

# 50. DATA MODEL

```text
DifficultyProfile {
  id
  name

  baseDifficulty
  statScaling
  complexityScaling
  aiScaling
  counterScaling
  environmentScaling
  economyPressure

  enemyPowerBudget
  encounterBudget
  rewardMultiplier

  maxModifiers
}
```

---

# 51. ENCOUNTER MODEL

```text
EncounterDifficulty {
  basePower
  complexity
  synergyLevel
  counterLevel
  aiLevel
  environmentalLevel

  eliteChance
  specialMechanicChance

  rewardTier
}
```

---

# 52. PLAYER POWER MODEL

```text
PlayerPowerSnapshot {
  unitPower
  starPower
  synergyPower
  itemPower
  relicPower
  formationPower
  economyPower

  buildCoherence
  survivability
  burst
  sustain
  control
  utility

  totalPower
}
```

---

# 53. DIFFICULTY EVENT PIPELINE

```text
RUN STATE
   ↓
PLAYER POWER ANALYSIS
   ↓
WORLD / BIOME
   ↓
ACT
   ↓
ENCOUNTER TYPE
   ↓
DIFFICULTY ENGINE
   ↓
ENCOUNTER BUDGET
   ↓
ENEMY GENERATION
   ↓
COUNTER VALIDATION
   ↓
FAIRNESS CHECK
   ↓
REWARD GENERATION
   ↓
PLAYER
```

---

# 54. FAIRNESS VALIDATOR

Ennen encounterin käynnistämistä:

```text
DifficultyFairnessValidator
```

tarkistaa:

```text
Is enemy power within budget?
Is counterplay available?
Is encounter beatable?
Is mechanic telegraphed?
Is reward appropriate?
Is enemy using legal rules?
```

Jos ei:

```text
REGENERATE ENCOUNTER
```

---

# 55. SIMULATION VALIDATION

Koska Hearthwood käyttää deterministic combat -järjestelmää:

```text
Seed
+
Ruleset
+
Encounter
+
Player Build
```

voidaan simuloida etukäteen.

Test:

```text
1000 simulations
```

ja analysoida:

```text
Win Rate
Average Damage
Average Duration
Death Causes
Build Counter Rate
```

---

# 56. DIFFICULTY BALANCING TARGET

Normaalissa sisällössä:

```text
Early encounter:
80–95% expected win rate

Mid encounter:
60–85%

Elite:
35–70%

Boss:
25–60%
```

Nämä eivät ole lopullisia arvoja vaan lähtökohtia playtestille.

---

# 57. DEFEAT ANALYSIS

Jos pelaaja häviää:

```text
YOU LOST
```

ei riitä.

Näytetään:

```text
PRIMARY FAILURE:
Backline collapsed

SECONDARY:
Low anti-control

ENEMY ADVANTAGE:
Frostroot Control

YOUR BUILD STRENGTH:
High sustain

RECOMMENDED ADAPTATION:
Protect healer
or
Add cleanse
```

---

# 58. LEARNING LOOP

Häviö:

```text
DEFEAT
 ↓
ANALYSIS
 ↓
UNDERSTANDING
 ↓
ADAPTATION
 ↓
NEXT RUN
```

Tämä on tärkeä osa Hearthwoodin roguelite-kokemusta.

---

# 59. MASTERY SCALING

Pelin vaikeus ei saa päättyä siihen, että pelaaja oppii “oikean buildin”.

Mastery syntyy:

```text
Knowledge
+
Adaptation
+
Execution
+
Risk Management
```

Pelaajan pitää pystyä voittamaan erilaisilla strategioilla.

---

# 60. ANTI-SOLVING SYSTEM

Jos yksi strategia ratkaisee kaiken:

```text
Dominant Strategy Detected
```

järjestelmä kirjaa:

```text
Build ID
Win Rate
Pick Rate
Counter Rate
Average Run Length
```

Tätä käytetään balance-dataan.

Ei salaisena rankaisuna.

---

# 61. META VS RUN BALANCE

Erota:

```text
RUN BALANCE
```

ja:

```text
META BALANCE
```

Run balance:

> Onko tämä encounter reilu juuri tässä tilanteessa?

Meta balance:

> Onko jokin build liian vahva koko pelissä?

Näitä ei pidä sekoittaa.

---

# 62. PERFORMANCE-AWARE SCALING

Peli voi seurata pelaajan taitotasoa pitkällä aikavälillä:

```text
Mastery Score
```

Esimerkiksi:

```text
New Player
Developing
Experienced
Advanced
Master
```

Tätä käytetään ensisijaisesti:

* Challenge Modeen
* Dailyihin
* Optional difficultyyn
* Endgameen.

Normal-runissa pelaajaa ei saa salaa rangaista mastery-tason perusteella.

---

# 63. DIFFICULTY PERSONALIZATION

Tulevaisuudessa:

```text
Player Preference
+
Mastery
+
Run History
```

voidaan käyttää suosittelemaan:

```text
Suggested Difficulty
```

Esimerkiksi:

> “Olet voittanut kolme viimeistä runia ilman merkittävää HP-menetyksiä. Ascension 2 voisi olla sopiva seuraava haaste.”

---

# 64. CORE FORMULA

Hearthwoodin lopullinen challenge formula:

```text
CHALLENGE
=
POWER
+
COMPLEXITY
+
COUNTERPLAY
+
POSITIONING
+
TIMING
+
RESOURCE PRESSURE
+
ADAPTATION
```

Ei:

```text
CHALLENGE = BIGGER NUMBERS
```

---

# 65. IMPLEMENTATION ARCHITECTURE

Suositeltu rakenne:

```text
systems/
└── difficulty/
    ├── DifficultyEngine
    ├── DifficultyProfile
    ├── DifficultyScaler
    ├── PlayerPowerAnalyzer
    ├── EncounterBudget
    ├── EncounterGenerator
    ├── CounterEvaluator
    ├── FairnessValidator
    ├── RewardScaler
    ├── BossScaler
    ├── EnvironmentScaler
    ├── ChallengeModifiers
    ├── AscensionSystem
    ├── DifficultyPreview
    └── DifficultyTelemetry
```

---

# 66. EVENT BUS

Difficulty Engine käyttää event busia:

```text
RUN_STARTED
ACT_STARTED
BIOME_CHANGED
PLAYER_POWER_CHANGED
BUILD_CHANGED
SYNERGY_ACTIVATED
UNIT_UPGRADED
ELITE_ENTERED
BOSS_ENTERED
BOSS_PHASE_CHANGED
PLAYER_DEFEATED
```

---

# 67. DEBUG MODE

Developerille:

```text
Difficulty Debug
```

Näyttää:

```text
Player Power: 72
Expected Power: 65

Difficulty: 68

Enemy Power: 60
Complexity: 74
Counter Level: 42
AI Level: 55
Environment: 30

Encounter Budget:
████████░░

Fairness:
PASS
```

---

# 68. TELEMETRY

Kerätään:

```text
Encounter ID
Seed
Difficulty
Player Power
Enemy Power
Win/Loss
Combat Duration
Damage Taken
Failure Reason
Build
Tribe
Synergies
Items
Relics
Boss Phase
```

Tämän avulla voidaan löytää:

* liian helppo sisältö
* liian vaikea sisältö
* broken buildit
* huonot encounterit
* turhat unitit
* liian vahvat counterit.

---

# 69. QA

Jokaisen difficulty-tason pitää testata:

### Balance

* ei mahdottomia encountereita
* ei automaattisia voittoja
* ei runaway scalingia

### Fairness

* counterplay olemassa
* telegraph olemassa
* enemy käyttää samoja sääntöjä

### Progression

* difficulty kasvaa havaittavasti
* pelaaja ymmärtää miksi

### Variety

* eri encounterit haastavat eri asioita

### Reproducibility

```text
Same Seed
+
Same Version
=
Same Difficulty
```

---

# 70. ACCEPTANCE CRITERIA

Järjestelmä hyväksytään, kun:

* difficulty kasvaa runin aikana
* scaling ei perustu pelkästään HP:hen
* player power voidaan laskea
* encounter budget toimii
* enemy complexity kasvaa asteittain
* counterplay kasvaa asteittain
* bossit käyttävät phase-based scalingia
* difficulty preview toimii
* fairness validator toimii
* seeded runit ovat deterministisiä
* defeat analysis toimii
* Ascension toimii erillisenä järjestelmänä
* challenge modifiers toimivat
* normal-run ei käytä epäreilua rubber-bandingia
* enemy ei saa ilmaista piilovoimaa
* vaikeus voidaan debugata.

---

# 71. MVP

Ensimmäiseen toteutukseen riittää:

```text
DifficultyEngine
PlayerPowerAnalyzer
DifficultyProfile
EncounterBudget
Basic Enemy Scaling
Basic Complexity Scaling
Difficulty Preview
Fairness Validator
Boss Scaling
Difficulty Debug
```

Ei tarvitse heti rakentaa:

```text
Mastery Personalization
Advanced Telemetry
Meta Detection
Complex Dynamic Events
```

---

# 72. DEVELOPMENT ORDER

## Phase 1

```text
PlayerPowerAnalyzer
```

## Phase 2

```text
DifficultyProfile
```

## Phase 3

```text
DifficultyEngine
```

## Phase 4

```text
EncounterBudget
```

## Phase 5

```text
EnemyScaling
```

## Phase 6

```text
ComplexityScaling
```

## Phase 7

```text
CounterScaling
```

## Phase 8

```text
BossScaling
```

## Phase 9

```text
FairnessValidator
```

## Phase 10

```text
DifficultyPreview
```

## Phase 11

```text
Debug + Telemetry
```

## Phase 12

```text
Ascension / Challenge Mode
```

---

# 73. FINAL DESIGN PRINCIPLE

Hearthwoodin haasteen tulee tuntua tältä:

```text
Act 1:

"Osaan pelata tätä."


Act 2:

"Minun pitää rakentaa paremmin."


Act 3:

"Minun pitää ymmärtää vihollista."


Act 4:

"Minun pitää mukautua."


Boss:

"Minun pitää todella ymmärtää oma buildini."


Mastery:

"Minun pitää osata rakentaa voitto lähes mistä tahansa."
```

---

# 74. NORTH STAR

> **Hearthwood ei kysy pelaajalta, kuinka paljon voimaa hänellä on.**
>
> **Hearthwood kysyy, kuinka hyvin hän osaa käyttää sitä.**

Progressiivisen haasteen lopullinen tavoite:

```text
EASY TO ENTER
        ↓
HARD TO MASTER
        ↓
FAIR TO LOSE
        ↓
REWARDING TO LEARN
        ↓
ENDLESSLY REPLAYABLE
```

**Hearthwood Challenge System**

```text
BUILD
 ↓
POWER
 ↓
THREAT
 ↓
COUNTER
 ↓
ADAPTATION
 ↓
MASTERY
```

Tämä järjestelmä yhdistyy suoraan Hearthwoodin nykyisiin **Enemy AI-, Synergy-, Economy-, Formation-, Boss-, Seed-, Combat Replay- ja Dynamic Difficulty** -järjestelmiin.
