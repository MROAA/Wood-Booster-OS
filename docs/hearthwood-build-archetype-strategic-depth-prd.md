# Hearthwood — Build Archetype & Strategic Depth System (north-star PRD)

> **Status: north star, not a work order.** Marc pasted this v1.0 (61 §) on
> 2026-09-10, during the feat/hearthwood-collectors round (the 8th enemy
> archetype). It is logged here verbatim below the header, folded into that PR
> per the pasted-PRD precedent (`docs/hearthwood-progressive-story-difficulty-prd.md`,
> `docs/hearthwood-market-tier-progression-prd.md`, `docs/hearthwood-economy-system-prd.md`, …).

## Where it fits

This is the design umbrella over the **run-analysis layer that already ships**:

- `evaluateBuild(runState)` (`src/data/heartwood/buildScore.js`, PR #421) — the
  deployed squad's *shape* on 7 clamped 0-10 axes (Survivability / Damage /
  Sustain / Control / Synergy / Economy / Scaling) + a core unit + gap notes.
  **This PRD's §3 "expand the dimensions" (add Burst / Tempo / Mobility /
  Protection / Disruption / Consistency / Risk / Adaptation / Complexity) is a
  direct extension of this file.**
- `evaluatePlaystyle(runState)` (`playstyle.js`, PR #426/#427) — the *run's*
  6-axis behaviour profile + `runState.styleLog`.
- `evaluatePlayerPower(runState)` (`playerPower.js`, PR #436) — a *magnitude*
  read (`{ total, expected, ratio, band, components, lead, gap }`), Phase 1 of
  the DifficultyEngine.
- `evaluateMatchup` / `enemyThreatsFor` (`counterplay.js`, PR #428) + the
  `threatPreview.js` panel (PR #432) — the pre-fight threat read + covered/gap
  row. **This PRD's §30 "Counter Matrix" / §45 "Enemy AI Integration" build on
  this.**
- The **enemy archetype series** (#433 Swarm → #443 Cult → #… Collectors) is the
  enemy-side mirror of this PRD's §9-25 player archetypes; several names already
  match (Fortress / Swarm / Poison-Decay / Sacrifice ≈ Brood-Cult).

## The gap this names

Today a "build" is *tribe count + stats*. This PRD wants a build to be an
**identity with an engine, a win condition, a weakness, and a counter web** —
recognised dynamically (`BuildAnalyzer` → `BuildState`, §42-43), reacted to by
the Market / relics / enemy AI / events (§45-47), and surfaced to the player as
a strategy statement ("*Survive while decay destroys the enemy*", §31), not a
power score. The MVP (§56) is **6 archetypes** — Fortress / Berserker / Assassin
/ Control / Swarm / Economy — each with a profile + engine + win condition +
weakness + counters + tags + complexity + risk + scaling + adaptation.

The dedicated build-analyzer / archetype effort will work from THIS doc together
with `docs/hearthwood-progressive-challenge-prd.md` (#435) and
`docs/hearthwood-progressive-story-difficulty-prd.md` (#442) — the three form
the strategic-depth backlog. No slice of it is in the Collectors PR beyond this
log.

---

# HEARTHWOOD

## PRD — Build Archetype & Strategic Depth System

### Buildien strateginen syvyys

**Versio:** 1.0
**Status:** Design / Core System
**Prioriteetti:** High

---

# 1. Tavoite

Hearthwoodin build-järjestelmän tarkoituksena on tehdä jokaisesta buildistä **strateginen kokonaisuus**, ei vain joukko yksiköitä ja numeroita.

Pelaajan pitäisi pystyä ajattelemaan:

> “Miten tämä build voittaa?”

eikä vain:

> “Mitkä yksiköt ovat parhaat?”

Buildin tulee sisältää:

* vahvuus
* heikkous
* pelityyli
* win condition
* resurssitarve
* skaalaus
* synergiat
* vastustajan counterit
* pivot-mahdollisuudet
* muodostelma
* taistelun rytmi
* riskiprofiili

---

# 2. Core Principle

Hearthwoodin buildit perustuvat seuraavaan malliin:

```text
BUILD ARCHETYPE
        ↓
CORE STRATEGY
        ↓
UNITS
        ↓
SYNERGIES
        ↓
ITEMS
        ↓
FORMATION
        ↓
COMBAT PLAN
        ↓
WIN CONDITION
```

Build ei saa syntyä vain siitä, että pelaaja kerää saman triben yksiköitä.

Sen sijaan:

```text
Idea → Build → Synergy → Execution → Adaptation
```

---

# 3. Build Profile

Jokaiselle buildille annetaan strateginen profiili.

## Primary dimensions

Nykyiset:

```text
Survivability
Damage
Sustain
Control
Synergy
Economy
Scaling
```

Näitä laajennetaan.

## Uusi Build Profile

```text
Survivability
Damage
Sustain
Control
Burst
Tempo
Synergy
Economy
Scaling
Mobility
Protection
Disruption
Consistency
Risk
Adaptation
Complexity
```

Kaikkien buildien ei tarvitse olla vahvoja kaikissa dimensioissa.

---

# 4. Dimension merkitys

## Survivability

Kuinka hyvin build kestää vihollisen painetta.

Sisältää:

* HP
* armor
* resistance
* shields
* barriers
* damage reduction
* taunt
* protection
* defensive positioning

---

## Damage

Kuinka paljon build tuottaa vahinkoa.

Sisältää:

* direct damage
* AOE
* DoT
* crit
* execute
* ability damage
* reflected damage

---

## Sustain

Kuinka hyvin build palautuu taistelun aikana.

Sisältää:

* healing
* regeneration
* lifesteal
* shields
* revive
* damage prevention
* resource recovery

---

## Control

Kuinka paljon build kontrolloi vihollisen toimintaa.

Sisältää:

* stun
* root
* freeze
* silence
* slow
* interrupt
* displacement
* taunt
* attack-speed reduction

---

## Burst

Kuinka nopeasti build kykenee tuhoamaan tärkeän kohteen.

Esimerkiksi:

```text
Assassin
Crit build
Execute build
Ability burst
Mark → Burst
```

Burst erotetaan Damage-arvosta.

Build voi tehdä paljon kokonaisdamagea ilman burstia.

---

# 5. Tempo

Tempo kertoo kuinka nopeasti build saavuttaa taistelussa etunsa.

Esimerkiksi:

### High Tempo

```text
Fight start
↓
Immediate pressure
↓
Enemy loses unit
↓
Advantage snowballs
```

### Low Tempo

```text
Fight start
↓
Defend
↓
Build resources
↓
Scale
↓
Overtake enemy
```

Tämä mahdollistaa täysin erilaiset buildit.

---

# 6. Synergy

Synergy ei tarkoita vain “saman triben yksiköitä”.

Synergia voi perustua:

```text
Tribe
Role
Tag
Status
Position
Death
Economy
Items
Abilities
Timing
Resource
Environment
```

Esimerkiksi:

```text
Rootborn
+
Shield
+
Healing
+
Guardian
+
Low HP trigger
```

voi muodostaa kokonaan oman strategian.

---

# 7. Economy

Economy-build ei tarkoita vain enemmän kultaa.

Se voi muuttaa koko päätöksentekoa.

Esimerkiksi:

```text
Gold generation
Shop manipulation
Interest
Discounts
Temporary units
Market influence
Reroll efficiency
Investment
Delayed power
```

Economy-buildin strateginen kysymys:

> “Kuinka paljon voin investoida tulevaisuuteen ennen kuin kuolen?”

---

# 8. Scaling

Scaling määrittelee, miten build vahvistuu ajan kuluessa.

Tyypit:

### Combat Scaling

Vahvistuu taistelun aikana.

### Run Scaling

Vahvistuu runin edetessä.

### Economy Scaling

Vahvistuu kullan ja Marketin kautta.

### Synergy Scaling

Vahvistuu breakpointtien kautta.

### Item Scaling

Vahvistuu itemien määrän tai laadun kautta.

### Death Scaling

Vahvistuu yksiköiden kuollessa.

### Status Scaling

Vahvistuu stackien kasvaessa.

### Environmental Scaling

Hyödyntää biomea/terrainia.

---

# 9. Uudet Build Archetypes

Hearthwoodiin lisätään selkeä arkkityyppijärjestelmä.

## 9.1 FORTRESS

**Idea:** Selviydy, absorboi vahinko ja voita pitkällä aikavälillä.

```text
Survivability 10
Damage         4
Sustain        9
Control        2
Burst          1
Tempo          2
Synergy        7
Economy        1
Scaling        7
Protection     10
Disruption     3
Consistency    9
Risk           2
Adaptation     4
```

### Win condition

Vihollinen ei kykene tappamaan frontlinea.

Kun vihollisen damage loppuu:

```text
Defense → Sustain → Attrition → Victory
```

### Heikkoudet

* anti-heal
* armor penetration
* percent damage
* execute
* scaling enemy
* control chains

---

# 10. BERSERKER

**Idea:** Muuta aggression selviytymiseksi.

```text
Survivability 5
Damage         10
Sustain        5
Control        2
Burst          9
Tempo          10
Synergy        6
Economy        0
Scaling        5
Risk           9
```

Mekaniikka:

```text
Low HP
↓
More Damage
↓
More Crit
↓
More Lifesteal
↓
Kill
↓
Reset
```

### Win condition

Tapa vihollisia ennen kuin ne ehtivät rakentaa omaa strategiaansa.

### Heikkous

Jos ensimmäinen hyökkäys epäonnistuu, build romahtaa nopeasti.

---

# 11. CONTROL

**Idea:** Vihollinen ei saa pelata omaa peliään.

```text
Survivability 5
Damage         4
Sustain        6
Control        10
Burst          3
Tempo          5
Synergy        9
Economy        1
Scaling        7
Disruption     10
```

Työkalut:

* Freeze
* Stun
* Root
* Silence
* Slow
* Interrupt
* Threat manipulation

### Win condition

Vihollisen tärkeimmät yksiköt eivät saa käyttää kykyjään tehokkaasti.

### Counterit

* cleanse
* control resistance
* immunity
* burst

---

# 12. ASSASSIN

**Idea:** Poista tärkein vihollinen ennen kuin taistelu ehtii alkaa kunnolla.

```text
Survivability 2
Damage         9
Sustain        2
Control        4
Burst          10
Tempo          9
Synergy        7
Economy        1
Scaling        4
Mobility       10
Risk           8
```

Win condition:

```text
Identify Carry
↓
Mark
↓
Reach Backline
↓
Burst
↓
Reset
```

---

# 13. SWARM

**Idea:** Määrä muuttuu voimaksi.

```text
Survivability 4
Damage         7
Sustain        5
Control        3
Burst          3
Tempo          8
Synergy        10
Economy        5
Scaling        8
Risk           5
```

Perustuu:

* summons
* temporary units
* death triggers
* formation density
* tribe scaling

### Win condition

Yksittäinen yksikkö ei ole tärkeä.

Koko armeija on.

---

# 14. POISON / DECAY

**Idea:** Älä tapa vihollista nopeasti. Tee kuolemisesta väistämätöntä.

```text
Survivability 4
Damage         7
Sustain        6
Control        6
Burst          2
Tempo          2
Synergy        10
Scaling        10
Risk           4
```

Core:

```text
Poison
+
Decay
+
Spread
+
Amplification
```

### Win condition

Status-stack ylittää vihollisen sustainin.

---

# 15. SACRIFICE

**Idea:** Kuolema on resurssi.

```text
Survivability 3
Damage         8
Sustain        3
Control        4
Burst          8
Tempo          7
Synergy        10
Economy        3
Scaling        8
Risk           10
```

Esimerkiksi:

```text
Unit dies
↓
Deal damage
↓
Buff allies
↓
Summon replacement
↓
Trigger another death
```

Tämä luo Hearthwoodille erittäin oman build-identiteetin.

---

# 16. ECONOMY

**Idea:** Pelaaja uhraa nykyistä voimaa tulevan voiman vuoksi.

```text
Survivability 2
Damage         3
Sustain        3
Control        1
Burst          1
Tempo          1
Synergy        6
Economy        10
Scaling        10
Risk           9
Adaptation     10
```

Core loop:

```text
Save
↓
Invest
↓
Market Upgrade
↓
Better Units
↓
Better Synergy
↓
Power Spike
```

Tärkeä suunnitteluperiaate:

**Economy-buildin pitää olla heikko nyt mutta vaarallinen myöhemmin.**

---

# 17. RAMP / SCALING

**Idea:** Aloita keskinkertaisena ja muutu hirviöksi.

```text
Survivability 5
Damage         6
Sustain        6
Control        3
Burst          4
Tempo          2
Synergy        8
Economy        6
Scaling        10
Risk           7
```

Esimerkiksi:

```text
Every round
→ gain Growth
→ upgrade units
→ improve synergy
→ increase stats
```

Counter:

**Aggression / Tempo**

---

# 18. REFLECT / THORNS

**Idea:** Vihollisen hyökkäys muuttuu omaksi ongelmaksi.

```text
Survivability 8
Damage         7
Sustain        7
Control        2
Synergy        9
Scaling        7
Protection     9
```

Core:

```text
Enemy Attack
↓
Thorns
↓
Damage Reflection
↓
Debuff
↓
Counterattack
```

---

# 19. SHIELD / BARRIER

Eri asia kuin Fortress.

Fortress käyttää:

> HP + defense

Shield-build käyttää:

> Damage prevention + timing.

```text
Survivability 8
Damage         5
Sustain        8
Control        2
Synergy        9
Scaling        7
Protection     10
```

---

# 20. RADIANCE / PURIFICATION

**Idea:** Vastustajan debuffit muuttuvat omaksi voimaksi.

```text
Cleanse
+
Shield
+
Radiance
+
Anti-Corruption
```

Esimerkiksi:

```text
Remove Curse
→ gain Radiance
→ Shield allies
→ deal damage
```

Tämä tekee buildista erityisen vahvan tietyissä matchupeissa.

---

# 21. SUMMONER

Summoner eroaa Swarmista.

### Swarm

Määrä on strategia.

### Summoner

Yksi tai muutama yksikkö **hallinnoi summon-ekosysteemiä**.

```text
Summoner
↓
Create Minion
↓
Minion acts
↓
Minion dies
↓
Summoner gains value
```

---

# 22. ARTILLERY

**Idea:** Älä taistele frontlinea vastaan.

```text
Survivability 2
Damage         10
Burst          8
Control        5
Tempo          5
Synergy        5
Scaling        6
Mobility       1
Risk           8
```

Counter:

* Assassin
* Dive
* Disruption
* Silence

---

# 23. BRUISER

Hybridi:

```text
Damage
+
Survivability
+
Sustain
```

Ei paras missään yksittäisessä asiassa.

Mutta erittäin vaikea counteroida.

---

# 24. PIVOT BUILD

Tämä on erityisen tärkeä Hearthwoodissa.

Build ei aina tarvitse pysyä samana.

Esimerkiksi:

```text
Early:
Economy

↓
Market discovery

↓
Found rare Assassin

↓
Pivot

↓
Assassin + Control

↓
Late:
Burst Control
```

Pivot antaa pelaajalle mahdollisuuden käyttää huonoa alkupeliä informaationa.

---

# 25. HYBRID BUILDS

Hearthwoodin tärkein strateginen ominaisuus:

**Arkkityyppejä saa yhdistää.**

Esimerkiksi:

```text
Fortress + Poison
```

= pitkä taistelu + vihollisen asteittainen kuolema.

```text
Assassin + Economy
```

= heikko investointi + yksi valtava carry.

```text
Swarm + Sacrifice
```

= summonit kuolevat → kuolemat tuottavat arvoa.

```text
Shield + Radiance
```

= suoja → cleanse → damage.

```text
Control + Artillery
```

= vihollinen ei liiku → artillery ampuu turvallisesti.

---

# 26. Build Composition Model

Build koostuu viidestä kerroksesta.

```text
                    BUILD
                      │
          ┌───────────┴───────────┐
          │                       │
       IDENTITY                ENGINE
          │                       │
       Tribe                   Synergy
       Roles                   Status
       Tags                    Economy
          │                       │
          └───────────┬───────────┘
                      │
                  EXECUTION
                      │
              Formation
              Targeting
              Timing
                      │
                  PAYOFF
                      │
               Win Condition
```

---

# 27. Build Engine

Jokaisella vahvalla buildillä pitää olla **Engine**.

Engine tarkoittaa mekanismia, joka tuottaa jatkuvasti arvoa.

Esimerkkejä:

### Fortress Engine

```text
Damage Taken
→ Shields
→ Healing
→ Survive
```

### Poison Engine

```text
Poison
→ Spread
→ Amplify
→ Decay
```

### Sacrifice Engine

```text
Death
→ Trigger
→ Buff
→ Summon
→ Death
```

### Economy Engine

```text
Save
→ Interest
→ Market
→ Better Pool
→ Power Spike
```

### Assassin Engine

```text
Mark
→ Kill
→ Reset
→ New Target
```

---

# 28. Win Condition

Jokaisella buildillä tulee olla vähintään yksi selkeä win condition.

Esimerkiksi:

```text
FORTRESS
"Survive longer than opponent."

ASSASSIN
"Kill enemy carry."

POISON
"Outscale enemy sustain."

SWARM
"Overwhelm single-target damage."

CONTROL
"Prevent enemy execution."

ECONOMY
"Reach superior late-game pool."

SCALING
"Become stronger every round."
```

Pelaajan pitää pystyä näkemään tämä myös UI:ssa.

---

# 29. Build Weakness

Jokaisella buildillä pitää olla vähintään yksi selkeä heikkous.

Tämä on tärkeää tasapainolle.

```text
Strong Build
≠
No Weakness
```

Sen sijaan:

```text
Strong Identity
+
Clear Weakness
+
Counterplay
=
Healthy Strategy
```

---

# 30. Counter Matrix

Buildit eivät saa olla vain tier-lista.

Niiden pitää muodostaa matchup-verkosto.

Esimerkiksi:

```text
Fortress
    ↓
heikko → Poison
heikko → Anti-heal
vahva → Assassin

Assassin
    ↓
vahva → Artillery
heikko → Fortress
heikko → Protection

Swarm
    ↓
vahva → Single Target
heikko → AOE

Control
    ↓
vahva → Slow Build
heikko → Cleanse

Economy
    ↓
vahva → Late Game
heikko → Tempo
```

Tavoite ei ole rock-paper-scissors.

Tavoite on:

**soft counter network.**

---

# 31. Build Identity Score

Engine voi laskea buildin profiilin.

Esimerkiksi:

```text
Fortress Poison

Survivability 9
Damage         6
Sustain        9
Control        4
Burst          1
Tempo          2
Synergy        9
Economy        2
Scaling        9
Risk           3
Adaptation     5
```

UI voisi näyttää:

```text
FORTRESS / DECAY

█████████░ Survivability
██████░░░░ Damage
█████████░ Sustain
████░░░░░░ Control
█░░░░░░░░░ Burst

Strategy:
"Survive while decay destroys the enemy."
```

---

# 32. Build Tags

Build saa automaattiset strategiatagit.

Esimerkiksi:

```text
FORTRESS / POISON

Tags:
[Turtle]
[Long Fight]
[Decay]
[Scaling]
[Anti-Aggression]
```

Assassin:

```text
[High Risk]
[Backline]
[Burst]
[Carry Hunter]
[Tempo]
```

Economy:

```text
[Greed]
[Scaling]
[Investment]
[Late Game]
[High Risk]
```

Näitä tageja voidaan käyttää:

* tapahtumissa
* vihollis-AI:ssa
* relicien valinnassa
* Marketissa
* biomeissa
* bossien suunnittelussa
* World Reactivityssä.

---

# 33. Build Recognition

Hearthwoodin pitää tunnistaa pelaajan buildin suunta.

Esimerkiksi:

```text
Player owns:
4 Rootborn
3 Guardians
2 Shield units
2 Healing units
```

Engine tunnistaa:

```text
Likely Archetype:
FORTRESS
Confidence: 87%
```

Tämän jälkeen maailma voi reagoida.

Esimerkiksi:

```text
Enemy:
Anti-Heal Specialist

Event:
"Rot has noticed your healing."

Relic:
"Broken Heartwood Shield"
```

Tämä yhdistää Build Systemin World Reactivityyn.

---

# 34. Build Evolution

Build ei ole staattinen.

Se voi kehittyä:

```text
Foundation
↓
Emerging Archetype
↓
Established Build
↓
Hybrid
↓
Advanced Build
↓
Final Build
```

Esimerkiksi:

```text
Rootborn
↓
Fortress
↓
Fortress + Shield
↓
Shield + Radiance
↓
Radiant Fortress
```

---

# 35. Build Mutation

Relicit, events ja rare units voivat muuttaa buildin identiteettiä.

Esimerkiksi:

```text
Fortress
+
Relic:
"Pain feeds the forest."

→ Damage taken generates Energy.
```

Nyt pelaaja voi pivotata:

```text
Fortress
→ Damage Taken
→ Energy
→ Abilities
→ Damage
```

Build muuttuu:

**Fortress → Reactive Fortress**

---

# 36. Build Discovery

Pelaajan ei tarvitse tietää kaikkia buildeja etukäteen.

Järjestelmä voi antaa löytämisen tunteen.

```text
Units acquired
↓
Synergy activated
↓
New interaction discovered
↓
Build Archetype recognized
↓
Codex unlocked
```

Esimerkiksi:

> **NEW BUILD DISCOVERED**
>
> Thorn Fortress

Tämä tekee buildien kokeilusta palkitsevaa.

---

# 37. Build Complexity

Kaikki buildit eivät saa olla yhtä vaikeita pelata.

Lisätään:

```text
Complexity 1–10
```

Esimerkiksi:

| Build         | Complexity |
| ------------- | ---------: |
| Fortress      |          3 |
| Bruiser       |          3 |
| Swarm         |          5 |
| Assassin      |          6 |
| Control       |          7 |
| Poison        |          7 |
| Economy       |          8 |
| Sacrifice     |          9 |
| Hybrid builds |       8–10 |

Tämä mahdollistaa:

**Low floor, high ceiling.**

---

# 38. Build Risk

Lisätään:

```text
Risk 0–10
```

Risk voi tulla esimerkiksi:

* low HP
* delayed power
* narrow synergy
* expensive units
* positioning dependency
* timing dependency
* weak early game
* counter vulnerability

---

# 39. Build Consistency

Lisätään:

```text
Consistency 0–10
```

Korkea consistency:

> Build toimii useimmissa tilanteissa.

Matala:

> Build tarvitsee tietyn yksikön/relicin/synergian.

Tämä on tärkeä ero.

Esimerkiksi:

```text
Fortress
Consistency: 9

Sacrifice
Consistency: 4
```

Sacrifice voi olla paljon voimakkaampi täydellisenä buildinä, mutta vaikeampi rakentaa.

---

# 40. Build Adaptation

Lisätään:

```text
Adaptation 0–10
```

Kuinka helposti build voi vaihtaa strategiaa.

Esimerkiksi:

```text
Bruiser = 8
Fortress = 4
Assassin = 5
Economy = 10
```

Tämä antaa economy-buildille yhden todellisen vahvuuden:

**se voi ostaa aikaa ja vaihtoehtoja.**

---

# 41. Build Power ≠ Build Quality

Tärkeä suunnitteluperiaate:

```text
Build Power
```

ja

```text
Build Quality
```

ovat eri asioita.

Build voi olla:

```text
Power: 9
Consistency: 3
Risk: 10
```

eli erittäin voimakas mutta vaikea.

Toinen:

```text
Power: 7
Consistency: 9
Risk: 2
```

eli turvallinen mutta vähemmän räjähtävä.

Näin tier-lista ei yksin määritä peliä.

---

# 42. Build State

Runtime tarvitsee buildin nykytilan:

```text
BuildState {
  primaryArchetype
  secondaryArchetype[]
  dimensions
  activeSynergies[]
  coreUnits[]
  carryUnits[]
  engine
  winConditions[]
  weaknesses[]
  counters[]
  risk
  consistency
  adaptation
  complexity
  tempo
  scalingType[]
  buildTags[]
  confidence
}
```

---

# 43. Build Analyzer

Luodaan:

```text
BuildAnalyzer
```

Sen tehtävä:

```text
Units
+
Tribes
+
Roles
+
Tags
+
Synergies
+
Items
+
Relics
+
Formation
+
Economy
+
Combat Results
        ↓
BuildAnalyzer
        ↓
BuildState
```

Analyzer ei saa pakottaa buildiä tiettyyn arkkityyppiin.

Sen pitää arvioida todennäköisyys:

```text
Fortress 72%
Shield    61%
Radiance  38%
Control   21%
```

Näin hybridit ovat mahdollisia.

---

# 44. Build Recommendation Engine

Kun buildin suunta on havaittu:

```text
BuildAnalyzer
↓
BuildRecommendationEngine
```

Esimerkiksi:

```text
Current Build:

Fortress 72%
Shield 61%
Radiance 38%

Recommended:

+ Shield unit
+ Cleanse
+ Radiance relic

Avoid:

- pure DPS unit
- fragile Assassin
```

Tämä ei saa pelata peliä pelaajan puolesta.

Se antaa vain tietoa.

---

# 45. Enemy AI Integration

Enemy AI voi käyttää BuildStatea.

```text
PLAYER BUILD
      ↓
BuildAnalyzer
      ↓
Enemy AI
      ↓
Counter Selection
```

Esimerkiksi:

```text
Player:
Fortress + Healing

Enemy:
Anti-Heal Specialist
+
Armor Break
```

Mutta counterin pitää olla **pehmeä**, ei automaattinen voitto.

---

# 46. Market Integration

Market voi hyödyntää BuildStatea.

Jos pelaaja on:

```text
Fortress 80%
```

Market voi tarjota relevantteja vaihtoehtoja hieman useammin.

Mutta:

**relevance ≠ guarantee.**

Marketin pitää säilyttää epävarmuus ja discovery.

---

# 47. Relic Integration

Relicit voivat vahvistaa tai muuttaa arkkityyppiä.

Esimerkiksi:

```text
"The Last Bastion"

If ally survives below 20% HP:
gain Barrier.
```

Fortress-buildissä tämä on vahva.

Mutta se voi myös luoda uuden buildin:

```text
Low HP
+
Barrier
+
Berserker
```

→ **Desperation Build**

---

# 48. New Advanced Archetypes

Kun perusarkkityypit toimivat, voidaan lisätä:

### DESPERATION

Mitä lähempänä kuolemaa, sitä vahvempi build.

### MOMENTUM

Jokainen tappo kasvattaa seuraavan toiminnon voimaa.

### REACTIVE

Build vahvistuu vastustajan tekemistä asioista.

### MIRROR

Kopioi vihollisen ominaisuuksia.

### ADAPTIVE

Vaihtaa strategiaa taistelun aikana.

### TEMPO

Voittaa ensimmäisen 10–20 sekunnin aikana.

### ATTRITION

Voittaa hitaasti resurssien kulutuksella.

### COMBO

Rakentaa tapahtumaketjun.

### ONE-CARRY

Suurin osa buildistä tukee yhtä yksikköä.

### DUAL-CORE

Kaksi core-yksikköä rakentavat yhdessä engineä.

---

# 49. One-Carry vs Distributed Power

Tämä on tärkeä strateginen valinta.

## One-Carry

```text
8 support
+
1 monster carry
```

Vahvuus:

* valtava single target power

Heikkous:

* carryn kuolema voi tuhota koko buildin.

## Distributed

```text
3 strong damage dealers
+
balanced support
```

Vahvuus:

* resilient

Heikkous:

* vähemmän räjähtävä.

---

# 50. Build Architecture

Buildillä voi olla:

```text
CORE
│
├── Carry
├── Engine
├── Support
├── Frontline
├── Utility
└── Flex
```

Esimerkiksi:

```text
FORTRESS

Core:
Ironbark Guardian

Engine:
Shield generation

Support:
Healer

Utility:
Cleanse

Flex:
Control

Carry:
Thorn Vanguard
```

---

# 51. Flex Slot

Jokaisessa buildissä tulee olla mahdollisuus ainakin yhteen:

```text
FLEX SLOT
```

Sen tehtävä:

* counter
* tempo
* missing role
* biome adaptation
* boss adaptation
* economy
* pivot

Tämä estää buildiä muuttumasta liian deterministiseksi.

---

# 52. Build Decision Score

Jokaiselle tarjolla olevalle yksikölle voidaan laskea:

```text
Unit Value =
Base Value
+ Synergy Value
+ Archetype Value
+ Engine Value
+ Counter Value
+ Formation Value
+ Item Value
+ Scaling Value
- Opportunity Cost
```

Tärkeää:

**Raw Stats eivät yksin määritä arvoa.**

---

# 53. Build Depth Model

Hearthwoodin tavoite:

```text
LEVEL 1
"Minulla on hyviä yksiköitä."

LEVEL 2
"Minulla on Rootborn-build."

LEVEL 3
"Minulla on Fortress-build."

LEVEL 4
"Fortress käyttää Shield Engineä."

LEVEL 5
"Shield Engine ruokkii Radiance-synergiaa."

LEVEL 6
"Voin käyttää damage taken → energy -reliciä."

LEVEL 7
"Build muuttuu Reactive Fortressiksi."

LEVEL 8
"Vastustaja käyttää anti-healia, joten pivotaan
Shield/Radiance-rakenteeseen."

LEVEL 9
"Rakennan kokonaisuuden vihollisen counterin ympärille."
```

Tämä on Hearthwoodin strateginen syvyys.

---

# 54. Build Systemin tärkein sääntö

Älä tee:

```text
Fortress = +100% HP
```

Tee:

```text
Fortress =
survive
+
protect
+
sustain
+
control space
+
outlast
```

Älä tee:

```text
Assassin = +100% Damage
```

Tee:

```text
Assassin =
identify target
+
reach target
+
burst target
+
reset
```

Älä tee:

```text
Economy = +20% Gold
```

Tee:

```text
Economy =
sacrifice tempo
+
generate resources
+
invest
+
unlock stronger options
+
late-game power
```

---

# 55. Build Ecosystem

Lopullinen rakenne:

```text
                    HEARTHWOOD BUILD SYSTEM
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
   ARCHETYPES              ENGINES              IDENTITIES
       │                      │                      │
 Fortress                 Shield               Tribe
 Assassin                 Poison               Role
 Swarm                    Death                Tags
 Control                  Economy              Status
 Economy                  Combo                Position
 Scaling                  Summon               Items
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                         BUILD STATE
                              │
                 ┌────────────┼────────────┐
                 │            │            │
              STRENGTH     WEAKNESS      RISK
                 │            │            │
                 └────────────┼────────────┘
                              │
                        WIN CONDITION
                              │
                         COMBAT PLAN
                              │
                          ADAPTATION
                              │
                            VICTORY
```

---

# 56. MVP

Ensimmäisessä toteutuksessa ei tehdä kaikkia arkkityyppejä.

## Phase 1

6 pääarkkityyppiä:

1. Fortress
2. Berserker
3. Assassin
4. Control
5. Swarm
6. Economy

Jokaiselle:

* profile
* engine
* win condition
* weakness
* counters
* tags
* complexity
* risk
* scaling
* adaptation

---

# 57. Phase 2

Lisätään:

7. Poison
8. Sacrifice
9. Scaling
10. Shield
11. Artillery
12. Summoner

---

# 58. Phase 3

Lisätään:

* Hybrid builds
* Build Mutation
* Build Recognition
* Build Discovery
* Build Analyzer
* Enemy Build Analysis
* Build Recommendations
* Dynamic events
* Relic interactions
* World reactions

---

# 59. Phase 4

Advanced builds:

* Desperation
* Momentum
* Reactive
* Mirror
* Adaptive
* Tempo
* Attrition
* Combo
* One-Carry
* Dual-Core

---

# 60. Acceptance Criteria

Build System hyväksytään MVP:ksi kun:

* jokaisella buildillä on selkeä identiteetti
* jokaisella buildillä on win condition
* jokaisella buildillä on vähintään yksi selkeä weakness
* buildit voivat muodostaa hybridejä
* buildit eivät ole vain stat-bonuksia
* buildit voivat counteroida toisiaan
* jokaisella buildillä on vähintään yksi engine
* economy ja scaling ovat oikeita strategioita
* buildin voi tunnistaa dynaamisesti
* enemy AI voi tunnistaa pelaajan buildin
* Market voi reagoida buildiin
* Relicit voivat muuttaa buildin suuntaa
* pelaaja voi pivotata
* low-tier unit voi olla buildille arvokas
* korkea tier ei automaattisesti tarkoita parempaa buildiä
* yksi build ei dominoi kaikkia muita
* jokainen arkkityyppi tarjoaa erilaisen päätöksentekoprosessin

---

# 61. North Star

Hearthwoodin buildijärjestelmän ei pitäisi kysyä:

> **“Mikä on paras build?”**

Sen pitäisi kysyä:

> **“Minkä strategian haluat rakentaa?”**

Ja vielä tärkeämmin:

> **“Pystytkö tunnistamaan, milloin strategiasi ei enää toimi — ja muuttamaan sitä ajoissa?”**

Lopullinen tavoite:

```text
UNITS
   ↓
SYNERGIES
   ↓
ENGINE
   ↓
ARCHETYPE
   ↓
BUILD
   ↓
WIN CONDITION
   ↓
COUNTER
   ↓
ADAPTATION
   ↓
MASTERY
```

**Hearthwoodissa pelaaja ei kerää parhaita yksiköitä.
Pelaaja rakentaa idean, joka toimii.**
