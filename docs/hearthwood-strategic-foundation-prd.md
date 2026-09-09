> **Design constitution — governs every other Hearthwood system.** Marc
> pasted this in full on 2026-09-09, right after PR #429 (the seed
> engine) merged. Unlike the system PRDs it is not a build target: it is
> the rulebook the Economy / Shop / Unit / Role / Build / Synergy /
> Positioning / Combat / Status / Item / Relic / Reward / Seed / Map /
> Event / Biome / Enemy-AI / Boss / Difficulty / Progression / Meta /
> Run-Review / Tutorial / UX PRDs must each obey. Core theses: *simple
> rules create deep decisions*; every choice carries an opportunity
> cost; RNG creates situations, never verdicts; every strategy has a
> weakness and every weakness a possible answer (counters weaken, never
> delete); enemies play by legible rules and never hidden-cheat; combat
> is the test of a pre-battle plan, not the gameplay; a loss must be
> analysable after the fact (the Fairness Contract, §78–81); depth comes
> from system *interaction*, not feature count (§54–57, §94–96 — a new
> mechanic ships only if it touches ≥2 existing systems and creates a
> decision + a tradeoff + counterplay). The §113 "Strategic
> Constitution" (16 rules) and §114 master system map are the quick
> reference. Slice implementation one system per round, each behind the
> fairness gate; check new work against §96's 8-point system-quality
> test. Related: docs/hearthwood-challenging-fair-deep-prd.md (its
> nearest sibling), docs/hearthwood-economy-system-prd.md,
> docs/hearthwood-combat-system-v2-prd.md,
> docs/hearthwood-seed-playstyle-systems-prd.md,
> docs/hearthwood-unit-roles-build-system-prd.md,
> docs/hearthwood-adaptive-enemy-build-ai-prd.md,
> docs/hearthwood-strategic-upgrades-prd.md.

---

# HEARTHWOOD

## Comprehensive Strategic Foundation PRD

### "Easy to enter. Difficult to master. Fair to lose. Rewarding to understand."

**Version:** 1.0
**Status:** Master Design Foundation
**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy
**Core Experience:** Build → Decide → Adapt → Fight → Learn → Rebuild

---

# 1. PURPOSE OF THIS PRD

Tämä dokumentti määrittelee Hearthwoodin strategisen perustan.

Se ei ole yksittäisen järjestelmän PRD, vaan **pelin suunnittelukonstituutio**, jonka kaikkien muiden järjestelmien tulee noudattaa.

Tämän dokumentin alle kuuluvat:

* Economy System
* Shop System
* Unit System
* Role System
* Build System
* Synergy System
* Positioning System
* Combat System
* Status System
* Item System
* Relic System
* Reward System
* Seed System
* Map System
* Event System
* Biome System
* Enemy Build AI
* Enemy Tactical AI
* Boss System
* Difficulty System
* Progression System
* Meta System
* Run Review System
* Tutorial System
* UX / Information System

---

# 2. THE HEARTHWOOD PROMISE

Hearthwood lupaa pelaajalle kolme asiaa.

## 1. Helppo aloittaa

Pelaajan täytyy ymmärtää peruslooppi nopeasti:

```text
EXPLORE
↓
CHOOSE
↓
BUILD
↓
FIGHT
↓
REWARD
↓
ADAPT
```

## 2. Vaikea hallita

Kun pelaaja ymmärtää perusteet, peli avautuu:

```text
ECONOMY
+
POSITION
+
SYNERGY
+
COUNTERS
+
RISK
+
ADAPTATION
+
ENEMY PREDICTION
```

## 3. Reilu oppia

Pelaajan täytyy pystyä ymmärtämään:

```text
WHAT HAPPENED
+
WHY IT HAPPENED
+
WHAT I COULD HAVE DONE
```

---

# 3. NORTH STAR

Hearthwoodin tärkein suunnittelulause:

> **Simple rules create deep decisions.**

Pelin ei tule olla syvä siksi, että sääntöjä on satoja.

Sen tulee olla syvä siksi, että muutama perusjärjestelmä vaikuttaa toisiinsa monella tavalla.

---

# 4. STRATEGIC DEPTH MODEL

Hearthwoodin strateginen syvyys muodostuu seuraavista kerroksista:

```text
WORLD
 ↓
MAP
 ↓
ECONOMY
 ↓
SHOP
 ↓
BUILD
 ↓
SYNERGY
 ↓
POSITION
 ↓
COMBAT
 ↓
REWARD
 ↓
ADAPTATION
 ↓
NEXT DECISION
```

Yksittäinen järjestelmä ei saa olla täysin itsenäinen.

Järjestelmien tulee muodostaa verkosto.

---

# 5. THE CORE STRATEGIC LOOP

Jokainen run rakentuu tästä:

```text
1. RECEIVE INFORMATION
        ↓
2. EVALUATE SITUATION
        ↓
3. CHOOSE PRIORITY
        ↓
4. SPEND RESOURCES
        ↓
5. MODIFY BUILD
        ↓
6. POSITION TEAM
        ↓
7. AUTO COMBAT
        ↓
8. ANALYZE RESULT
        ↓
9. ADAPT
        ↓
10. REPEAT
```

Pelaajan varsinainen "gameplay" tapahtuu ennen taistelua.

Combat on pelaajan suunnitelman testi.

---

# 6. THE STRATEGIC QUESTION

Jokaisessa tärkeässä päätöksessä pitäisi olla kysymys:

> **"Mitä saan, jos teen tämän, ja mistä luovun?"**

Jos valinnalla ei ole todellista tradeoffia, se ei yleensä ole strateginen valinta.

---

# 7. OPPORTUNITY COST

Hearthwoodin strategian perustana on opportunity cost.

Esimerkiksi:

```text
BUY UNIT
→ +Power
→ -Gold

SAVE GOLD
→ +Future Economy
→ -Current Power

REROLL
→ +Chance
→ -Resources

UPGRADE SHOP
→ +Future Quality
→ -Immediate Resources

TAKE RISK
→ +Potential Reward
→ +Potential Loss
```

Pelaaja ei valitse vain hyvän ja huonon vaihtoehdon välillä.

Hän valitsee **kahden hyvän vaihtoehdon välillä eri tilanteissa**.

---

# 8. PLAYER AGENCY

Pelaajan täytyy voida vaikuttaa runin lopputulokseen.

Agency muodostuu:

* resurssien käytöstä
* shop-valinnoista
* unit-valinnoista
* sijoittelusta
* reitistä
* event-valinnoista
* riskistä
* buildin pivotoinnista
* vihollisen counteroinnista

RNG saa määrittää tilanteen.

RNG ei saa määrittää pelaajan strategiaa.

---

# 9. CONTROLLED RANDOMNESS

Hearthwood käyttää:

```text
RANDOMNESS
+
PLAYER AGENCY
```

ei:

```text
RANDOMNESS
=
OUTCOME
```

Hyvä RNG antaa pelaajalle uuden ongelman.

Huono RNG vie pelaajalta mahdollisuuden ratkaista ongelma.

---

# 10. THE THREE TYPES OF DECISIONS

Kaikki Hearthwoodin strategiset päätökset voidaan nähdä kolmena päätyyppinä.

## TEMPO

Miten vahva olen juuri nyt?

## VALUE

Miten saan resurssistani eniten hyötyä?

## FUTURE

Miten teen itsestäni vahvemman myöhemmin?

Näiden välinen tasapaino muodostaa economy-pelin ytimen.

---

# 11. SHORT-TERM VS LONG-TERM

Pelaaja joutuu jatkuvasti tasapainottamaan:

```text
NOW
vs
LATER
```

Esimerkiksi:

```text
Buy upgrade now
```

voi voittaa seuraavan combat-kierroksen.

Mutta:

```text
Save gold
```

voi mahdollistaa paljon suuremman power spiken myöhemmin.

Kumpikaan ei saa olla automaattisesti oikea.

---

# 12. STRATEGIC LAYERS

Hearthwoodissa on neljä päätöksenteon tasoa.

## LEVEL 1 — TACTICAL

Mitä teen juuri nyt?

* buy
* sell
* reroll
* reposition

## LEVEL 2 — BUILD

Mitä olen rakentamassa?

* roles
* synergies
* carries
* support
* items

## LEVEL 3 — STRATEGIC

Mihin suuntaan runini menee?

* economy
* risk
* scaling
* tempo
* adaptation

## LEVEL 4 — META

Miten ymmärrän Hearthwoodia paremmin?

* matchup knowledge
* probability
* enemy patterns
* biome knowledge
* build theory

---

# 13. BUILD IS A HYPOTHESIS

Pelaajan build ei ole valmis suunnitelma.

Se on hypoteesi.

Esimerkiksi:

> "Tämä poison-build pitäisi olla vahva pitkässä combatissa."

Combat testaa hypoteesin.

Jos se epäonnistuu:

```text
BUILD FAILED
↓
IDENTIFY WHY
↓
ADAPT
```

Näin peli opettaa pelaajaa.

---

# 14. BUILD IDENTITY

Build muodostuu:

```text
UNITS
+
ROLES
+
SYNERGIES
+
UPGRADES
+
ITEMS
+
RELICS
+
POSITION
+
ECONOMY
```

Ei yksittäisestä unitista.

---

# 15. NO FIXED CLASS

Pelaaja ei valitse:

```text
WARRIOR
MAGE
ROGUE
```

ja pysy siinä.

Pelaajan strateginen identiteetti syntyy runin aikana.

Esimerkiksi:

```text
EARLY:
Aggressive

MID:
Economy

LATE:
Poison Control
```

---

# 16. STRATEGIC ARCHETYPES

Hearthwood tukee ainakin seuraavia strategioita:

### Aggression

Voita nopeasti.

### Defense

Selviydy ja kuluta vastustaja.

### Control

Estä vihollista toimimasta tehokkaasti.

### Scaling

Rakenna hitaasti kasvava kone.

### Economy

Maksimoi tulevat resurssit.

### Synergy

Rakenna voimakkaita yhdistelmiä.

### Risk

Maksimoi korkean riskin palkinnot.

### Adaptation

Vaihda strategiaa tilanteen mukaan.

### Hybrid

Yhdistä useita strategioita.

---

# 17. NO PERFECT BUILD

Yksikään build ei saa olla universaalisti paras.

Jokaisella strategialla tulee olla:

```text
STRENGTH
WEAKNESS
COUNTER
COUNTER-COUNTER
```

Esimerkiksi:

```text
POISON
↓
ANTI-HEAL
↓
BURST
↓
DEFENSE
↓
CONTROL
```

Tämä synnyttää strategisen metapelin.

---

# 18. COUNTER SYSTEM

Counterit eivät saa olla absoluuttisia.

Ei:

```text
Poison = always loses to Cleanse
```

vaan:

```text
Cleanse
reduces Poison efficiency
```

Tämän jälkeen pelaaja voi muuttaa buildiaan.

---

# 19. COUNTER DEPTH

Hyvä counter:

```text
weakens strategy
```

Huono counter:

```text
deletes strategy
```

Hearthwoodin tavoite on ensimmäinen.

---

# 20. ROLE STRATEGY

Yksiköillä on selkeät roolit:

* Tank
* DPS
* Healer
* Support
* Control
* Debuffer
* Assassin
* Artillery
* Summoner
* Bruiser
* Economy
* Disruptor

Mutta unit voi sisältää useita rooleja.

Esimerkiksi:

```text
Guardian
= Tank + Support
```

tai:

```text
Venom Hunter
= DPS + Debuffer
```

---

# 21. ROLE TRADEOFFS

Jokaisella roolilla on kustannus.

### Tank

* survival

- low damage

### DPS

* damage

- fragile

### Healer

* sustain

- low direct threat

### Control

* disruption

- slower kill

### Economy

* future value

- current power

Näin tiimin rakentaminen on ongelmanratkaisua.

---

# 22. POSITIONING AS STRATEGY

Koska combat on automaattinen, sijoittelu on yksi tärkeimmistä pelaajan taktisen agency:n muodoista.

Pelaaja päättää:

* frontline
* midline
* backline
* spacing
* protection
* threat exposure
* target access

---

# 23. SAME BUILD, DIFFERENT POSITION

Sama build voi voittaa tai hävitä eri sijoittelulla.

Tämä on tärkeä strategisen syvyyden testi.

```text
GOOD BUILD
+
BAD POSITION
=
LOSS
```

ja:

```text
AVERAGE BUILD
+
EXCELLENT POSITION
=
WIN
```

---

# 24. ECONOMY AS STRATEGY

Economy ei ole tukijärjestelmä.

Se on yksi pelin ydinsysteemeistä.

Pelaaja päättää:

```text
BUY
SAVE
REROLL
UPGRADE
INVEST
RISK
```

Economy määrää, kuinka paljon vaihtoehtoja pelaajalla on.

---

# 25. RESOURCE PHILOSOPHY

Resurssit eivät saa olla vain numeroita.

Niiden pitää tarkoittaa:

```text
GOLD
= immediate opportunity

WOOD
= construction / development

ESSENCE
= rare strategic power

HP
= survival capital

INFORMATION
= future decision quality
```

---

# 26. HP AS RESOURCE

HP ei ole vain life bar.

Se on strateginen resurssi.

Pelaaja voi joskus hyväksyä:

```text
-HP
+
future advantage
```

Tämä mahdollistaa push-your-luck-strategiat.

---

# 27. INFORMATION AS RESOURCE

Tieto on resurssi.

Pelaaja voi esimerkiksi saada tietoa:

* seuraavasta vihollisesta
* bossista
* shop poolista
* eventistä
* biome-riskistä

Tieto auttaa tekemään parempia päätöksiä.

---

# 28. MAP STRATEGY

Map ei ole vain reitti.

Se on strateginen resource allocation -järjestelmä.

Pelaaja valitsee esimerkiksi:

```text
COMBAT
SHOP
ELITE
EVENT
TREASURE
REST
MYSTERY
CHALLENGE
BOSS
```

Jokainen vaihtoehto muuttaa tulevaa tilannetta.

---

# 29. ROUTE PLANNING

Pelaaja ei valitse vain seuraavaa nodea.

Hän suunnittelee:

```text
CURRENT NEED
+
FUTURE NEED
+
RISK
+
REWARD
```

Esimerkiksi:

> "Tarvitsen shopin nyt, mutta elite antaa paremman relicin ennen bossia."

---

# 30. WORLD STRATEGY

Biome vaikuttaa:

* unit pooliin
* enemy pooliin
* economyyn
* events
* status effects
* environment
* rewards
* bossiin

Maailma siis muuttaa strategista ongelmaa.

---

# 31. SEED SYSTEM

Seed määrittää runin mahdollisuuksien rakenteen.

```text
SEED
↓
WORLD
↓
MAP
↓
ENCOUNTERS
↓
REWARDS
↓
ECONOMY
↓
BOSS
```

Mutta pelaajan päätökset ratkaisevat lopputuloksen.

---

# 32. SEED FAIRNESS

Sama seed voidaan toistaa.

Tämä mahdollistaa:

* challenge-runit
* daily seeds
* testing
* replays
* balance analysis
* community challenges

Seed ei saa tarkoittaa:

> "Tässä runissa saat aina samat tavarat."

Sen tulee tarkoittaa:

> "Tässä runissa on sama lähtötilanne ja sama mahdollisuuksien rakenne."

---

# 33. ENEMY AS STRATEGIC PLAYER

Act II:n jälkeen vihollinen ei ole enää vain encounter.

Vihollinen on strateginen vastustaja.

Sen flow:

```text
OBSERVE
↓
ANALYZE
↓
BUILD
↓
POSITION
↓
FIGHT
↓
ADAPT
```

---

# 34. ENEMY ECONOMY

Enemy käyttää samaa taloudellista logiikkaa.

Se voi:

* säästää
* ostaa
* rerollata
* investoida
* pivottaa
* ottaa riskejä

Tämä tekee vihollisesta pelaajan kaltaisen strategisen agentin.

---

# 35. ENEMY PERSONALITY

Enemy AI ei saa aina optimoida täydellisesti.

Erilaiset viholliset voivat olla:

```text
Aggressive
Greedy
Defensive
Clever
Chaotic
Adaptive
Predictable
Risky
```

Tämä luo erilaisia strategisia kohtaamisia.

---

# 36. BOSS AS STRATEGIC TEST

Bossin tarkoitus ei ole testata vain numeroita.

Boss testaa:

```text
BUILD
+
ECONOMY
+
POSITION
+
COUNTER
+
ADAPTATION
```

Bossin pitää kysyä:

> "Oletko ymmärtänyt tämän Actin?"

---

# 37. COMBAT PHILOSOPHY

Combat on automaattinen.

Pelaaja ei kontrolloi yksiköitä reaaliajassa.

Mutta ennen combatia pelaaja kontrolloi:

* mitä yksiköitä käyttää
* missä ne ovat
* mitä ne käyttävät
* mitä synergioita aktivoidaan
* mitä vihollista vastaan rakennetaan

---

# 38. COMBAT AS FEEDBACK

Combat vastaa kysymykseen:

> **"Toimiko suunnitelmani?"**

Se ei saa olla vain spectacle.

---

# 39. COMBAT READABILITY

Pelaajan täytyy nähdä:

```text
WHO
DID WHAT
TO WHOM
WHY
```

Combat log mahdollistaa tarkemman analyysin.

---

# 40. DETERMINISTIC COMBAT

Combatin pitäisi olla deterministisesti toistettavissa:

```text
GAME STATE
+
BUILD
+
POSITION
+
COMBAT SEED
=
RESULT
```

Tämä mahdollistaa:

* replayt
* debugging
* balance testing
* AI simulation
* combat comparison

---

# 41. ADAPTATION LOOP

Pelaajan pitää pystyä muuttamaan strategiaansa.

```text
PLAN
↓
TEST
↓
FAIL / SUCCEED
↓
LEARN
↓
ADAPT
↓
RETEST
```

Tämä on Hearthwoodin mastery-loop.

---

# 42. PIVOTING

Pivot ei saa olla ilmaista.

Buildin muuttamiseen liittyy:

* gold cost
* lost synergies
* bench space
* opportunity cost
* temporary weakness

Mutta pivotin tulee olla mahdollista.

---

# 43. RISK

Risk on tietoinen päätös.

Risk:

```text
INCREASES POTENTIAL
+
INCREASES UNCERTAINTY
```

Hyvä risk:

> Pelaaja ymmärtää, mitä hän voi voittaa ja mitä hän voi menettää.

Huono risk:

> Pelaaja ei ymmärrä, mitä tapahtuu.

---

# 44. REWARD PHILOSOPHY

Palkinnon pitää vastata päätöksen laatua.

Palkintoja:

* units
* gold
* items
* relics
* information
* upgrades
* shortcuts
* new opportunities

Palkinto ei aina tarkoita enemmän damagea.

---

# 45. CHOICE REWARDS

Hyvä reward screen:

```text
CHOOSE ONE

A — +Gold
B — Rare Item
C — Information
```

Kaikki voivat olla hyviä eri tilanteissa.

---

# 46. FAILURE PHILOSOPHY

Häviö ei saa tarkoittaa:

> "RNG tappoi minut."

Sen pitäisi tuntua:

> "Minulla oli ongelma, enkä ratkaissut sitä."

---

# 47. DEFEAT ANALYSIS

Runin lopussa:

```text
BUILD:
Strong

ECONOMY:
Average

POSITION:
Weak

COUNTER:
Excellent

MAIN FAILURE:
Backline protection

BEST DECISION:
Early economy investment
```

Pelaaja saa oppia ilman, että peli pelaa seuraavaa runia hänen puolestaan.

---

# 48. COMEBACK DESIGN

Hearthwoodissa saa olla jäljessä.

Pelaajalla tulee olla mahdollisuus:

* ottaa riski
* vaihtaa buildia
* löytää synergian
* käyttää economyä
* käyttää HP:tä resurssina
* löytää vaihtoehtoinen reitti

Mutta comeback ei saa olla automaattinen.

---

# 49. DIFFICULTY

Vaikeus ei ensisijaisesti kasva:

```text
+500% HP
+500% DAMAGE
```

Sen sijaan:

```text
MORE COMPLEX DECISIONS
+
BETTER ENEMY AI
+
HARSHER TRADEOFFS
+
NEW MECHANICS
```

---

# 50. DIFFICULTY CURVE

## Act I

Learn.

## Act II

Adapt.

## Act III

Master.

## Late Game

Optimize.

## Boss

Prove understanding.

---

# 51. ACCESSIBLE COMPLEXITY

UI:n pitää tarjota kaksi tasoa.

### Simple

```text
Tank
Protects allies.
```

### Advanced

```text
Threat
Armor
Magic Resistance
Protection Radius
Target Priority
Ability Scaling
Synergies
Status Resistance
```

Näin sama järjestelmä toimii sekä aloittelijalle että ekspertille.

---

# 52. INFORMATION HIERARCHY

Pelaajalle näytetään ensin:

```text
WHAT
```

sitten:

```text
WHY
```

ja lopuksi:

```text
HOW
```

Esimerkiksi:

> Guardian died.

Klikkaamalla:

> Assassin targeted Guardian.

Lisätietona:

> Assassin prioritizes lowest-defense frontline target.

---

# 53. MASTERING INFORMATION

Hearthwoodissa hyvä pelaaja ei välttämättä saa enemmän voimaa.

Hän saa:

> **enemmän tietoa siitä, miten voimaa kannattaa käyttää.**

---

# 54. SYSTEMIC DESIGN

Uusi järjestelmä on hyvä, jos se vaikuttaa vähintään kahteen muuhun järjestelmään.

Esimerkiksi:

```text
POISON
→ Combat

POISON
→ Items

POISON
→ Enemy AI

POISON
→ Economy

POISON
→ Events

POISON
→ Boss
```

Yksi mekaniikka voi siis synnyttää useita strategioita.

---

# 55. EMERGENT GAMEPLAY

Hearthwoodin tavoite on:

```text
SIMPLE SYSTEMS
+
INTERACTIONS
=
EMERGENT STRATEGY
```

Esimerkiksi:

```text
Forest Unit
+
Poison
+
Healing
+
Low HP
+
Risk Event
+
Anti-Heal Enemy
```

voi synnyttää täysin uuden tilanteen, jota ei ole suunniteltu käsikirjoituksena.

---

# 56. SYSTEMIC COMBINATION RULE

Kun kaksi järjestelmää yhdistetään, niiden ei tarvitse aina luoda uutta erillistä sääntöä.

Parempi:

> olemassa olevat säännöt reagoivat toisiinsa.

Tämä pitää järjestelmän eleganttina.

---

# 57. STRATEGIC DENSITY

Hearthwoodin tavoitteena ei ole maksimoida:

```text
NUMBER OF MECHANICS
```

vaan:

```text
DECISIONS PER MECHANIC
```

Yksi hyvä Economy System voi tuottaa enemmän strategista syvyyttä kuin kymmenen irrallista minipeliä.

---

# 58. NO DOMINANT STRATEGY

Jos yksi strategia toimii kaikissa tilanteissa:

```text
META FAILURE
```

Jos mikään strategia ei toimi:

```text
PLAYER AGENCY FAILURE
```

Tavoite:

```text
MANY VIABLE STRATEGIES
+
CLEAR COUNTERS
+
SITUATIONAL VALUE
```

---

# 59. STRATEGIC BALANCE

Balance ei tarkoita:

> kaikki ovat yhtä vahvoja.

Se tarkoittaa:

> vaihtoehdot ovat eri tilanteissa arvokkaita.

Esimerkiksi:

```text
Unit A
Best early

Unit B
Best against summons

Unit C
Best late

Unit D
Best economy

Unit E
Best pivot
```

---

# 60. BUILD DIVERSITY

Build diversity syntyy:

```text
ROLE
+
UNIT
+
SYNERGY
+
ITEM
+
RELIC
+
POSITION
+
ECONOMY
```

Sama unit roster voi tuottaa useita erilaisia buildeja.

---

# 61. FLEXIBILITY

Jokaisessa buildissä tulisi olla ainakin yksi flex-paikka.

Flex-paikka mahdollistaa:

* counterin
* utilityn
* economy unitin
* temporary unitin
* pivotin

Tämä estää buildia lukkiutumasta liian aikaisin.

---

# 62. COMMITMENT

Liian vapaa build ei tunnu strategiselta.

Siksi buildin pitää muodostaa momentumia.

Kun pelaaja sijoittaa:

* goldia
* upgradeja
* itemeitä
* relickejä

strategiaan, vaihtamisesta tulee vaikeampaa.

Tämä luo merkityksellistä sitoutumista.

---

# 63. REVERSIBILITY

Päätökset luokitellaan:

### Reversible

Helppo muuttaa.

### Costly

Muutettavissa hinnalla.

### Permanent

Runin loppuun vaikuttava.

Hyvä Hearthwood tarvitsee kaikkia kolmea.

---

# 64. STRATEGIC MEMORY

Pelaajan tulee oppia:

* unit behavior
* synergies
* enemy archetypes
* biome effects
* event patterns
* economy breakpoints
* boss mechanics

Mutta peli ei saa vaatia kaiken muistamista ulkoa.

Codex ja UI tukevat oppimista.

---

# 65. PLAYER MASTERY

Mastery tapahtuu kolmessa vaiheessa:

### Knowledge

"Ymmärrän säännöt."

### Strategy

"Tiedän mitä kannattaa tehdä."

### Adaptation

"Tiedän mitä kannattaa tehdä, kun suunnitelma ei toimi."

Kolmas taso on Hearthwoodin todellinen mastery.

---

# 66. META-PROGRESSION

Pysyvä progression ei saa korvata pelaajan taitoa.

Meta avaa:

* sisältöä
* vaihtoehtoja
* uusia units
* uusia relics
* uusia biomeja
* uusia challengeja

Se ei saa antaa valtavaa pysyvää stat-etua.

---

# 67. RUN PROGRESSION

Runin sisäinen progression on tärkein.

```text
START
↓
BUILD
↓
POWER SPIKE
↓
SPECIALIZATION
↓
ADAPTATION
↓
MASTER BUILD
↓
BOSS
```

---

# 68. META VS MASTERY

Hearthwoodin pitää palkita:

```text
PLAYER KNOWLEDGE
```

enemmän kuin:

```text
TIME INVESTED
```

Vanha pelaaja on vahvempi, koska hän ymmärtää pelin paremmin.

Ei vain siksi, että hän on grindannut enemmän.

---

# 69. PLAYER STORIES

Hyvä run tuottaa tarinan.

Esimerkiksi:

> "Aloitin tank-buildillä."

> "Sain yhden poison-unitin."

> "Rakensin economyä."

> "Vihollinen alkoi counteroida poisonia."

> "Pivotoin controliin."

> "Menetin lähes kaiken HP:ni."

> "Sain risk-eventistä relicin."

> "Rakensin hybridin."

> "Voitin bossin."

Tämä on Hearthwoodin roguelite storytelling.

---

# 70. WORLD + STRATEGY

Hearthwoodin maailma ei ole pelkkä koriste.

Metsä vaikuttaa peliin.

Biomit:

* muuttavat economyä
* muuttavat unit poolia
* muuttavat vihollisia
* muuttavat tapahtumia
* muuttavat statusjärjestelmiä
* muuttavat boss-strategioita

---

# 71. LORE + MECHANICS

Lore ja gameplay pitää yhdistää.

Esimerkiksi:

### Frostroot

Lore:

> Metsä jäätyy ja säilyttää kaiken.

Gameplay:

* defensive scaling
* freeze
* preservation
* slower economy
* resource storage

Mekaniikka vahvistaa maailmaa.

---

# 72. PLAYER EXPRESSION

Pelaajan pitää pystyä sanomaan:

> "Tämä on minun buildini."

Ei:

> "Peli antoi minulle tämän buildin."

RNG tarjoaa materiaalin.

Pelaaja rakentaa siitä strategian.

---

# 73. STRATEGIC FREEDOM

Pelaajalle tarjotaan:

```text
OPTIONS
```

mutta ei:

```text
INFINITE OPTIONS
```

Liian suuri valinnan määrä aiheuttaa paralysisin.

Siksi shop tarjoaa rajatun määrän merkityksellisiä vaihtoehtoja.

---

# 74. THREE-OPTION PRINCIPLE

Kun mahdollista, tärkeissä päätöksissä tarjotaan:

```text
SAFE
BALANCED
RISKY
```

Esimerkiksi:

```text
SAFE
+5 Gold

BALANCED
Rare Item

RISKY
Mythic Relic
possible curse
```

Tämä tekee päätöksistä nopeasti ymmärrettäviä.

---

# 75. STRATEGIC CLARITY

Pelaajan pitää pystyä vastaamaan:

> "Mitä yritän tehdä?"

Jos pelaaja ei osaa vastata, buildin UI voi näyttää:

```text
CURRENT STRATEGY

Poison Control
68%

Strength:
Sustain

Weakness:
Burst Damage
```

Tämä auttaa pelaajaa hahmottamaan omaa buildiaan.

---

# 76. BUILD HEALTH

Peli voi analysoida buildia.

Esimerkiksi:

```text
DAMAGE       ████████░░
DEFENSE      ██████░░░░
SUSTAIN      ███████░░░
CONTROL      ███░░░░░░░
ECONOMY      █████░░░░░
ADAPTATION   ████████░░
```

Tämä ei anna "oikeaa vastausta".

Se antaa pelaajalle peilin.

---

# 77. STRATEGIC FEEDBACK

Feedbackin pitää olla:

### Immediate

Mitä tapahtui?

### Contextual

Miksi?

### Actionable

Mitä vaihtoehtoja minulla on?

Ei:

> "Build bad."

Vaan:

> "Your damage is sufficient, but your backline is exposed."

---

# 78. FAIRNESS CONTRACT

Hearthwood noudattaa tätä sääntöä:

> **Jos peli tappaa pelaajan, pelaajan pitää pystyä jälkikäteen ymmärtämään miksi.**

Ei kaikkia tulevia tapahtumia tarvitse paljastaa.

Mutta mennyt tapahtuma pitää olla analysoitavissa.

---

# 79. NO HIDDEN CHEATING

Enemy AI ei saa huijata ilman, että kyseessä on näkyvä erityissääntö.

Ei:

```text
Enemy secretly gets +500% damage.
```

Vaan:

```text
Boss Phase 3:
Root King gains Enraged state.
```

Pelaaja tietää säännön.

---

# 80. CHALLENGE SHOULD BE LEGIBLE

Vaikeus saa olla:

```text
"That was hard."
```

Ei:

```text
"What the hell happened?"
```

---

# 81. THE THREE FAIRNESS RULES

### RULE 1

Player understands the rules.

### RULE 2

Player has meaningful choices.

### RULE 3

Player can learn from consequences.

Jos yksi puuttuu, fairness kärsii.

---

# 82. ECONOMY + BUILD + COMBAT

Nämä kolme ovat Hearthwoodin ydinkolmio:

```text
          BUILD
         /     \
        /       \
 ECONOMY ------- COMBAT
```

Economy mahdollistaa buildin.

Build määrittää combatin.

Combat määrittää economy-tilanteen.

---

# 83. FULL STRATEGIC LOOP

```text
WORLD
 ↓
INFORMATION
 ↓
ROUTE
 ↓
ECONOMY
 ↓
SHOP
 ↓
BUILD
 ↓
SYNERGY
 ↓
POSITION
 ↓
COMBAT
 ↓
RESULT
 ↓
REWARD
 ↓
ADAPTATION
 ↓
NEW INFORMATION
 ↓
WORLD
```

Tämä on Hearthwoodin varsinainen pelikone.

---

# 84. THE PLAYER'S JOB

Pelaajan tehtävä ei ole:

> löytää yksi täydellinen build.

Pelaajan tehtävä on:

> **rakentaa toimiva ratkaisu kulloiseenkin tilanteeseen.**

---

# 85. THE ENEMY'S JOB

Enemy AI:n tehtävä ei ole:

> estää pelaajaa voittamasta.

Sen tehtävä on:

> **pakottaa pelaaja ajattelemaan uudelleen.**

---

# 86. THE RNG'S JOB

RNG:n tehtävä ei ole:

> ratkaista combat.

Sen tehtävä on:

> **luoda erilaisia ongelmia ja mahdollisuuksia.**

---

# 87. THE ECONOMY'S JOB

Economyn tehtävä ei ole:

> antaa pelaajalle rahaa.

Sen tehtävä on:

> **pakottaa pelaaja priorisoimaan.**

---

# 88. THE COMBAT'S JOB

Combatin tehtävä ei ole:

> olla pääasiallinen gameplay.

Sen tehtävä on:

> **paljastaa, toimiko pelaajan suunnitelma.**

---

# 89. THE SHOP'S JOB

Shopin tehtävä ei ole:

> näyttää satunnaisia tavaroita.

Sen tehtävä on:

> **esittää pelaajalle strategisia mahdollisuuksia.**

---

# 90. THE MAP'S JOB

Mapin tehtävä ei ole:

> olla etenemisruutu.

Sen tehtävä on:

> **antaa pelaajalle kontrollia riskin, resurssien ja tulevaisuuden yli.**

---

# 91. THE REWARD SYSTEM'S JOB

Rewardin tehtävä ei ole:

> antaa lisää tavaraa.

Sen tehtävä on:

> **muuttaa seuraavan päätöksen mahdollisuuksia.**

---

# 92. THE SEED'S JOB

Seedin tehtävä ei ole:

> määrätä runin lopputulosta.

Sen tehtävä on:

> **luoda ainutlaatuinen strateginen maisema.**

---

# 93. THE MASTER DESIGN EQUATION

Hearthwood voidaan tiivistää:

```text
SITUATION
+
CHOICE
+
TRADEOFF
+
CONSEQUENCE
+
FEEDBACK
+
ADAPTATION
=
STRATEGY
```

---

# 94. STRATEGIC DEPTH EQUATION

```text
DEPTH
=
INTERACTION
×
CHOICE
×
VARIETY
×
ADAPTATION
```

Ei:

```text
DEPTH
=
NUMBER OF FEATURES
```

---

# 95. COMPLEXITY BUDGET

Jokaisella uudella järjestelmällä on complexity budget.

Ennen uuden mekaniikan lisäämistä kysytään:

```text
Does it create:
✓ new decisions?
✓ new interactions?
✓ new counterplay?
✓ new build possibilities?
✓ new stories?
```

Jos ei:

> mekaniikkaa ei lisätä.

---

# 96. SYSTEM QUALITY TEST

Uusi mekaniikka hyväksytään vain, jos se:

### 1.

On ymmärrettävä.

### 2.

Tuottaa päätöksen.

### 3.

Tuottaa tradeoffin.

### 4.

Vaikuttaa muihin järjestelmiin.

### 5.

Mahdollistaa counterplayn.

### 6.

Ei riko fairnessia.

### 7.

Lisää replayabilityä.

### 8.

Sopii Hearthwoodin maailmaan.

---

# 97. ANTI-SNOWBALL DESIGN

Johtavan pelaajan ei saa olla mahdotonta pysäyttää.

Mutta comeback ei saa olla automaattinen.

Käytetään:

* risk/reward
* counter builds
* strategic routes
* resource tradeoffs
* boss pressure
* temporary advantages

Ei keinotekoista rubber bandingia.

---

# 98. ANTI-DEATH-SPIRAL

Häviöiden pitää heikentää pelaajaa.

Mutta ei tuhota kaikkia tulevia mahdollisuuksia.

Pelaajalle pitää jäädä:

```text
OPTION
+
RISK
+
POSSIBILITY
```

---

# 99. RUN PACING

Runin tulee sisältää:

```text
LEARNING
↓
BUILDING
↓
POWER SPIKE
↓
PRESSURE
↓
ADAPTATION
↓
CLIMAX
↓
BOSS
```

Jokainen Act muuttaa päätösten luonnetta.

---

# 100. ACT STRUCTURE

## ACT I — DISCOVERY

Pelaaja oppii:

* roles
* economy
* shop
* positioning
* basic synergies

## ACT II — ADAPTATION

Pelaaja kohtaa:

* enemy builds
* counters
* deeper economy
* advanced synergies

## ACT III — MASTERY

Pelaaja joutuu:

* optimoimaan
* ennakoimaan
* pivottaamaan
* hallitsemaan riskiä

## FINAL — TEST

Boss testaa koko strategisen mallin.

---

# 101. STRATEGIC VARIETY

Jokainen run ei saa olla vain:

```text
same path
different units
```

Sen pitää muuttaa:

* economy
* route
* enemies
* rewards
* biome
* build opportunities
* risks
* boss

---

# 102. RUN IDENTITY

Runin aikana peli muodostaa:

```text
WORLD
+
BUILD
+
ECONOMY
+
PLAYSTYLE
+
DECISIONS
```

ja näistä syntyy runin identiteetti.

Esimerkiksi:

> **"The Frozen Merchant"**

tai:

> **"The Poison Grove"**

tai:

> **"The One-HP Comeback"**

---

# 103. REPLAYABILITY

Replayability tulee:

```text
SEEDS
+
BUILDS
+
ENEMIES
+
ROUTES
+
EVENTS
+
ECONOMY
+
PLAYER DECISIONS
```

Ei pelkästään uusista kartoista.

---

# 104. MASTERY CURVE

Pelaajan kehitys:

```text
BEGINNER
"I buy strong units."

        ↓

INTERMEDIATE
"I build synergies."

        ↓

ADVANCED
"I manage economy."

        ↓

EXPERT
"I counter the enemy."

        ↓

MASTER
"I predict the enemy."

        ↓

GRANDMASTER
"I manipulate the entire run."
```

---

# 105. THE ENDGAME OF KNOWLEDGE

Hearthwoodin korkein taitotaso on kyky nähdä useita kierroksia eteenpäin.

Esimerkiksi:

```text
Current Shop
↓
Current Enemy
↓
Next Biome
↓
Future Economy
↓
Likely Counter
↓
Future Boss
↓
Required Pivot
```

Pelaaja ei enää reagoi vain tapahtumiin.

Hän valmistautuu niihin.

---

# 106. PLAYER VS SYSTEM

Hearthwoodin syvin vastustaja ei ole AI.

Se on:

> **epävarmuus.**

Pelaaja oppii hallitsemaan sitä.

---

# 107. PLAYER VS ENEMY

Enemy lisää toisen epävarmuuskerroksen:

> "Mitä vihollinen tekee?"

---

# 108. PLAYER VS SELF

Lopulta tärkein kysymys:

> "Luotanko omaan suunnitelmaani vai pitäisikö minun muuttaa sitä?"

Tämä synnyttää strategisen draaman.

---

# 109. STRATEGIC EMOTION

Hearthwoodin pitäisi tuottaa:

### Anticipation

"Jos tämä toimii..."

### Tension

"Jos käytän tämän goldin..."

### Discovery

"En tiennyt, että nämä toimivat yhdessä."

### Panic

"Vihollinen counteroi minut."

### Adaptation

"Vaihdetaan suunnitelmaa."

### Relief

"Selvisin."

### Mastery

"Minä tiesin, että tämä toimii."

---

# 110. THE IDEAL LOSS

Hyvä häviö:

```text
I understood the challenge.
I made a decision.
I took a risk.
It failed.
I learned something.
I want another run.
```

---

# 111. THE IDEAL WIN

Hyvä voitto:

```text
I understood the situation.
I built a plan.
I managed my resources.
I adapted.
The combat validated my decisions.
I feel responsible for the victory.
```

---

# 112. DESIGN NORTH STAR

Kaikkien Hearthwood-järjestelmien tulee pyrkiä tähän:

> **"The player should feel clever, not busy."**

Peli ei palkitse pelaajaa siitä, että tämä klikkaa paljon.

Peli palkitsee siitä, että tämä tekee hyviä päätöksiä.

---

# 113. HEARTHWOOD STRATEGIC CONSTITUTION

## RULE 01

Simple rules.

## RULE 02

Meaningful choices.

## RULE 03

Every choice has a cost.

## RULE 04

RNG creates situations, not verdicts.

## RULE 05

Every strategy has weaknesses.

## RULE 06

Every weakness has possible answers.

## RULE 07

Enemies play by understandable rules.

## RULE 08

Combat explains the result.

## RULE 09

Failure teaches.

## RULE 10

Success feels earned.

## RULE 11

Builds emerge from player decisions.

## RULE 12

Economy creates strategic tension.

## RULE 13

Positioning matters.

## RULE 14

Adaptation matters more than memorization.

## RULE 15

New mechanics must interact with existing systems.

## RULE 16

Depth must come from interaction, not clutter.

---

# 114. MASTER SYSTEM MAP

```text
                         HEARTHWOOD
                              │
                 ┌────────────┴────────────┐
                 │                         │
               WORLD                    PLAYER
                 │                         │
          ┌──────┼──────┐          ┌───────┼────────┐
          │      │      │          │       │        │
       BIOME    MAP    EVENTS    GOALS   CHOICES  STYLE
          │      │      │          │       │        │
          └──────┴──────┴──────────┴───────┴────────┘
                              │
                           ECONOMY
                              │
                           SHOP
                              │
                            BUILD
                              │
                ┌─────────────┼─────────────┐
                │             │             │
              UNITS        SYNERGY        ITEMS
                │             │             │
                └─────────────┼─────────────┘
                              │
                         POSITIONING
                              │
                           COMBAT
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 PLAYER              ENEMY
                    │                   │
                    └─────────┬─────────┘
                              │
                           RESULT
                              │
                           REWARD
                              │
                         ADAPTATION
                              │
                              └──────→ NEXT DECISION
```

---

# 115. FINAL GAMEPLAY FORMULA

Hearthwoodin lopullinen strateginen kaava:

```text
SEED
+
WORLD
+
INFORMATION
+
ECONOMY
+
BUILD
+
SYNERGY
+
POSITION
+
RISK
+
ENEMY
+
ADAPTATION
+
PLAYER MASTERY
=
RUN
```

Ja vielä tärkeämpi:

```text
SIMPLE SYSTEMS
×
DEEP INTERACTIONS
×
MEANINGFUL CHOICES
×
PLAYER AGENCY
=
HEARTHWOOD
```

---

# 116. FINAL VISION

Hearthwood ei ole peli, jossa pelaaja yrittää löytää yhden oikean vastauksen.

Se on peli, jossa pelaaja saa uuden strategisen ongelman jokaisessa runissa.

Peli sanoo:

> **"Tässä ovat resurssisi."**

> **"Tässä on vihollisesi."**

> **"Tässä ovat mahdollisuutesi."**

> **"Mitä aiot tehdä?"**

Pelaaja tekee päätöksen.

Peli reagoi.

Pelaaja oppii.

Pelaaja mukautuu.

Ja seuraava päätös syntyy.

---

# 117. THE HEARTHWOOD EXPERIENCE

Ensimmäisellä pelikerralla:

> **"Tämä on helppo ymmärtää."**

Viidennellä:

> **"Näissä on synergia."**

Kymmenennellä:

> **"Minun pitää hallita economyä."**

Kahdennellakymmenennellä:

> **"Vihollinen counteroi buildini."**

Viidennelläkymmenennellä:

> **"Näen jo mihin tämä run on menossa."**

Sadannella:

> **"Voin rakentaa lähes mitä tahansa, jos ymmärrän tilanteen."**

Ja juuri silloin Hearthwood on onnistunut.

---

# 118. HEARTHWOOD NORTH STAR

> **Easy to learn.**
>
> **Hard to master.**
>
> **Deep without being complicated.**
>
> **Random without being unfair.**
>
> **Challenging without being frustrating.**
>
> **Strategic without being exhausting.**
>
> **Rewarding because the player made the right decisions.**

## HEARTHWOOD

### **Build the forest.**

### **Read the enemy.**

### **Shape your strategy.**

### **Adapt or fall.**

### **Master the grove.**
