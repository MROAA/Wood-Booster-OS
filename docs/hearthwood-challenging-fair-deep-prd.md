> **North-star design doc — the top-level design philosophy.** Marc pasted this
> in full on 2026-09-09. Every other Hearthwood PRD sits under it. The through-line:
> **easy to enter, hard to master, fair to lose, rewarding to understand** —
> depth (meaningful decisions with opportunity cost) over complexity (rules
> count); a staged depth ladder L1–L8; one-decision-at-a-time onboarding; no
> auto-win builds; fair RNG with soft pity + bad-luck protection; "enemy
> advantage from strategy, not cheating"; difficulty from situation-complexity
> and opponent decisions, not stat inflation; educational failure with a
> classified cause; HP / economy / information / risk as strategic resources;
> "simple surface, deep system" UI (basic vs advanced views); the Fairness
> Contract (the player must be able to understand what happened, why, and what
> they could have done); challenge modes + an Ascension that changes rules not
> HP; an anti-frustration list; and the 10-question **"Hearthwood Rule"** gate
> every new mechanic must pass. The battle outcome analysis shipped in PR #423
> (battleAnalysis.js) is the first direct slice of this doc (§10 Player Agency,
> §19 Educational Failure, §40 Fairness Contract). Related:
> docs/hearthwood-combat-system-v2-prd.md, docs/hearthwood-seed-playstyle-systems-prd.md.

---

# HEARTHWOOD — PRD

## Challenging, Fair & Strategically Deep Gameplay Experience

### Version

1.0

### Genre

Tactical Auto-Battler / Roguelite / Synergy Strategy

### Core Identity

> **Helppo aloittaa. Vaikea hallita. Reilu oppia. Syvä pelata.**

Hearthwoodin tavoitteena on luoda pelikokemus, jossa pelaaja voi aloittaa ensimmäisen pelinsä ymmärtämättä kaikkia järjestelmiä, mutta jossa sadan pelin jälkeenkin löytyy uusia strategisia oivalluksia.

Pelin vaikeus ei saa perustua sekavuuteen, epäselviin sääntöihin tai epäreiluun RNG:hen.

Sen sijaan vaikeus syntyy:

* päätösten seurauksista
* resurssien rajallisuudesta
* vastustajan mukautumisesta
* buildin rakentamisesta
* ajoituksesta
* sijoittelusta
* riskin hallinnasta
* vaihtoehtoiskustannuksista
* informaation hyödyntämisestä
* kyvystä vaihtaa strategiaa
* kyvystä tunnistaa oma buildin heikkous

---

# 1. EXPERIENCE VISION

Hearthwoodin pelaajan pitäisi tuntea:

### Ensimmäiset 5 minuuttia

> "Tämän ymmärtää."

### Ensimmäinen tunti

> "Tässä on enemmän syvyyttä kuin aluksi tajusin."

### Ensimmäiset 10 tuntia

> "Minun pitää oikeasti miettiä, mitä teen."

### 50+ tuntia

> "En vieläkään ole nähnyt kaikkea."

### Hyvä tappio

> "Nyt tiedän miksi hävisin."

### Hyvä voitto

> "Tämä onnistui, koska tein oikeat päätökset."

---

# 2. CORE DESIGN PRINCIPLE

Hearthwoodissa erotetaan kaksi asiaa:

## Complexity

Kuinka paljon järjestelmässä on sääntöjä.

## Depth

Kuinka paljon merkityksellisiä päätöksiä järjestelmä mahdollistaa.

Hearthwood ei tavoittele tarpeetonta complexityä.

Tavoitteena on korkea depth pienellä initial complexityllä.

### Formula

```text
LOW ENTRY COMPLEXITY
        +
HIGH DECISION DEPTH
        +
CLEAR FEEDBACK
        +
FAIR CONSEQUENCES
        =
HEARTHWOOD
```

---

# 3. EASY TO LEARN

Pelaajalle ei näytetä koko Hearthwoodia ensimmäisellä minuutilla.

Pelaaja oppii järjestelmät vaiheittain.

## Act I

Opetetaan:

* yksiköt
* roolit
* sijoittelu
* shop
* gold
* upgrade
* basic synergy
* auto-combat

## Act II

Avataan:

* enemy build AI
* counter-buildit
* advanced synergies
* status effects
* advanced positioning
* relicit
* risk/reward

## Act III

Avataan:

* environment
* advanced enemy adaptation
* complex events
* boss mechanics
* advanced economy
* rare build interactions

---

# 4. ONE DECISION AT A TIME

Pelaajalle ei koskaan anneta ensimmäisessä vaiheessa kymmentä uutta päätöstä yhtä aikaa.

Esimerkiksi:

### Ensimmäinen shop

Pelaaja näkee:

```text
3 UNITS
1 ITEM
10 GOLD
```

Peli kertoo vain:

> "Valitse yksikkö, joka auttaa joukkuettasi."

Myöhemmin peli opettaa:

* reroll
* saving
* interest
* shop tier
* economy timing
* unit combinations
* opportunity cost

---

# 5. THE DEPTH LADDER

Hearthwood käyttää kerroksittaista oppimista.

### Level 1 — SURVIVE

"Voita seuraava taistelu."

### Level 2 — BUILD

"Rakenna toimiva joukkue."

### Level 3 — SYNERGY

"Yhdistä yksiköt tehokkaasti."

### Level 4 — POSITION

"Sijoita oikein."

### Level 5 — ECONOMY

"Käytä resurssit oikeaan aikaan."

### Level 6 — COUNTER

"Reagoi vastustajaan."

### Level 7 — ADAPT

"Muuta buildia tilanteen mukaan."

### Level 8 — MASTER

"Optimoi koko runin."

Pelaaja voi siis pelata peliä eri syvyystasoilla.

---

# 6. STRATEGY, NOT SPEED

Hearthwood ei testaa ensisijaisesti pelaajan reaktionopeutta.

Pelaajan tärkeimmät työkalut ovat:

* suunnittelu
* analyysi
* ennakointi
* resurssien hallinta
* riskin arviointi
* buildin rakentaminen

Combat tapahtuu automaattisesti.

Pelaajan kysymys ei ole:

> "Mitä nappia painan nyt?"

vaan:

> "Miksi tämä joukkue häviää ja mitä minun pitäisi muuttaa?"

---

# 7. MEANINGFUL DECISIONS

Hyvä päätös on päätös, jolla on vaihtoehtoiskustannus.

Esimerkiksi:

```text
BUY UNIT
    ↓
less gold
    ↓
stronger combat
    ↓
less future economy
```

Tai:

```text
SAVE GOLD
    ↓
weaker now
    ↓
stronger economy later
```

Tai:

```text
BUY COUNTER ITEM
    ↓
less raw power
    ↓
better matchup
```

Pelaajan ei pitäisi kysyä:

> "Mikä vaihtoehto on parempi?"

Vaan:

> "Mikä vaihtoehto on parempi tässä tilanteessa?"

---

# 8. NO AUTO-WIN BUILDS

Hearthwoodissa ei saa olla buildia, joka voittaa automaattisesti riippumatta tilanteesta.

Jokaisella strategialla pitää olla:

* vahvuus
* heikkous
* counter
* counter-counter

Esimerkiksi:

### Poison

Vahva:

* pitkässä taistelussa
* tankkeja vastaan

Heikko:

* cleanse
* poison resistance

Counter:

```text
Poison → Cleanse
```

Mutta pelaaja voi vastata:

```text
Poison → Enemy Cleanse
→ Burst Damage
```

Tämä synnyttää strategisen ketjun.

---

# 9. ROCK-PAPER-SCISSORS WITHOUT SIMPLIFICATION

Hearthwood ei saa muuttua yksinkertaiseksi:

```text
Tank > Assassin
Assassin > Healer
Healer > Tank
```

Sen sijaan matchup muodostuu useasta muuttujasta:

```text
ROLE
+
POSITION
+
STATS
+
ITEMS
+
SYNERGY
+
STATUS
+
ABILITY
+
TIMING
+
ENEMY BUILD
```

Sama yksikkö voi siis voittaa eri tilanteessa ja hävitä toisessa.

---

# 10. PLAYER AGENCY

Häviön jälkeen pelaajan pitää pystyä tunnistamaan:

### Mitä tapahtui?

### Miksi se tapahtui?

### Mitä olisin voinut tehdä?

### Oliko vaihtoehtoinen ratkaisu?

Combat recap näyttää esimerkiksi:

```text
DEFEAT

Enemy Assassin eliminated your Healer.

Cause:
Backline exposure

Contributing factors:
- no protection
- low armor
- enemy Assassin synergy

Possible solutions:
- reposition Healer
- add Protector
- buy armor item
- add anti-Assassin unit
```

Pelin ei kuitenkaan pidä kertoa yhtä "oikeaa" ratkaisua.

Sen tulee näyttää vaihtoehdot.

---

# 11. FAIR RNG

RNG saa luoda epävarmuutta.

RNG ei saa päättää peliä yksin.

## RNG:n tehtävä

RNG tarjoaa:

* tilanteita
* mahdollisuuksia
* riskejä
* vaihtelua

## Pelaajan tehtävä

Pelaaja päättää:

* mitä mahdollisuutta käyttää
* mitä riskiä ottaa
* mitä rakentaa
* milloin pivottaa

---

# 12. BAD LUCK PROTECTION

Hearthwood sisältää soft pity -mekanismeja.

Jos pelaaja ei saa pitkään aikaan tietyn tyyppistä vaihtoehtoa, järjestelmä voi kasvattaa sen esiintymisen todennäköisyyttä.

Tavoite:

```text
RNG creates variety
NOT frustration
```

---

# 13. SEED FAIRNESS

Jokainen run käyttää seed-järjestelmää.

```text
SEED
+
GAME VERSION
+
RULESET VERSION
```

määrittävät runin rakenteen.

Sama seed mahdollistaa:

* replayn
* testauksen
* challenge-runin
* daily-runin
* leaderboardit
* buildien vertailun

Seed ei kuitenkaan tarkoita, että kaikki tapahtumat ovat ennalta määrättyjä.

Pelaajan valinnat muuttavat runin lopputulosta.

---

# 14. INFORMATION IS A RESOURCE

Pelaaja ei saa kaikkea tietoa heti.

Mutta peli ei myöskään saa piilottaa olennaista tietoa.

Pelaaja voi nähdä esimerkiksi:

* seuraavan vihollisen
* vihollisen tärkeimmän synergian
* bossin yleisen strategian
* tulevan biome-tyypin
* osan tulevista vaihtoehdoista

Mutta ei välttämättä kaikkea.

Tämä luo:

```text
KNOWN INFORMATION
+
UNCERTAINTY
=
STRATEGIC PLANNING
```

---

# 15. ENEMY AI

Act II:n jälkeen viholliset eivät enää ole vain stat-checkejä.

Ne rakentavat omia buildejaan.

Enemy AI:

```text
ANALYZE PLAYER
        ↓
IDENTIFY THREAT
        ↓
SELECT ARCHETYPE
        ↓
BUILD TEAM
        ↓
BUY UPGRADES
        ↓
POSITION
        ↓
COMBAT
        ↓
LEARN
        ↓
ADAPT
```

Vihollinen voi huomata esimerkiksi:

```text
PLAYER:
High Healing
High Armor
Low Backline Protection
```

ja rakentaa:

```text
ANTI-HEAL
+
ARMOR BREAK
+
ASSASSIN
```

---

# 16. ENEMY FAIRNESS

Enemy AI:n pitää käyttää samoja perussääntöjä kuin pelaaja.

Vihollinen ei saa voittaa vain siksi, että:

```text
+500% HP
+300% DAMAGE
```

ellei kyseessä ole tarkoituksellinen bossimekaniikka.

Pääsääntö:

> **Enemy advantage should come from strategy, not cheating.**

---

# 17. DIFFICULTY MODEL

Hearthwoodissa vaikeutta kasvatetaan ensisijaisesti:

1. tilanteiden monimutkaisuudella
2. vastustajan päätöksillä
3. resurssien niukkuudella
4. buildien välisillä tradeoffeilla
5. ympäristön vaikutuksilla

Ei pelkästään statseilla.

---

# 18. DIFFICULTY CURVE

## Early Game

Pelaaja:

* oppii
* kokeilee
* saa anteeksi virheitä

## Mid Game

Pelaaja:

* joutuu sitoutumaan buildiin
* kohtaa countereita
* tekee taloudellisia päätöksiä

## Late Game

Pelaaja:

* optimoi
* ennakoi
* mukautuu
* kohtaa vahvoja vihollisstrategioita

## Boss

Bossi testaa pelaajan runin kokonaisuutena.

---

# 19. FAILURE SHOULD BE EDUCATIONAL

Häviö ei saa tuntua:

> "Peli vain päätti, että häviän."

Sen pitää tuntua:

> "Tässä oli ongelma, jonka olisin voinut ratkaista."

Häviö voidaan luokitella:

```text
BUILD FAILURE
POSITION FAILURE
ECONOMY FAILURE
COUNTER FAILURE
SCALING FAILURE
RISK FAILURE
ADAPTATION FAILURE
```

---

# 20. COMEBACK MECHANICS

Hearthwood ei saa tehdä yhdestä huonosta päätöksestä automaattista kuolemaa.

Pelaajalle voidaan tarjota:

* risky comeback event
* powerful but temporary item
* alternate route
* emergency shop
* sacrifice mechanic
* high-risk reward
* recovery node

Mutta comeback ei saa olla ilmainen.

---

# 21. RISK SYSTEM

Risk on resurssi.

Pelaaja voi tietoisesti ottaa riskin:

```text
SAFE:
+small reward
+stable

RISKY:
+large reward
+possible penalty
```

Riskin pitäisi tuntua pelaajan valinnalta.

Ei satunnaiselta rangaistukselta.

---

# 22. HEALTH AS STRATEGIC RESOURCE

HP ei ole vain "elämää".

Pelaaja voi käyttää HP:tä strategisesti.

Esimerkiksi:

```text
LOSE FIGHT
→ lose 8 HP
→ keep gold
→ reach stronger shop
```

Pelaajan pitää voida joskus hyväksyä tappio.

Tämä tekee HP:stä resurssin.

---

# 23. ECONOMY AS STRATEGY

Goldilla on useita käyttötapoja:

```text
BUY
REROLL
UPGRADE
SAVE
INVEST
LOCK
RECOVER
```

Tämä tekee taloudesta strategisen järjestelmän.

Pelaaja joutuu jatkuvasti ratkaisemaan:

> "Vahvistanko itseäni nyt vai rakennanko tulevaa?"

---

# 24. UNIT PROGRESSION

Yksikkö ei ole vain:

```text
LEVEL 1
LEVEL 2
LEVEL 3
```

Vaan sillä voi olla kehityssuunta.

Esimerkiksi:

### Guardian

```text
Guardian
├── Fortress
│   └── Extreme Defense
│
├── Warden
│   └── Protection / Control
│
└── Vanguard
    └── Tank / Damage Hybrid
```

Sama yksikkö voi siis palvella eri buildeja.

---

# 25. BUILD IDENTITY

Buildin identiteetti syntyy vähitellen.

Ei:

> "Valitse Warrior class."

Vaan:

```text
Player choices
      ↓
Units
      ↓
Synergies
      ↓
Items
      ↓
Upgrades
      ↓
Position
      ↓
Playstyle
```

Lopulta pelaaja huomaa:

> "Tästä tulikin poison-control build."

---

# 26. PIVOT SYSTEM

Pelaaja saa vaihtaa strategiaa.

Mutta pivotilla on kustannus.

Esimerkiksi:

```text
CURRENT BUILD
Nature Poison

PIVOT
Fire Burst

COST:
- replace 2 units
- lose synergy
- spend gold
- temporary weakness
```

Tämä tekee strategian muuttamisesta päätöksen.

---

# 27. STRATEGIC PLAYSTYLE

Pelaajalle ei anneta pysyvää classia.

Playstyle syntyy valinnoista.

Pelin sisäinen analyysi voi tunnistaa:

```text
AGGRESSION
DEFENSE
CONTROL
ECONOMY
SYNERGY
RISK
ADAPTATION
SCALING
```

Pelaaja voi esimerkiksi aloittaa:

```text
Aggressive
```

ja muuttua:

```text
Adaptive Control
```

---

# 28. SYNERGY PHILOSOPHY

Synergy ei tarkoita vain:

> "3 Forest units = +10% damage."

Synergyjen pitäisi luoda käyttäytymistä.

Esimerkiksi:

```text
Forest
+
Poison
+
Healer
```

voi muodostaa:

> pitkäkestoisen attrition-buildin.

Kun taas:

```text
Forest
+
Summon
+
Buff
```

voi muodostaa:

> swarm-buildin.

---

# 29. POSITIONING

Sijoittelu on yksi Hearthwoodin tärkeimmistä strategisista järjestelmistä.

Frontline:

* tank
* bruiser
* protector

Midline:

* support
* control
* hybrid

Backline:

* healer
* artillery
* carry
* fragile DPS

Mutta tämä ei ole pakollinen kaava.

Poikkeavat sijoittelut voivat olla tehokkaita oikeassa buildissa.

---

# 30. TARGETING

Yksiköillä on target priority.

Esimerkiksi:

```text
Healer Hunter
→ Healer

Assassin
→ Backline

Executioner
→ Low HP

Tank
→ Highest Threat
```

Targeting voidaan kuitenkin muuttaa:

* itemeillä
* upgradeilla
* taidoilla
* statseilla
* synergioilla

---

# 31. COMBAT READABILITY

Combatin pitää näyttää:

```text
WHO
DID WHAT
TO WHOM
WHY
```

Pelaajan pitää pystyä seuraamaan:

* damage
* healing
* shields
* buffs
* debuffs
* deaths
* ability triggers
* status interactions

---

# 32. NO INFORMATION OVERLOAD

Combat UI ei saa näyttää kaikkea yhtä aikaa.

Pelaaja näkee ensin:

```text
IMPORTANT EVENTS
```

ja voi avata:

```text
ADVANCED COMBAT LOG
```

Näin aloittelija näkee yksinkertaisen version ja kokenut pelaaja saa yksityiskohtaisen analyysin.

---

# 33. ACCESSIBLE COMPLEXITY

Kaikki monimutkaisuus voidaan avata syvemmältä.

Esimerkiksi unit card:

### Basic view

```text
Guardian

Tank

Protects allies.
```

### Advanced view

```text
HP
Armor
Magic Resist
Threat
Attack Speed
Ability
Synergies
Status Resistances
Target Priority
Upgrade Path
```

Tämä on Hearthwoodin tärkeä UI-periaate:

> **Simple surface, deep system.**

---

# 34. DECISION QUALITY

Peli ei arvioi vain voittoa.

Se voi analysoida päätöksiä:

```text
ECONOMY
GOOD

POSITION
EXCELLENT

BUILD
STRONG

COUNTER RESPONSE
WEAK

RISK MANAGEMENT
GOOD
```

Tämä auttaa pelaajaa kehittymään.

---

# 35. NO SINGLE CORRECT STRATEGY

Hearthwoodin suunnittelussa pitää jatkuvasti kysyä:

> "Voiko pelaaja ratkaista tilanteen useammalla kuin yhdellä tavalla?"

Jos vastaus on ei, järjestelmä on liian lineaarinen.

Esimerkiksi bossia vastaan pitäisi olla mahdollista:

```text
BURST
CONTROL
SUSTAIN
POISON
SUMMON
DEFENSE
COUNTER-BUILD
```

kunhan build tukee kyseistä strategiaa.

---

# 36. MULTIPLE PATHS TO POWER

Voimaa voi saada:

```text
UNIT POWER
SYNERGY
POSITION
ITEM
RELIC
ECONOMY
UPGRADE
TACTICAL COUNTER
```

Näin heikompi yksikkö voi olla osa erittäin vahvaa strategiaa.

---

# 37. BOSS DESIGN

Bossin ei pitäisi olla vain:

```text
10000 HP
500 DAMAGE
```

Bossilla on oma strategia.

Esimerkiksi:

### The Root King

Pelaajan pitää käsitellä:

* summons
* healing
* environmental hazards
* scaling

Boss voidaan voittaa:

```text
BURST
OR
ANTI-SUMMON
OR
CONTROL
OR
SCALING
```

---

# 38. ENVIRONMENT

Biome vaikuttaa strategiaan.

Esimerkiksi:

## Autumnwood

Painotus:

* decay
* poison
* resource loss
* slow combat

## Frostroot

Painotus:

* control
* freeze
* defensive builds

## Sunspire

Painotus:

* burst
* speed
* aggressive builds

## Mirefall

Painotus:

* status
* corruption
* high risk/reward

---

# 39. DYNAMIC EVENTS

Eventit voivat muuttaa runin strategiaa.

Esimerkiksi:

```text
THE OLD TREE

Sacrifice:
10 HP

Reward:
Rare Relic

Alternative:
Leave

No reward
No risk
```

Tärkeää:

Pelaaja tietää riittävästi tehdäkseen päätöksen.

---

# 40. FAIRNESS CONTRACT

Hearthwoodin sisäinen suunnittelusääntö:

### Player must understand:

1. What happened.
2. Why it happened.
3. What they could have done.
4. What information was available.
5. What risk they accepted.

Jos pelaaja häviää tavalla, jota hän ei olisi voinut ymmärtää tai ennakoida, järjestelmää pitää tarkistaa.

---

# 41. PLAYER TRUST

Pelin pitää rakentaa pelaajan luottamus.

RNG saa yllättää.

AI saa yllättää.

Boss saa yllättää.

Mutta pelaajan pitää tuntea:

> "Peli pelasi sääntöjensä mukaan."

Tämä on Hearthwoodin tärkeimpiä ominaisuuksia.

---

# 42. MASTERING THE GAME

Mastery ei tarkoita kaikkien yksiköiden ulkoa muistamista.

Mastery tarkoittaa kykyä ajatella:

```text
What do I have?
What does the enemy have?
What do I need?
What can I sacrifice?
What can I afford?
What happens if I wait?
What happens if I pivot?
What is my biggest weakness?
What will the enemy do next?
```

---

# 43. RUN-TO-RUN LEARNING

Jokainen run opettaa jotain.

Runin lopussa:

```text
RUN SUMMARY

Build:
Poison Control

Strength:
Excellent sustain

Weakness:
Backline vulnerability

Key mistake:
Delayed counter to Assassin

Best decision:
Saved gold before Act III

New discovery:
Venom + Root interaction
```

---

# 44. META PROGRESSION

Pysyvä progression ei saa tehdä vanhasta pelaajasta automaattisesti vahvempaa.

Sen pitäisi ensisijaisesti avata:

* uusia yksiköitä
* uusia relickejä
* uusia biomeja
* uusia tapahtumia
* uusia strategioita
* uusia challengeja

Ei:

```text
Veteran:
+50% damage forever
```

vaan:

```text
Veteran:
more possibilities
```

---

# 45. CHALLENGE MODES

Kun pelaaja hallitsee peruspelin:

### Daily Seed

Kaikille sama run.

### Weekly Challenge

Erikoissäännöt.

### Ascension

Lisää vaikeutta muuttamalla sääntöjä.

### Ironwood

Pysyvä death.

### Mirror Run

Pelaaja ja AI käyttävät samaa lähtötilannetta.

### Draft Challenge

Rajoitettu unit pool.

---

# 46. ASCENSION SYSTEM

Vaikeutta voidaan kasvattaa muuttamalla järjestelmiä.

Esimerkiksi:

```text
A1
Enemies gain new tactics

A2
Shop becomes less predictable

A3
Healing reduced

A4
Boss gains new phase

A5
Enemy adapts faster

A6
Economy becomes harsher
```

Näin vaikeus muuttaa peliä eikä vain kasvata HP:tä.

---

# 47. ANTI-FRUSTATION DESIGN

Hearthwoodin pitää välttää:

* liian pitkät tutorialit
* näkymätön RNG
* pakotetut buildit
* täysin satunnaiset kuolemat
* epäselvät tooltipit
* piilotetut säännöt
* stat-only difficulty
* instant death ilman telegraphia
* pakotettu meta

---

# 48. THE THREE-LAYER EXPERIENCE

Hearthwoodissa on kolme samanaikaista peliä.

## Layer 1 — PLAY

Helppo:

> Osta yksikkö → rakenna joukkue → taistele.

## Layer 2 — STRATEGY

Syvempi:

> Economy → synergy → positioning → counters.

## Layer 3 — MASTERY

Erittäin syvä:

> Seed → probability → adaptation → enemy prediction → risk optimization.

Sama peli toimii siis sekä aloittelijalle että hardcore-strategiapelaajalle.

---

# 49. CORE GAMEPLAY EQUATION

Hearthwoodin lopullinen pelikokemus:

```text
EASY ENTRY
+
MEANINGFUL DECISIONS
+
FAIR RNG
+
CLEAR FEEDBACK
+
STRATEGIC DEPTH
+
ADAPTIVE ENEMY
+
MULTIPLE SOLUTIONS
+
PLAYER AGENCY
+
REPLAYABILITY
=
HEARTHWOOD
```

---

# 50. THE HEARTHWOOD RULE

Kaikkien uusien mekaniikkojen tulee läpäistä seuraavat kysymykset:

### 1.

Onko tämä helppo ymmärtää?

### 2.

Tarjoaako tämä merkityksellisen päätöksen?

### 3.

Onko päätöksellä tradeoff?

### 4.

Voiko pelaaja ymmärtää seurauksen?

### 5.

Onko olemassa useampi kuin yksi ratkaisu?

### 6.

Voiko vastustaja hyödyntää samaa järjestelmää?

### 7.

Voiko pelaaja vastata vastustajan ratkaisuun?

### 8.

Lisääkö tämä strategista syvyyttä vai vain sääntöjen määrää?

### 9.

Onko RNG pelaajan hallittavissa riittävästi?

### 10.

Tuntuuko häviö reilulta?

Jos uusi mekaniikka ei täytä näitä periaatteita, sitä ei lisätä sellaisenaan.

---

# 51. IMPLEMENTATION ARCHITECTURE

Järjestelmät tulee toteuttaa data-driven tavalla.

Core systems:

```text
GameState
RunState
SeedSystem
WorldSystem
MapSystem
EconomySystem
ShopSystem
UnitSystem
UpgradeSystem
ItemSystem
RelicSystem
SynergySystem
PositionSystem
CombatSystem
StatusSystem
TargetingSystem
EnemyBuildAI
EnemyTacticalAI
EventSystem
BossSystem
DifficultySystem
RewardSystem
AnalyticsSystem
RunReviewSystem
```

---

# 52. DETERMINISTIC SIMULATION

Combat voidaan simuloida deterministisesti.

```text
seed
+
game state
+
build
+
combat rules
=
combat result
```

Tämä mahdollistaa:

* bugien toiston
* combat replayn
* balance-testauksen
* AI-testauksen
* seed-testauksen
* regression-testauksen

---

# 53. BALANCE PHILOSOPHY

Balance ei tarkoita:

> "Kaikki yksiköt tekevät saman verran."

Balance tarkoittaa:

> "Eri vaihtoehdoilla on erilainen arvo eri tilanteissa."

Esimerkiksi:

```text
Unit A
Strong early

Unit B
Strong late

Unit C
Strong vs summons

Unit D
Strong economy

Unit E
Strong pivot
```

Kaikilla on paikka.

---

# 54. STRATEGIC VARIANCE

Hearthwoodin runit eivät saa olla vain:

```text
GOOD RUN
BAD RUN
```

Niiden pitäisi olla:

```text
Aggressive Run
Economic Run
Poison Run
Summon Run
Control Run
Tank Run
Hybrid Run
Risk Run
Adaptive Run
```

Pelaajan strategia tekee runista erilaisen.

---

# 55. FINAL PLAYER EXPERIENCE

Kun Hearthwood toimii oikein, pelaajan kokemus etenee:

```text
"I understand."

        ↓

"I can play."

        ↓

"I can build."

        ↓

"I understand synergies."

        ↓

"I understand why I lost."

        ↓

"I can counter the enemy."

        ↓

"I can adapt."

        ↓

"I can predict."

        ↓

"I can manipulate the run."

        ↓

"I understand the game."
```

Ja lopulta:

> **"I still don't know what the next run will become."**

Tämä on Hearthwoodin replayabilityn ydin.

---

# 56. FINAL DESIGN STATEMENT

Hearthwoodin tavoitteena ei ole tehdä peliä, joka on vaikea aloittaa.

Sen tavoitteena on tehdä peli, jonka **aloittaminen on helppoa mutta hyvän pelaamisen oppiminen kestää pitkään**.

Pelaajan tulee ymmärtää ensimmäisen pelin aikana:

> "Osta. Rakenna. Aseta. Taistele."

Mutta sadannen pelin jälkeen pelaaja pohtii:

> "Jos säästän nyt 10 goldia, voin nostaa economyani, mutta menetän seuraavan taistelun. Jos häviän, saan paremman event-reitin. Vastustaja näyttää rakentavan anti-heal-strategiaa, joten minun kannattaa ehkä vaihtaa poisonista burstiin. Mutta jos pivottaan nyt, menetän kaksi nykyistä synergyä. Ehkä otan riskin ja rakennan hybridin."

Tässä syntyy Hearthwoodin todellinen pelikokemus.

## CORE PHILOSOPHY

> **Simple rules.**
>
> **Deep interactions.**
>
> **Meaningful decisions.**
>
> **Fair consequences.**
>
> **Adaptive enemies.**
>
> **Readable combat.**
>
> **Emergent builds.**
>
> **Endless strategic mastery.**

### Hearthwood

**Easy to enter.
Hard to master.
Fair to lose.
Rewarding to understand.**
