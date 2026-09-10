> **North-star design doc — multi-round.** Marc pasted this in full on
> 2026-09-10, during the Brood enemy-archetype round (PR #440). It sits
> under the economy umbrella (`hearthwood-economy-system-prd.md`,
> `hearthwood-strategic-foundation-prd.md`) and the tiers PRD
> (`hearthwood-synergy-tribes-tiers-prd.md`), sharpening one part: the
> **Market as a progression system**, not just a shop. Core split:
> **Market Level** (how developed *this run's* market is — access
> progression) vs **Market Tier** (what *content* the market can offer —
> power / complexity), each Tier unlock gated behind a Gold investment
> and adding new units / archetypes / synergies / item types / economic
> options / mechanics rather than flat +X% stats. 7 named Tiers
> (Clearing → Woodland → Grove → Ancient → Mythic → Elder → Worldroot),
> a Tier-Unlock rule + escalating upgrade cost as a headline money sink,
> a money-sink hierarchy (Immediate / Short-term / Long-term), per-Tier
> content pools (unit / synergy / item / relic), Tier ≠ Rarity, market
> rotation + biome + player influence (tribe / role influence as a paid
> steer), Golden / Ancient / Corrupted / Spirit market events, gold
> storage with a capped interest, comeback economy, "no free power
> spike" on a Tier unlock (options, not stats), a Next-Tier preview in
> the market UI, data models (Market / MarketTier / MoneySink), three
> new managers (EconomyManager / MarketManager / ContentUnlockManager),
> a dedicated deterministic **Market RNG** stream (or reuse Shop RNG),
> 8 balance principles, a 6-phase roadmap + an MVP (Tiers 1-3 + Buy /
> Reroll / Lock / Level / Market Upgrade + Next-Tier preview +
> tier-based unit pools + synergy-unlock hooks). **Status: north star,
> not a work order** — much already ships (Market Level, `levelUpMarket`,
> `MARKET_LEVEL_UNLOCKS`, reroll-cost escalation, `bankInterest`, the
> Ledger, the Legendary tier, per-Act merchant). What's new here is the
> Level/Tier split, Tier content pools, the Next-Tier preview, influence,
> and market events.

---

# HEARTHWOOD

## PRD — Market, Money Sinks & Tier Progression

**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy
**Core System:** Market Progression + Economy Sinks + Unit/Synergy Tier Unlocks
**Status:** Core Economy System
**Version:** 1.0

---

# 1. VISION

Hearthwoodin Market on yksi pelin tärkeimmistä strategisista järjestelmistä.

Market ei ole pelkkä paikka, josta ostetaan yksiköitä.

Se on:

```text
MARKET
=
POWER ACCESS
+
BUILD DISCOVERY
+
SYNERGY ACCESS
+
ECONOMIC DECISION
+
PROGRESSION
+
RISK
```

Pelaaja käyttää rahaa päättääkseen:

> **Ostanko nyt voimaa vai investoinko tulevaisuuden buildiin?**

---

# 2. CORE LOOP

Marketin perusloop:

```text
EARN GOLD
   ↓
SAVE / SPEND
   ↓
UPGRADE MARKET
   ↓
UNLOCK NEW TIER
   ↓
ACCESS NEW UNITS
   ↓
ACCESS NEW SYNERGIES
   ↓
BUILD STRONGER STRATEGIES
   ↓
SPEND MORE GOLD
   ↓
ADAPT
```

---

# 3. MARKET TIER

Marketilla on oma progression.

Esimerkiksi:

```text
TIER 1 — Clearing
TIER 2 — Woodland Market
TIER 3 — Grove Market
TIER 4 — Ancient Market
TIER 5 — Mythic Market
TIER 6 — Elder Market
TIER 7 — Worldroot Market
```

Lopullinen tierimäärä voidaan kasvattaa myöhemmin.

Tärkeä periaate:

> **Market Tier ei tarkoita vain parempia unitteja. Se avaa uusia strategisia mahdollisuuksia.**

---

# 4. TIER PHILOSOPHY

Jokainen uusi Market Tier lisää ainakin yhtä seuraavista:

```text
NEW UNITS
NEW UNIT ARCHETYPES
NEW SYNERGIES
NEW ITEM TYPES
NEW BUILD OPTIONS
NEW ECONOMIC OPTIONS
NEW MECHANICS
```

Ei:

```text
Tier 2:
+20% stronger units

Tier 3:
+20% stronger units

Tier 4:
+20% stronger units
```

---

# 5. MARKET TIER PROGRESSION

## TIER 1 — CLEARING

Pelin lähtötaso.

Saatavilla:

* basic units
* basic roles
* basic tribes
* basic items
* simple synergies

Tavoite:

> Opeta pelaajalle Hearthwoodin perusrakenne.

Esimerkiksi:

```text
Tank
DPS
Healer
Support
```

---

# 6. TIER 2 — WOODLAND MARKET

Avautuu Market Upgrade 1:n jälkeen.

Uusia asioita:

* specialized units
* ensimmäiset specialist-roolit
* vahvemmat synergy-hookit
* ensimmäiset build-defining unitit
* hieman paremmat itemit

Esimerkiksi:

```text
Tank
→ Guardian

DPS
→ Assassin

Support
→ Buffer
```

---

# 7. TIER 3 — GROVE MARKET

Market alkaa tarjota selvästi buildiä määrittäviä vaihtoehtoja.

Avautuu:

* Rare units
* advanced role combinations
* advanced tribe synergies
* status-focused units
* economy units
* ensimmäiset transformative mechanics

Esimerkiksi:

```text
Rootborn + Guardian
Mosskin + Economy
Wildclaw + Assassin
Mycelian + Poison
```

---

# 8. TIER 4 — ANCIENT MARKET

Tässä vaiheessa pelaaja alkaa rakentaa erittäin spesifejä strategioita.

Avautuu:

* Epic units
* advanced synergy units
* hybrid units
* powerful support units
* specialist counters
* advanced items
* stronger relic access

Esimerkiksi:

```text
Tank + Healer
Poison + Death
Summon + Sacrifice
Shield + Radiance
Freeze + Control
```

---

# 9. TIER 5 — MYTHIC MARKET

Market voi tarjota buildin keskipisteeksi tarkoitettuja yksiköitä.

Avautuu:

* Mythic units
* transformative units
* rare synergy pieces
* unique build enablers
* high-impact items
* advanced relics

Näitä ei pitäisi voida käyttää yksinään tehokkaasti.

Niiden tarkoitus:

```text
MYTHIC UNIT
     ↓
NEW BUILD POSSIBILITY
     ↓
NEW SYNERGY
     ↓
NEW PLAYSTYLE
```

---

# 10. TIER 6 — ELDER MARKET

Endgame-taso.

Avautuu:

* ancient units
* legendary synergy pieces
* extreme specialization
* unusual hybrid builds
* powerful strategic mechanics

Tämä tier voi sisältää erittäin harvinaisia vaihtoehtoja.

---

# 11. TIER 7 — WORLDROOT MARKET

Mahdollinen tuleva endgame-tier.

Tarkoitettu:

* mastery
* high Ascension
* special runs
* legendary builds
* secret synergies
* endgame discoveries.

Tämä tier ei ole välttämättä osa ensimmäistä versiota.

---

# 12. MARKET UPGRADE

Market voidaan jo päivittää.

Tämä PRD laajentaa nykyisen järjestelmän niin, että:

```text
MARKET LEVEL
```

ja

```text
MARKET TIER
```

ovat selkeästi erotettuja.

---

# 13. MARKET LEVEL VS MARKET TIER

### Market Level

Kuinka kehittynyt Market on kyseisessä runissa.

```text
Level 1
Level 2
Level 3
...
```

### Market Tier

Mitä sisältöä Market voi tarjota.

```text
Tier 1
Tier 2
Tier 3
...
```

Yksinkertaistettuna:

```text
LEVEL
=
ACCESS PROGRESSION

TIER
=
CONTENT POWER / COMPLEXITY
```

---

# 14. TIER UNLOCK RULE

Tierin avaaminen vaatii investoinnin.

Esimerkiksi:

```text
Tier 1
FREE

Tier 2
Market Upgrade

Tier 3
Market Upgrade

Tier 4
Market Upgrade

Tier 5
Market Upgrade

Tier 6
Special Requirement

Tier 7
Endgame Requirement
```

Tarkat kustannukset balansoidaan myöhemmin.

---

# 15. MARKET UPGRADE COST

Upgrade maksaa Goldia.

Esimerkiksi:

```text
Tier 1 → 2
100 Gold

Tier 2 → 3
250 Gold

Tier 3 → 4
450 Gold

Tier 4 → 5
700 Gold
```

Nämä ovat placeholder-arvoja.

Kustannuksen pitää luoda päätös:

```text
UPGRADE NOW
vs
BUY UNITS NOW
vs
SAVE
vs
REROLL
```

---

# 16. MARKET UPGRADE AS MONEY SINK

Market Upgrade on yksi tärkeimmistä money sinkeistä.

Pelaajalla voi olla:

```text
100 Gold
```

ja vaihtoehdot:

```text
BUY
REROLL
LOCK
LEVEL
UPGRADE MARKET
```

Näin raha ei automaattisesti muutu unit poweriksi.

---

# 17. MONEY SINK PHILOSOPHY

Hearthwood tarvitsee useita erilaisia money sinkejä.

```text
GOLD
 ↓
 ├── Buy Units
 ├── Reroll
 ├── Level Up
 ├── Market Upgrade
 ├── Lock
 ├── Draft
 ├── Item Purchase
 ├── Relic Purchase
 ├── Shop Manipulation
 └── Special Events
```

Jokaisen sinkin pitää kilpailla samasta resurssista.

---

# 18. PRIMARY MONEY SINKS

## 1. UNIT PURCHASE

Perusmeno.

```text
Gold → Unit
```

---

## 2. REROLL

```text
Gold → Information + Opportunity
```

Reroll ei takaa parempaa tulosta.

---

## 3. MARKET UPGRADE

```text
Gold → Future Power
```

Tämä on investointi.

---

## 4. LEVEL UP

```text
Gold → Board Capacity / Progression
```

---

## 5. LOCK

```text
Gold / Opportunity Cost
→ Preserve Shop
```

---

# 19. SECONDARY MONEY SINKS

Myöhemmin:

```text
Item Crafting
Relic Purchase
Market Influence
Tribe Influence
Role Influence
Special Reroll
Golden Shop
Draft
Event Investment
Temporary Mercenary
```

---

# 20. MONEY SINK HIERARCHY

Money sinkit jaetaan kolmeen luokkaan.

### Immediate

Antaa voimaa heti.

```text
Buy
Reroll
Item
```

### Short-term

Antaa voimaa lähiaikoina.

```text
Lock
Draft
Market Influence
```

### Long-term

Antaa tulevaa potentiaalia.

```text
Market Upgrade
Level
Special Unlock
```

---

# 21. GOLD DECISION MATRIX

Pelaaja tekee jatkuvasti:

```text
MORE POWER NOW
        VS
MORE POWER LATER
```

Esimerkiksi:

```text
Buy 2★ unit
```

tai:

```text
Save Gold
→ Market Tier
→ Rare Unit Access
```

---

# 22. MARKET CONTENT POOLS

Jokaisella Tierillä on oma content pool.

```text
MarketTier
    ↓
UnitPool
    ↓
SynergyPool
    ↓
ItemPool
    ↓
RelicPool
```

---

# 23. UNIT POOL

Esimerkiksi:

```text
Tier 1:
Common

Tier 2:
Common + Uncommon

Tier 3:
Uncommon + Rare

Tier 4:
Rare + Epic

Tier 5:
Epic + Mythic

Tier 6:
Mythic + Ancient

Tier 7:
Legendary / Secret
```

Tier ei kuitenkaan automaattisesti takaa tiettyä rarityä.

---

# 24. SYNERGY POOL

Uudet Market Tierit avaavat uusia synergyjä.

Esimerkiksi:

```text
Tier 1
Basic Tribe Synergy

Tier 2
Advanced Tribe Synergy

Tier 3
Role Synergy

Tier 4
Cross-Tribe Synergy

Tier 5
Transformative Synergy

Tier 6
Secret / Advanced Synergy

Tier 7
Mythic Synergy
```

Synergy-järjestelmä kehitetään omana sisältökokonaisuutenaan.

---

# 25. SYNERGY DISCOVERY

Market Tier voi avata mahdollisuuden löytää synergy.

Mutta:

```text
UNLOCKED
≠
AUTOMATICALLY ACTIVE
```

Pelaajan pitää edelleen:

```text
Find Units
+
Build Team
+
Reach Breakpoint
```

---

# 26. POWER CURVE

Tierien tulee nostaa power ceilingia.

```text
Tier 1
████

Tier 2
██████

Tier 3
████████

Tier 4
██████████

Tier 5
████████████

Tier 6
██████████████

Tier 7
████████████████
```

Mutta power ceiling ei tarkoita, että kaikki pelaajat saavuttavat sen.

---

# 27. COMPLEXITY CURVE

Myös strateginen monimutkaisuus kasvaa.

```text
Tier 1
Simple

Tier 2
Specialized

Tier 3
Synergistic

Tier 4
Hybrid

Tier 5
Transformative

Tier 6
Mastery

Tier 7
Experimental
```

---

# 28. MARKET AS DISCOVERY SYSTEM

Market ei saa näyttää aina samalta.

Sen pitäisi antaa pelaajalle tunne:

> "Mitä metsä tarjoaa tällä kertaa?"

Market pool riippuu:

```text
Market Tier
+
Biome
+
Seed
+
Run State
+
Player Influence
+
Unlocked Content
```

---

# 29. BIOME INFLUENCE

Market voi painottaa biomeen liittyviä unitteja.

Esimerkiksi:

### Frostroot

```text
Frostroot Units ↑
Control Units ↑
Freeze Synergies ↑
```

### Mirefall

```text
Mycelian ↑
Fenborn ↑
Poison ↑
Decay ↑
```

Tämä ei tarkoita, että muut unitit katoavat kokonaan.

---

# 30. PLAYER INFLUENCE

Pelaaja voi myöhemmin käyttää rahaa Marketin ohjaamiseen.

Esimerkiksi:

```text
TRIBE INFLUENCE
```

antaa:

```text
+chance for Rootborn
```

Tai:

```text
ROLE INFLUENCE
```

antaa:

```text
+chance for Healer
```

Tämä on money sink + strategic control.

---

# 31. MARKET RARITY

Marketin rarity:

```text
COMMON
UNCOMMON
RARE
EPIC
MYTHIC
ANCIENT
LEGENDARY
```

Rarity ei yksin määritä unitin tehokkuutta.

---

# 32. MARKET TIER ≠ RARITY

Tämä erotus on tärkeä.

Esimerkiksi:

```text
Tier 4 Market
```

voi sisältää:

```text
Common
Uncommon
Rare
Epic
```

mutta Epic-yksiköitä on vähän.

Tier määrittää:

> Mitä sisältöä Market voi tarjota.

Rarity määrittää:

> Kuinka harvinainen sisältö on.

---

# 33. MARKET ROTATION

Market voi käyttää pool rotationia.

Esimerkiksi:

```text
Current Market:

Rootborn ↑
Wildclaw ↑
Frostroot ↓
```

Se luo vaihtelua.

---

# 34. MARKET LOCK

Lock säilyttää nykyisen Marketin.

Esimerkiksi:

```text
LOCK SHOP
```

voi maksaa:

```text
0 Gold
```

mutta estää rerollin.

Tai advanced versio:

```text
PAID LOCK
```

säilyttää Marketin mutta antaa uuden vaihtoehdon.

---

# 35. MARKET REROLL

Reroll:

```text
Gold
→
New Shop
```

Rerollin hinta voi kasvaa runin aikana.

Esimerkiksi:

```text
2
2
2
2
3
3
4
```

Tämä estää loputtoman shop fishingin.

---

# 36. GOLD STORAGE

Pelaaja voi säästää rahaa.

Gold reserve voi tuottaa:

```text
Interest
```

tai muita economy-breakpointteja.

Esimerkiksi:

```text
10 Gold
→ +1 bonus

20 Gold
→ +2 bonus
```

Mutta liian suuri interest voi tehdä säästämisestä automaattisesti oikean ratkaisun.

Siksi cap tarvitaan.

---

# 37. MONEY SINK BALANCE

Jokaisella runin hetkellä pelaajalla pitäisi olla useita kiinnostavia tapoja käyttää rahaa.

Esimerkiksi:

```text
GOLD = 20

BUY UNIT
REROLL
LEVEL UP
MARKET UPGRADE
SAVE
```

Hyvä economy tarkoittaa:

> Ei ole yhtä aina oikeaa rahankäyttöä.

---

# 38. MARKET UPGRADE RISK

Market Upgrade voi olla voimakas investointi.

Esimerkiksi:

```text
Player has:
30 Gold

Upgrade costs:
25 Gold

Option A:
Upgrade Market

Option B:
Buy several units
```

Pelaaja ottaa riskin:

```text
Short-term weakness
→
Long-term access
```

---

# 39. TIER UNLOCK REWARDS

Kun uusi Tier avataan:

```text
MARKET TIER UNLOCKED
```

Pelaaja voi nähdä:

```text
NEW UNITS
NEW SYNERGIES
NEW ITEMS
NEW POSSIBILITIES
```

Esimerkiksi:

```text
🌿 GROVE MARKET

Unlocked:
+ 8 new units
+ 2 synergy families
+ 3 specialist units
+ 1 rare item pool
```

---

# 40. NO FREE POWER SPIKE

Tier Unlock ei saa tehdä pelaajan nykyisestä buildista automaattisesti vahvempaa.

Se antaa:

```text
OPTIONS
```

ei:

```text
FREE STATS
```

---

# 41. BUILD PIVOT THROUGH MARKET

Market Tier voi mahdollistaa pivotin.

Esimerkiksi:

```text
Current Build:
Rootborn

New Market:
Mycelian synergy appears

Player:
Buys 2 Mycelian units
```

Pelaaja voi siirtyä:

```text
Rootborn
→
Rootborn + Mycelian
```

tai:

```text
Rootborn
→
Mycelian
```

---

# 42. TEMPORARY MARKET CONTENT

Jotkin Market Tierit voivat tarjota:

```text
Temporary Units
Mercenaries
Seasonal Units
Biome Units
Event Units
```

Nämä eivät välttämättä kuulu pysyvään rosteriin.

---

# 43. MARKET EVENTS

Special Market events:

```text
Wandering Merchant
Ancient Trader
Corrupted Market
Spirit Market
Golden Market
Wild Market
Blackroot Market
```

Näillä voi olla omat money sinkinsä.

---

# 44. GOLDEN MARKET

Harvinainen tapahtuma:

```text
GOLDEN MARKET
```

Tarjoaa:

* erittäin harvinaisia unitteja
* erikoisitemeitä
* vaihtoehtoisia synergyjä.

Mutta:

```text
High Cost
+
High Opportunity Cost
```

---

# 45. MARKET FAILURE STATES

Pelaaja ei saa joutua tilanteeseen, jossa:

```text
Market Tier too high
+
No affordable units
```

Marketin pitää aina tarjota vähintään jonkinlainen käyttökelpoinen vaihtoehto.

---

# 46. COMEBACK ECONOMY

Heikko pelaaja voi saada mahdollisuuden palata peliin economylla.

Esimerkiksi:

```text
Low HP
→
Risk Market
→
High reward
```

Tämä ei saa olla automaattinen catch-up.

---

# 47. ECONOMY VS POWER

Hearthwoodin economy loop:

```text
GOLD
 ↓
POWER
 ↓
WIN
 ↓
MORE GOLD
```

mutta myös:

```text
GOLD
 ↓
INVESTMENT
 ↓
BETTER MARKET
 ↓
BETTER OPTIONS
 ↓
POWER
```

Pelaaja valitsee kumpaa polkua käyttää.

---

# 48. MARKET UI

Market-näkymässä näkyy:

```text
┌─────────────────────────────────────┐
│ MARKET — TIER III                  │
│                                     │
│ Gold: 34                            │
│                                     │
│ [Unit] [Unit] [Unit] [Unit] [Unit]│
│                                     │
│                                     │
│ Reroll   Lock   Upgrade Market      │
│                                     │
│ Next Tier: IV                       │
│ Cost: 42 Gold                       │
│ Unlocks:                            │
│ • Advanced Units                    │
│ • New Synergies                     │
└─────────────────────────────────────┘
```

---

# 49. NEXT TIER PREVIEW

Pelaajan pitää nähdä, mitä upgrade tekee.

Esimerkiksi:

```text
MARKET TIER IV

Unlocks:

★ Epic Units
◆ Hybrid Units
◆ Advanced Synergies
◆ New Item Pool
```

Tämä tekee investoinnista ymmärrettävän.

---

# 50. MARKET INFORMATION HIERARCHY

Näytä:

### Primary

```text
Gold
Market Tier
Available Units
```

### Secondary

```text
Next Tier
Synergies
Rarity
```

### Advanced

```text
Pool Probability
Unit Probability
Biome Influence
Seed Influence
```

---

# 51. MARKET DATA MODEL

```text
Market {
  level
  tier

  goldCost
  rerollCost
  lockState

  unitPool[]
  synergyPool[]
  itemPool[]
  relicPool[]

  biomeInfluence[]
  tribeInfluence[]
  roleInfluence[]

  upgradePath[]
}
```

---

# 52. MARKET TIER MODEL

```text
MarketTier {
  id
  name

  unlockRequirement

  availableRarities[]
  availableUnits[]
  availableSynergies[]
  availableItems[]
  availableRelics[]

  powerCeiling
  complexityLevel

  upgradeCost
}
```

---

# 53. MONEY SINK MODEL

```text
MoneySink {
  id
  name
  category

  goldCost
  purpose

  immediatePower
  futurePower
  strategicValue

  availability
  scaling
}
```

---

# 54. ECONOMY MANAGER

Uusi järjestelmä:

```text
EconomyManager
```

Vastuut:

* Gold
* income
* spending
* interest
* Market costs
* reroll costs
* locks
* economy breakpoints
* money sinks.

---

# 55. MARKET MANAGER

```text
MarketManager
```

Vastuut:

* Market Tier
* Market Level
* shop generation
* unit pools
* synergy pools
* Market upgrades
* Market events
* Market influence.

---

# 56. CONTENT UNLOCK MANAGER

```text
ContentUnlockManager
```

hallinnoi:

```text
Market Tier
→
Unit Unlock
→
Synergy Unlock
→
Item Unlock
→
Relic Unlock
```

---

# 57. SEED COMPATIBILITY

Market generation käyttää Hearthwoodin deterministic RNG-järjestelmää.

```text
Seed
+
Game Version
+
Ruleset Version
+
Market State
=
Market Result
```

Market RNG käyttää omaa streamiaan:

```text
MARKET RNG
```

eikä saa rikkoa Combat RNG:tä.

---

# 58. MARKET RNG STREAM

Nykyiseen RNG-arkkitehtuuriin:

```text
World RNG
Shop RNG
Loot RNG
Combat RNG
Event RNG
Enemy RNG
```

lisätään tarvittaessa:

```text
Market RNG
```

Jos Shop RNG jo hoitaa Marketin generoinnin, erillistä streamia ei tarvita.

Tärkeintä on deterministisyys.

---

# 59. BALANCE PRINCIPLES

### Principle 1

Higher Tier = more options.

### Principle 2

Higher Tier ≠ automatic victory.

### Principle 3

Rare ≠ always better.

### Principle 4

Market Upgrade = investment.

### Principle 5

Gold must have competing uses.

### Principle 6

New content should create builds.

### Principle 7

Synergies must remain meaningful.

### Principle 8

Players must understand why upgrading matters.

---

# 60. DEVELOPMENT ROADMAP

## Phase 1 — Market Tier Foundation

Implement:

```text
Market Tier
Market Level
Tier Unlock
Tier Preview
```

---

## Phase 2 — Unit Pool

Implement:

```text
Tier → Unit Pool
Rarity → Probability
Biome → Influence
```

---

## Phase 3 — Money Sinks

Implement:

```text
Buy
Reroll
Lock
Level
Market Upgrade
```

---

## Phase 4 — Synergy Unlocks

Implement:

```text
Tier
→
Synergy Availability
```

Synergyjen varsinainen sisältö rakennetaan erillisenä järjestelmänä.

---

## Phase 5 — Advanced Market

Implement:

```text
Influence
Special Markets
Market Events
Temporary Units
```

---

## Phase 6 — Endgame

Implement:

```text
Mythic
Ancient
Legendary
Secret
Worldroot
```

---

# 61. MVP

Ensimmäisessä toimivassa versiossa tarvitaan vain:

```text
Market
Market Upgrade
Tier 1
Tier 2
Tier 3
Gold
Buy
Reroll
Lock
Next Tier Preview
Tier-based Unit Pools
Basic Synergy Unlock Hooks
```

---

# 62. FUTURE EXPANSION

Myöhemmin voidaan lisätä:

```text
Tier 4
Tier 5
Tier 6
Tier 7

Market Influence
Golden Market
Ancient Market
Secret Market
Dynamic Market
Biome Market
Faction Market
Event Market
Legendary Market
```

---

# 63. CORE RELATIONSHIP

Market toimii yhdessä muiden Hearthwood-järjestelmien kanssa:

```text
ECONOMY
   ↓
MARKET
   ↓
UNITS
   ↓
ROLES
   ↓
TRIBES
   ↓
SYNERGIES
   ↓
BUILD
   ↓
COMBAT
```

Ja progression:

```text
MARKET TIER
     ↓
CONTENT ACCESS
     ↓
STRATEGIC OPTIONS
     ↓
BUILD COMPLEXITY
     ↓
PLAYER MASTERY
```

---

# 64. FINAL DESIGN NORTH STAR

Hearthwoodin Marketin tarkoitus ei ole kysyä:

> "Kuinka paljon rahaa sinulla on?"

Vaan:

> **"Mihin olet valmis sijoittamaan rahasi?"**

Market Tier puolestaan kysyy:

> **"Kuinka pitkälle olet valmis kehittämään strategiaasi?"**

Lopullinen rakenne:

```text
GOLD
 ↓
DECISION
 ↓
INVESTMENT
 ↓
MARKET TIER
 ↓
NEW UNITS
+
NEW SYNERGIES
+
NEW OPTIONS
 ↓
BUILD
 ↓
ADAPTATION
 ↓
MASTERY
```

**Core Principle:**

> **Money buys possibilities. Market Tiers unlock possibilities. Synergies turn possibilities into strategies.**
