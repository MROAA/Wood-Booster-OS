> **North-star design doc — the story side of the difficulty curve.** Marc
> pasted this in full on 2026-09-10, during the Market Events round
> (PR #442). It is the STORY-DRIVEN companion to
> `hearthwood-progressive-challenge-prd.md` (the four-axis `DifficultyEngine`
> from #435): where that one is the internal power/coherence math, this one
> ties the whole curve to **story progress** — the further into the forest
> the player travels, the harder AND LONGER the battles get, but "deeper,
> not just longer" (§1). A per-Act difficulty profile (§4-9: The Edge →
> The Deep Woods → The Ancient Grove → The Corrupted Wild → The Heartwood),
> each with a **combat-length target curve** (§10: Act I 15-30s normal …
> Act V 90-150s+, per encounter type) and **explicitly no HP sponges**
> (§11, §16 — length comes from Defense + Healing + Abilities + Synergies
> + Positioning + Phases + Adaptation scaling in that priority order, not
> `HP × 5`). Scaling axes that ramp per Act: enemy composition (Simple →
> Role → Synergy → Counter → Adaptive team, §17), enemy synergy count
> (1 → 4+, §18), ability complexity (§19), status vocabulary (§20), AI
> level (Basic → Role-aware → Synergy-aware → Counter-aware → Adaptive,
> §21), targeting sophistication (§22), positioning pressure / flanking
> (§23), economy pressure (§24), recovery scarcity (§25). A 4-stage
> **combat phase system** (Opening / Pressure / Escalation / Desperation,
> §13-14) with **combat escalation events** at turn milestones (§29), an
> **escalation timer** + **soft enrage** (+small temp power every N sec,
> §30-31) and a boss-only **hard enrage** (§32), an **anti-stall system**
> that detects `damage dealt ≈ damage healed` and ramps escalation after
> showing "THE FOREST GROWS RESTLESS" (§33). Boss phase count scales per
> Act (1-2 → 3-4 + Desperation, §34) and a phase must *change the game*
> not just buff stats (§35-36). Biome-specific difficulty flavours
> (Autumnwood tempo/swarm, Frostroot control/freeze, Sunspire
> shield/burst, Mirefall poison/decay, §37). A **WorldState** (Calm →
> Awakening → Ancient → Corrupted → Heartwood Crisis, §39-40) that story
> progress drives, feeding enemies / encounters / environment / events /
> bosses / market / synergies. **Not every fight is long** (§42-43 — a
> 30/40/20/10 short/normal/long/special mix, quick counter-able encounters
> stay in the endgame). **Reward ≠ combat duration** (§45 — reward =
> encounter difficulty + risk + story progress + type, so the player is
> never incentivised to stall). The `StoryDifficultyEngine` service
> (§46-49): inputs {StoryAct, Biome, PlayerPower, EncounterType, BossType,
> DifficultyMode, WorldState} → outputs {EnemyPower, EnemyComplexity,
> CombatLengthTarget, AbilityComplexity, SynergyLevel, EnvironmentLevel,
> BossPhaseCount}. Data models `StoryDifficultyProfile` / `CombatDifficultyProfile`
> (§47-48). **Combat simulation validation** (§50: 1000 deterministic
> sims per encounter → average duration / win rate / damage taken / death
> cause / phase reached / stall rate; a `TargetDuration` with
> acceptable/warning/critical bands, §51) + combat-length analytics
> (§52 — "Mirefall's fights all run 40% too long"). A post-combat
> **COMBAT SUMMARY** (§53: duration, threat, your build's shape, the enemy,
> the key moment). Story-based feature unlocks (§54 — status system
> expands Act II, advanced synergy Act III, environmental combat Act IV,
> adaptive enemies Act V) so systems don't all arrive at once. §57-58 tie
> it to the Market: STORY → DIFFICULTY → MARKET TIER → stronger units →
> stronger build → harder combat, a self-balancing loop. §60 acceptance
> criteria; §61 North Star: *"The deeper you go, the longer the forest
> fights back."* **Status: north star, not a work order** — the dedicated
> difficulty-calibration effort Marc flagged (see the
> `hearthwood-fairness-lower-weight-for-now` memory) will work from this
> doc + `hearthwood-progressive-challenge-prd.md` together. Much already
> exists in skeleton form: 7-Act `DIFFICULTY_TIERS` + `difficultyFactorForNode`
> (runEngine.js), boss `phases`, elite `passive` gimmicks + phases,
> `forestState` (Forest Mood), the #432 threat preview, the #436
> `evaluatePlayerPower` analyzer, the #423 `analyzeOutcome` battle recap.
> What's missing: the per-Act combat-length targets, the escalation
> timer / soft-enrage / anti-stall, per-Act enemy AI/synergy/ability
> ramps, the biome layer, the simulation-validation harness, WorldState.

---

# HEARTHWOOD

## PRD — Progressive Story Difficulty & Combat Scaling

**Genre:** Tactical Auto-Battler / Roguelite / Story Strategy
**System:** Story-Driven Progressive Difficulty
**Core Principle:** The further the player travels into the forest, the harder and longer the battles become.

---

# 1. VISION

Hearthwoodin vaikeusaste kasvaa **tarinan etenemisen mukana**.

Pelaaja aloittaa metsän reunalta, jossa taistelut ovat:

* lyhyitä
* helposti ymmärrettäviä
* vähän mekanismeja sisältäviä
* matalan riskin kohtaamisia.

Mitä syvemmälle pelaaja etenee, sitä enemmän metsä muuttuu.

```text
FOREST EDGE
    ↓
DEEP FOREST
    ↓
ANCIENT WOODS
    ↓
CORRUPTED LANDS
    ↓
HEART OF THE FOREST
```

Samalla:

```text
Enemy HP       ↑
Enemy Damage   ↑
Enemy Defense  ↑
Combat Length  ↑
Ability Count  ↑
Synergy Depth  ↑
AI Complexity  ↑
Mechanics      ↑
Boss Phases    ↑
Player Risk    ↑
```

Mutta tärkein asia:

> **Taistelun pitää muuttua syvemmäksi, ei vain pidemmäksi.**

---

# 2. CORE DESIGN GOAL

Pelin alkupuolella pelaaja ajattelee:

> “Voitanko tämän taistelun?”

Myöhemmin:

> “Kestääkö buildini tämän taistelun?”

Lopussa:

> “Pystyykö buildini selviytymään pitkästä taistelusta, jossa vihollinen muuttaa strategiaansa?”

Tämä muodostaa luonnollisen vaikeuskäyrän.

---

# 3. STORY = DIFFICULTY PROGRESSION

Tarina ja vaikeus eivät ole erillisiä.

Tarina määrittää:

```text
Story Progress
      ↓
World State
      ↓
Enemy Evolution
      ↓
Combat Difficulty
      ↓
Combat Duration
```

Kun pelaaja etenee:

* metsä muuttuu
* viholliset muuttuvat
* vihollisten synergiat kehittyvät
* uusia mekanismeja ilmestyy
* taistelut pitenevät
* bossit saavat lisää vaiheita
* pelaajan buildiltä vaaditaan enemmän.

---

# 4. STORY ACT STRUCTURE

Suositeltu rakenne:

```text
ACT I
THE EDGE

ACT II
THE DEEP WOODS

ACT III
THE ANCIENT GROVE

ACT IV
THE CORRUPTED WILD

ACT V
THE HEARTWOOD
```

Jokaisella Actilla on oma vaikeusprofiilinsa.

---

# 5. ACT I — THE EDGE

## Tarinan tarkoitus

Opetetaan pelaajalle Hearthwood.

Pelaaja oppii:

* unitit
* roolit
* tribet
* synergyt
* formation
* Market
* abilityt.

## Combat

Taistelut ovat lyhyitä.

```text
Target:
15–30 sec
```

Viholliset:

* 2–4 unitia
* vähän synergyä
* yksinkertaiset abilityt
* vähän statuksia.

---

# 6. ACT II — THE DEEP WOODS

Pelaaja alkaa ymmärtää peliä.

Uudet asiat:

* vahvemmat synergyt
* specialized enemies
* status effects
* enemmän formation pressurea
* enemmän enemy roles.

Combat:

```text
Target:
25–45 sec
```

Viholliset alkavat muodostaa oikeita tiimejä.

Esimerkiksi:

```text
Tank
+
Healer
+
DPS
```

---

# 7. ACT III — THE ANCIENT GROVE

Tässä kohtaa peli alkaa todella testata pelaajan buildia.

Uudet mekanismit:

* advanced synergy
* cross-tribe builds
* enemy combos
* stronger abilities
* interrupts
* advanced status interactions
* positioning pressure.

Combat:

```text
Target:
40–70 sec
```

Taisteluissa voi tapahtua useita strategisia vaiheita.

---

# 8. ACT IV — THE CORRUPTED WILD

Tämä on high-pressure act.

Viholliset:

* adaptive
* synergy-aware
* counter-aware
* stronger formations
* complex abilities.

Ympäristö alkaa vaikuttaa taisteluihin.

Esimerkiksi:

```text
Corruption
Poison
Roots
Fog
Environmental hazards
```

Combat:

```text
Target:
60–100 sec
```

---

# 9. ACT V — THE HEARTWOOD

Loppupeli.

Pelaaja kohtaa:

* Ancient enemies
* Legendary enemies
* advanced synergy builds
* adaptive AI
* multi-phase bosses
* environmental mechanics.

Combat:

```text
Target:
90–150+ sec
```

Pitkä taistelu ei saa tuntua hitaalta.

Sen pitää tuntua **strategiselta tapahtumalta**.

---

# 10. COMBAT LENGTH CURVE

Perusperiaate:

```text
EARLY
████

MID
████████

LATE
████████████

ENDGAME
████████████████
```

Esimerkkitavoitteet:

| Story   |  Normal |    Elite |     Boss |
| ------- | ------: | -------: | -------: |
| Act I   |  15–30s |   25–40s |   45–60s |
| Act II  |  25–45s |   40–60s |   60–90s |
| Act III |  40–70s |   60–90s |  90–120s |
| Act IV  | 60–100s |  80–120s | 120–180s |
| Act V   | 90–150s | 120–180s | 150–240s |

Nämä ovat **balansoinnin lähtöarvoja**, eivät kovia rajoja.

---

# 11. IMPORTANT: NO ARTIFICIAL HP SPONGES

Taistelun pidentäminen ei saa tapahtua vain:

```text
Enemy HP × 5
```

Sen sijaan:

```text
Enemy HP
+
Defense
+
Healing
+
Abilities
+
Synergies
+
Positioning
+
Phases
+
Adaptation
```

kasvavat asteittain.

---

# 12. WHY COMBAT GETS LONGER

Myöhäisen pelin taistelut pitenevät, koska molemmilla osapuolilla on enemmän asioita tapahtumassa.

Early:

```text
Attack
→
Damage
→
Death
```

Late:

```text
Attack
→
Shield
→
Status
→
Cleanse
→
Counter
→
Ability
→
Interrupt
→
Heal
→
Position change
→
Synergy trigger
→
Phase change
```

Tämä tekee taistelusta pidemmän luonnollisesti.

---

# 13. COMBAT PHASE SYSTEM

Pitkät taistelut jaetaan vaiheisiin.

```text
PHASE 1
Opening

PHASE 2
Pressure

PHASE 3
Escalation

PHASE 4
Desperation
```

Kaikki taistelut eivät tarvitse kaikkia vaiheita.

Bossit käyttävät niitä enemmän.

---

# 14. NORMAL COMBAT PHASES

Normaali encounter:

```text
OPENING
 ↓
MAIN FIGHT
 ↓
RESOLUTION
```

Elite:

```text
OPENING
 ↓
POWER SPIKE
 ↓
RESOLUTION
```

Boss:

```text
INTRO
 ↓
PHASE 1
 ↓
PHASE 2
 ↓
PHASE 3
 ↓
DESPERATION
```

---

# 15. ENEMY STAT SCALING

Stats kasvavat story progressin mukana.

```text
EnemyPower =
BasePower
× StoryMultiplier
× EncounterMultiplier
× DifficultyMultiplier
```

Mutta scalingissa käytetään caps-arvoja.

---

# 16. STAT PRIORITY

Kun peli etenee, prioriteetti on:

```text
1. Enemy Composition
2. Synergy
3. Ability Complexity
4. Defense
5. HP
6. Damage
```

Tämä estää HP-spongien syntymisen.

---

# 17. ENEMY COMPOSITION SCALING

Act I:

```text
Simple Team
```

Act II:

```text
Role Team
```

Act III:

```text
Synergy Team
```

Act IV:

```text
Counter Team
```

Act V:

```text
Adaptive Team
```

---

# 18. SYNERGY SCALING

Enemy synergy progression:

```text
ACT I
1 basic synergy

ACT II
1–2 synergies

ACT III
2–3 synergies

ACT IV
3–4 synergies

ACT V
4+ advanced synergies
```

Enemy synergyjen pitää käyttää samoja perusperiaatteita kuin pelaajan.

---

# 19. ABILITY SCALING

Early:

```text
1 ability / unit
Simple effects
```

Mid:

```text
Combo abilities
Status effects
```

Late:

```text
Conditional abilities
Chain abilities
Interrupts
Reactions
```

Boss:

```text
Phase abilities
Arena abilities
Transformation abilities
```

---

# 20. STATUS SCALING

Early:

```text
Poison
Burn
Slow
Shield
```

Mid:

```text
Freeze
Root
Silence
Bleed
```

Late:

```text
Decay
Curse
Corruption
Status reactions
```

Endgame:

```text
Multi-status interactions
```

---

# 21. ENEMY AI SCALING

AI kehittyy tarinan mukana.

```text
ACT I
Basic AI

ACT II
Role-aware AI

ACT III
Synergy-aware AI

ACT IV
Counter-aware AI

ACT V
Adaptive AI
```

Tämä tekee myöhäisestä pelistä vaikeamman ilman valtavaa stat inflationia.

---

# 22. TARGETING SCALING

Early:

```text
Attack nearest target
```

Mid:

```text
Attack lowest HP
```

Advanced:

```text
Target healer
Target carry
Target vulnerable unit
```

Endgame:

```text
Evaluate threat
+
formation
+
ability timing
+
synergy
+
player weakness
```

---

# 23. POSITIONING SCALING

Early:

Formation on pääosin pelaajan oma asia.

Mid:

Viholliset alkavat hyödyntää formationia.

Late:

Viholliset yrittävät:

* flankata
* rikkoa frontlinea
* painostaa backlinea
* pakottaa repositioningiin
* käyttää terrainia.

---

# 24. ECONOMY PRESSURE SCALING

Myöhäisemmässä pelissä taistelun ulkopuolinen paine kasvaa.

Esimerkiksi:

```text
Act I
Safe economy

Act II
Moderate economy pressure

Act III
Meaningful spending decisions

Act IV
High opportunity cost

Act V
Severe resource management
```

Pelaaja joutuu miettimään:

> “Käytänkö resurssit nyt vai säästänkö seuraavaa taistelua varten?”

---

# 25. HEALING / RECOVERY SCALING

Early:

Recovery on helpompaa.

Late:

Recovery on rajallisempaa.

Tämä luo jatkuvaa painetta:

```text
Combat
 ↓
Damage
 ↓
Recovery decision
 ↓
Next combat
```

Mutta pelaajalle pitää tarjota mahdollisuuksia palautua.

---

# 26. PLAYER POWER EXPECTATION

Jokaisella Story Actilla on Expected Power.

```text
Act I
Low

Act II
Medium

Act III
High

Act IV
Very High

Act V
Extreme
```

Encounterit generoidaan tämän ympärille.

---

# 27. PLAYER BUILD REQUIREMENT

Early:

```text
Any reasonable build
```

Mid:

```text
Coherent build
```

Late:

```text
Strong synergy
```

Endgame:

```text
Synergy
+
Positioning
+
Items
+
Counterplay
+
Adaptation
```

---

# 28. BUILD SURVIVABILITY

Myöhäisen pelin buildiä arvioidaan useilla akseleilla:

```text
Burst
Sustain
Defense
Control
Anti-Control
AOE
Single Target
Healing
Protection
Adaptation
```

Jos buildi on hyvä vain yhdessä asiassa, myöhempi sisältö voi paljastaa sen heikkouden.

---

# 29. COMBAT ESCALATION EVENTS

Pitkissä taisteluissa voi tapahtua:

```text
COMBAT EVENT
```

Esimerkiksi:

```text
Turn 10:
Arena changes

Turn 15:
Enemy gains new behavior

Turn 20:
Boss phase

Turn 25:
Environmental hazard
```

Tämä estää pitkää taistelua muuttumasta tylsäksi DPS-checkiksi.

---

# 30. ESCALATION TIMER

Bossien ja joidenkin elite-taistelujen sisällä voidaan käyttää:

```text
EscalationTimer
```

Esimerkiksi:

```text
0–20s
Normal

20–40s
Pressure

40–60s
Escalation

60s+
Desperation
```

Mitä pidempään taistelu kestää, sitä vaarallisemmaksi tilanne muuttuu.

---

# 31. SOFT ENRAGE

Pitkissä taisteluissa voidaan käyttää Soft Enragea.

Esimerkiksi:

```text
Every 15 seconds:
Enemy gains +small temporary power
```

Tai:

```text
Boss ability cooldown decreases.
```

Tämä estää loputtomat stall-buildit.

---

# 32. HARD ENRAGE

Vain erityisissä boss-taisteluissa.

Esimerkiksi:

```text
After 180 sec:
Boss enters Final Desperation.
```

Tämä on viimeinen vaihe.

---

# 33. ANTI-STALL SYSTEM

Peli tunnistaa tilanteen:

```text
Damage dealt ≈ Damage healed
```

ja taistelu ei etene.

Tällöin:

```text
Escalation ↑
```

Mutta pelaajalle näytetään:

```text
THE FOREST GROWS RESTLESS
```

ennen merkittävää muutosta.

---

# 34. BOSS SCALING

Bossit kasvavat tarinan mukana.

Act I boss:

```text
1–2 phases
```

Act II:

```text
2 phases
```

Act III:

```text
2–3 phases
```

Act IV:

```text
3 phases
```

Act V:

```text
3–4 phases
+
Desperation
```

---

# 35. BOSS PHASE DESIGN

Boss Phase ei ole vain:

```text
HP < 50%
→
Damage +50%
```

Sen pitäisi muuttaa peliä.

Esimerkiksi:

```text
PHASE 1
Boss summons roots

PHASE 2
Arena becomes corrupted

PHASE 3
Boss targets backline

PHASE 4
Forest collapses
```

---

# 36. STORY BOSS EXAMPLE

## The Ancient Root

### Phase 1

```text
Heavy frontline
Root attacks
```

### Phase 2

```text
Summons Ancient Saplings
```

### Phase 3

```text
Arena corruption
Healing reduced
```

### Phase 4

```text
Desperation
Massive root attack
```

Pelaajan pitää mukautua.

---

# 37. BIOME-SPECIFIC DIFFICULTY

Jokainen biome lisää vaikeutta eri tavalla.

## AUTUMNWOOD

Painotus:

```text
Tempo
Swarm
Economy
```

## FROSTROOT

Painotus:

```text
Control
Slow
Freeze
Defense
```

## SUNSPIRE

Painotus:

```text
Shield
Cleanse
Burst
Radiance
```

## MIREFALL

Painotus:

```text
Poison
Decay
Corruption
Status
```

---

# 38. STORY ESCALATION

Tarina voi selittää vaikeuden.

Alussa:

> Metsä on villi.

Myöhemmin:

> Metsä tietää, että olet täällä.

Lopussa:

> Metsä vastustaa sinua.

Tällöin gameplay-scaling tuntuu tarinan luonnolliselta seuraukselta.

---

# 39. WORLD STATE

Story progression muuttaa:

```text
WorldState
```

joka vaikuttaa:

```text
Enemies
Encounters
Environment
Events
Bosses
Market
Synergies
```

---

# 40. WORLD STATE EXAMPLE

```text
WORLD STATE 1
Calm Forest

WORLD STATE 2
Awakening Forest

WORLD STATE 3
Ancient Forest

WORLD STATE 4
Corrupted Forest

WORLD STATE 5
Heartwood Crisis
```

---

# 41. COMBAT LENGTH IS A DESIGN TOOL

Taistelun pituutta käytetään kertomaan pelaajalle:

```text
Early:
"Learn."

Mid:
"Build."

Late:
"Adapt."

Endgame:
"Master."
```

---

# 42. NOT EVERY COMBAT SHOULD BE LONG

Tärkeä sääntö:

**Peli ei tee jokaista encounteria pitkäksi.**

Mukana pitää olla:

```text
Quick Fight
Normal Fight
Long Fight
Elite Fight
Boss Fight
```

Esimerkiksi Act V:ssa voidaan edelleen olla:

```text
Quick Encounter
```

joka voidaan voittaa nopeasti hyvällä counterilla.

---

# 43. COMBAT VARIETY

Myöhäisessä pelissä:

```text
30% Short
40% Normal
20% Long
10% Special
```

Suhteita säädetään testauksen perusteella.

---

# 44. REWARD SCALING

Pitkä ja vaikea taistelu tarjoaa parempia palkintoja.

```text
Difficulty ↑
Combat Length ↑
Risk ↑
Reward Quality ↑
```

Mutta reward ei ole täysin sidottu sekunteihin.

---

# 45. TIME VS REWARD

Pelaajaa ei saa kannustaa tahallaan pitämään taistelua pitkänä.

Siksi:

```text
Reward ≠ Combat Duration
```

Sen sijaan:

```text
Reward =
Encounter Difficulty
+
Risk
+
Story Progress
+
Encounter Type
```

---

# 46. DIFFICULTY ENGINE

Uusi pääjärjestelmä:

```text
StoryDifficultyEngine
```

Input:

```text
StoryAct
Biome
PlayerPower
EncounterType
BossType
DifficultyMode
WorldState
```

Output:

```text
EnemyPower
EnemyComplexity
CombatLengthTarget
AbilityComplexity
SynergyLevel
EnvironmentLevel
BossPhaseCount
```

---

# 47. DATA MODEL

```text
StoryDifficultyProfile {
  act
  biome

  baseEnemyPower
  hpMultiplier
  damageMultiplier
  defenseMultiplier

  aiLevel
  synergyLevel
  statusLevel
  environmentLevel

  combatDurationTarget
  bossPhaseCount

  escalationRate
  enrageTime
}
```

---

# 48. COMBAT PROFILE

```text
CombatDifficultyProfile {
  encounterType

  enemyCount
  enemyPower
  enemyComplexity

  abilityLevel
  synergyLevel
  statusLevel

  escalationEnabled
  escalationRate

  targetDuration
  maxDuration
}
```

---

# 49. DIFFICULTY GENERATION

```text
Story Progress
      ↓
Difficulty Profile
      ↓
Player Power
      ↓
Encounter Type
      ↓
Difficulty Budget
      ↓
Enemy Generation
      ↓
Combat Simulation
      ↓
Fairness Validation
      ↓
Combat
```

---

# 50. COMBAT SIMULATION

Koska Hearthwood käyttää deterministic combat -järjestelmää, encounter voidaan simuloida.

Testataan esimerkiksi:

```text
1000 simulations
```

Tulokset:

```text
Average Duration
Win Rate
Damage Taken
Death Cause
Phase Reached
Stall Rate
```

Jos:

```text
Average Duration = 240 sec
Target = 90 sec
```

encounter on liian pitkä.

---

# 51. BALANCE TARGET

Peli käyttää:

```text
TargetDuration
```

mutta ei pakota sitä.

Esimerkiksi:

```text
Target:
60 sec

Acceptable:
40–90 sec

Warning:
90–120 sec

Critical:
120+ sec
```

---

# 52. COMBAT LENGTH ANALYTICS

Seurataan:

```text
Encounter ID
Story Act
Biome
Enemy Composition
Player Build
Player Power
Combat Duration
Damage Taken
Winner
Death Cause
Phase
```

Näin voidaan löytää:

> “Mirefallin kaikki combatit kestävät 40 % liian kauan.”

---

# 53. PLAYER FEEDBACK

Taistelun jälkeen voidaan näyttää:

```text
COMBAT SUMMARY

Duration
01:14

Threat
High

Your Build
Strong Sustain
Low Burst

Enemy
Mirefall Decay

Key Moment
Healer silenced at 00:48
```

Myöhäinen peli opettaa pelaajaa ymmärtämään pitkiä taisteluita.

---

# 54. STORY-BASED UNLOCKS

Tarina voi avata uusia difficulty mechanics:

```text
Act II
Status system expands

Act III
Advanced synergy

Act IV
Environmental combat

Act V
Adaptive enemies
```

Näin järjestelmät eivät tule kerralla.

---

# 55. PLAYER LEARNING CURVE

```text
ACT I
Learn the rules.

ACT II
Combine the rules.

ACT III
Optimize the rules.

ACT IV
Adapt to the rules.

ACT V
Master the rules.
```

---

# 56. DIFFICULTY CURVE

Hearthwoodin kokonaiskäyrä:

```text
Difficulty

  │                              ████
  │                         █████
  │                    █████
  │               █████
  │          █████
  │      ████
  │   ███
  │ ██
  └──────────────────────────────
      Story Progress →
```

Kasvu on jatkuvaa mutta vaiheittaista.

---

# 57. STORY + COMBAT + MARKET

Kolme pääprogressiota yhdistyvät:

```text
STORY
 ↓
DIFFICULTY
 ↓
MARKET TIER
 ↓
STRONGER UNITS
 ↓
STRONGER SYNERGIES
 ↓
STRONGER BUILD
 ↓
HARDER COMBAT
```

Tämä muodostaa Hearthwoodin progression ytimen.

---

# 58. CORE BALANCE LOOP

```text
PLAYER PROGRESSES
        ↓
MARKET OPENS
        ↓
PLAYER GETS NEW OPTIONS
        ↓
ENEMIES GET HARDER
        ↓
PLAYER BUILDS BETTER
        ↓
COMBAT GETS LONGER
        ↓
PLAYER LEARNS
        ↓
STORY PROGRESSES
```

---

# 59. FINAL ACT DESIGN

Loppupelissä pelaajalla pitää olla tunne:

> “Minulla on nyt enemmän työkaluja kuin koskaan.”

Mutta myös:

> “Metsä vaatii minulta enemmän kuin koskaan.”

Tämä on oikea progression tunne.

---

# 60. ACCEPTANCE CRITERIA

Järjestelmä on valmis, kun:

* vaikeus kasvaa Story Actien mukana
* combat duration kasvaa keskimäärin tarinan mukana
* enemy stats kasvavat asteittain
* enemy complexity kasvaa
* enemy synergy kasvaa
* AI kehittyy
* bossien phase-määrä kasvaa
* environment muuttuu vaikeammaksi
* status interactions lisääntyvät
* pitkät taistelut eivät ole pelkkiä HP-sponges
* short encounters säilyvät myös endgamessa
* stall-buildit voidaan pysäyttää soft-enrageilla
* difficulty voidaan simuloida
* combat duration voidaan mitata
* pelaaja ymmärtää miksi myöhäiset taistelut ovat vaikeampia
* difficulty liittyy tarinan maailmaan
* Marketin ja unit progressionin kasvu pysyy tasapainossa vaikeuden kasvun kanssa.

---

# 61. NORTH STAR

Hearthwoodin vaikeuden pitää tuntua tältä:

```text
THE FOREST GETS DEEPER.
THE ENEMIES GET SMARTER.
THE BATTLES GET LONGER.
THE BUILDS GET DEEPER.
THE PLAYER GETS BETTER.
```

Ja lopullinen progression:

```text
EDGE
 ↓
LEARN
 ↓
DEEP WOODS
 ↓
BUILD
 ↓
ANCIENT GROVE
 ↓
ADAPT
 ↓
CORRUPTED WILD
 ↓
SURVIVE
 ↓
HEARTWOOD
 ↓
MASTER
```

> **The deeper you go, the longer the forest fights back.**
>
> Hearthwoodin vaikeus ei kasva siksi, että peli haluaa hidastaa pelaajaa.
>
> **Se kasvaa, koska tarina vie pelaajan kohti metsän sydäntä — paikkaan, jossa jokainen päätös alkaa merkitä enemmän.**
