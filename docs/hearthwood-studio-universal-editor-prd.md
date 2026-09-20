> **Status: north-star vision, not a work order — logged verbatim, no
> code change.** Marc pasted this in full (2026-09-20), no "jatketaan"
> trigger - the same bare-paste pattern as every other full PRD logged
> in this repo (Pixel Graphics & Visual UI, Chess Movement, ...).
> Delivered here as a docs-only PR, that precedent's own discipline.
> **The paste cut off mid-sentence at §28 Progression Editor** ("Kaikki
> progre...") - logged exactly as received; there may be more sections
> Marc didn't get to paste yet.
>
> **How this relates to what's already shipped**: "Hearthwood Studio"
> is not a proposed name - it already exists, at `/hearthwood-studio`
> (`src/pages/HearthwoodStudio.jsx`), and by the time this PRD arrived
> it already covered a large fraction of §1-§10's ask: 32 registered
> content types across every category this PRD names as GAME content
> (units, cards, relics, items, enemies, synergies, ...) plus STORY
> (cinematics, crossroads, events, journal), ECONOMY (win/interest/
> gamble levers, Ledger, Market Events), and GUIDANCE (help, coach
> tips, threat counterplay) - see
> [[hearthwood-studio-comprehensive-editor-mandate]] for the shipped
> inventory (PRs #513-#526). Universal per-type field editing (§8-§9),
> individually-editable nested arrays like a unit's own movePattern or
> an event's own choices (§10 Stats/Combat, §21 Event Editor's choice
> trees), image swapping (§10 Visual), clone-to-create (§9 DUPLICATE),
> and a live game preview pane are ALL already built. What is NOT built
> and would be genuinely new scope: the Dashboard overview/warnings
> panel (§5), Universal Search across all content at once (§7) - the
> current type-picker searches WITHIN one type, not across all of
> them - the Synergy Graph / dependency graph (§14-§15, §32 mentioned
> implicitly via "Relationships"), the World/Map node-graph editors
> (§18-§20), Dialogue trees and Character Relationship editors (§22-
> §23) - Hearthwood doesn't currently have a branching dialogue system
> at all, this would be new game architecture, not just new Studio UI -
> Guild Editor (§24, no guild system exists in the game yet either),
> Boss phase editor (§17, bosses aren't currently modeled as multi-
> phase), and the Playtest/Sandbox/Battle Simulator tools (§28+,
> whatever follows the cut-off, plus wherever this document was headed
> next).

# HEARTHWOOD

# Universal Game Content & Development Editor

## PRD — Kokonaisvaltainen Hearthwood-muokkausjärjestelmä

### Työnimi

**Hearthwood Studio**

> **One game. One editor. Everything editable.**

---

# 1. VISION

Hearthwood Studio on Hearthwood-pelin oma visuaalinen kehitys- ja sisältöeditori.

Sen päätavoite on yksinkertainen:

> **Marc pystyy muuttamaan Hearthwoodin sisältöä selkeästi ja turvallisesti ilman, että hänen tarvitsee osata ohjelmoida.**

Editorilla voidaan hallita esimerkiksi:

* hahmoja
* yksiköitä
* kortteja
* kykyjä
* esineitä
* reliccejä
* biomeja
* vihollisia
* pomoja
* taisteluita
* synergioita
* status-efektejä
* numeroarvoja
* taloutta
* progression rakennetta
* tarinaa
* dialogeja
* tapahtumia
* karttaa
* guildia
* markkinoita
* tehtäviä
* saavutuksia
* visuaalista sisältöä
* ääniä
* animaatioita
* vaikeustasoa
* balancea
* pelin sääntöjä

Kaikki nämä pitää pystyä löytämään yhdestä järjestelmästä.

---

# 2. ONGELMA

Hearthwood kasvaa nopeasti.

Jos sisältö on hajallaan:

```text
src/
components/
data/
services/
assets/
game/
systems/
```

muutoksen tekeminen muuttuu vaikeaksi.

Esimerkiksi yhden yksikön muuttaminen voi vaatia:

1. oikean tiedoston etsimisen
2. oikean objektin löytämisen
3. riippuvuuksien ymmärtämisen
4. arvon muuttamisen
5. buildin testaamisen
6. mahdollisten virheiden korjaamisen

Hearthwood Studio piilottaa tämän teknisen monimutkaisuuden.

Marc näkee:

```text
UNITS
Cards
Abilities
Enemies
Bosses
Items
Relics
Biomes
Events
Story
Balance
...
```

ja voi avata haluamansa asian.

---

# 3. CORE PRINCIPLE

## EVERYTHING IS DATA

Hearthwoodin pelisisältö pitää mahdollisuuksien mukaan määritellä datana eikä kovakoodattuna logiikkana.

Esimerkiksi yksikkö:

```text
Unit
 ├─ Identity
 ├─ Stats
 ├─ Abilities
 ├─ Traits
 ├─ Tags
 ├─ Synergies
 ├─ Visuals
 ├─ Audio
 └─ Progression
```

Tämän jälkeen editori voi muodostaa käyttöliittymän automaattisesti.

---

# 4. KÄYTTÄJÄT

## Primary User

Marc — Hearthwoodin suunnittelija ja luoja.

Hän ei saa joutua:

* etsimään tiedostoja
* muistamaan JSON-rakenteita
* kirjoittamaan ID-koodeja käsin
* ymmärtämään koko ohjelmiston arkkitehtuuria
* avaamaan useita IDE-tiedostoja yhden muutoksen vuoksi.

---

# 5. PÄÄNÄKYMÄ

Hearthwood Studio käynnistyy Dashboardiin.

```text
┌──────────────────────────────────────────────┐
│ HEARTHWOOD STUDIO                            │
├──────────────┬───────────────────────────────┤
│              │                               │
│ Dashboard    │       GAME OVERVIEW           │
│              │                               │
│ Content      │ Units          42             │
│ Balance      │ Cards          128            │
│ Combat       │ Enemies        37             │
│ World        │ Biomes         8              │
│ Story        │ Relics         64             │
│ Progression  │ Events         31             │
│ Economy      │                               │
│ Visuals      │ Warnings       3              │
│ Audio        │ Errors         0              │
│ Testing      │                               │
│              │ [PLAYTEST] [VALIDATE]         │
└──────────────┴───────────────────────────────┘
```

---

# 6. NAVIGAATIO

Päävalikko:

```text
DASHBOARD

GAME
 ├─ Units
 ├─ Cards
 ├─ Abilities
 ├─ Traits
 ├─ Enemies
 ├─ Bosses
 ├─ Items
 ├─ Relics
 ├─ Status Effects
 └─ Synergies

WORLD
 ├─ Biomes
 ├─ Map
 ├─ Locations
 ├─ Events
 ├─ NPCs
 ├─ Guild
 └─ Market

STORY
 ├─ Acts
 ├─ Chapters
 ├─ Dialogues
 ├─ Characters
 ├─ Lore
 └─ Story Events

COMBAT
 ├─ Combat Rules
 ├─ Auto-Battler Rules
 ├─ AI
 ├─ Targeting
 ├─ Damage
 ├─ Status
 └─ Boss Rules

PROGRESSION
 ├─ Player Progression
 ├─ Unit Progression
 ├─ Unlocks
 ├─ Rewards
 └─ Achievements

ECONOMY
 ├─ Resources
 ├─ Prices
 ├─ Rewards
 ├─ Market
 └─ Drop Tables

VISUALS
 ├─ Characters
 ├─ Units
 ├─ Enemies
 ├─ Effects
 ├─ UI
 ├─ Backgrounds
 └─ Assets

AUDIO
 ├─ Music
 ├─ SFX
 ├─ Combat
 └─ Events

BALANCE
 ├─ Stats
 ├─ Difficulty
 ├─ Damage
 ├─ Economy
 └─ Progression

TOOLS
 ├─ Search
 ├─ Validator
 ├─ Dependency Graph
 ├─ Version History
 ├─ Import / Export
 └─ Debug

PLAYTEST
 ├─ Sandbox
 ├─ Battle Simulator
 ├─ Run Simulator
 └─ Scenario Editor
```

---

# 7. UNIVERSAL SEARCH

Editorissa pitää olla erittäin tehokas haku.

Hakukenttä:

```text
Search Hearthwood...
```

Se hakee kaikesta.

Esimerkiksi:

```text
blood
```

löytää:

* Bloodfang
* Blood Ritual
* Blood status
* Blood biome event
* Blood relic
* Blood synergy
* dialogit joissa esiintyy "blood"
* assetit
* VFX:t

---

# 8. UNIVERSAL ENTITY VIEW

Kaikki pelin objektit avataan saman periaatteen mukaisesti.

Esimerkiksi:

```text
Bloodfang
────────────────────────

Type:
UNIT

ID:
unit_bloodfang

Tags:
Beast
Blood
Forest

Stats
HP             120
Attack         32
Speed          1.2
Armor          5

Abilities
Blood Bite
Blood Frenzy

Traits
Bleeding Heart

Synergies
Blood
Beast

Visual
[Preview]

Audio
[Preview]

Relationships
Used by 4 cards
Used by 2 relics
Used by 3 events
```

---

# 9. EDIT MODE

Jokaisella objektilla:

```text
VIEW
EDIT
DUPLICATE
DELETE
TEST
HISTORY
```

Edit-tilassa arvot muutetaan lomakkeilla.

Ei raakaa JSONia oletusnäkymässä.

---

# 10. UNIT EDITOR

Unit Editor hallitsee kaikkia Hearthwoodin peliyksiköitä.

Muokattavat tiedot:

### Identity

* Name
* ID
* Description
* Faction
* Tribe
* Type
* Rarity

### Stats

* HP
* Attack
* Defense
* Speed
* Attack Speed
* Range
* Critical
* Accuracy
* Resistances

### Combat

* Targeting
* Attack pattern
* Abilities
* Passive
* AI behavior

### Tags

* Beast
* Spirit
* Elemental
* Human
* Cosmic
* Forest
* Fire
* Frost
* Blood
* etc.

### Visual

* Sprite
* Portrait
* Animation
* VFX
* Aura

---

# 11. CARD EDITOR

Jos Hearthwood käyttää korttimaista sisältöä:

```text
Card Name
Type
Cost
Rarity
Description

Effect

Target

Conditions

Tags

Synergies

Upgrade Path

Visual

Audio
```

Korttia voidaan testata suoraan editorissa.

---

# 12. ABILITY EDITOR

Ability:

```text
Name
Description
Cooldown
Cost
Target
Range
Area
Damage
Healing
Status
Duration
Chance
Conditions
Effects
VFX
SFX
```

Esimerkiksi:

```text
Blood Thorn

Damage: 25

Apply:
Bleed 3

If target is already Bleeding:
+50% Damage
```

---

# 13. STATUS EFFECT EDITOR

Kaikki status-efektit keskitetään yhteen paikkaan.

Esimerkiksi:

* Bleed
* Burn
* Freeze
* Poison
* Root
* Stun
* Vulnerable
* Regeneration
* Curse
* Blessing

Jokaisella:

```text
Name
Duration
Stacks
Stack Limit
Damage
Tick Rate
Modifiers
Visual
Audio
Interactions
```

---

# 14. SYNERGY EDITOR

Tämä on yksi Hearthwood Studion tärkeimmistä järjestelmistä.

Synergy voidaan määritellä graafisesti.

Esimerkiksi:

```text
FIRE
  +
BEAST
  ↓
FIRE BEAST
```

tai:

```text
BLEED
  +
THORN
  +
BLOOD
  ↓
CRIMSON THORN
```

Editorissa:

```text
Required Tags
        ↓
Conditions
        ↓
Effect
        ↓
Visual
        ↓
Reward
```

---

# 15. SYNERGY GRAPH

Visuaalinen graafi näyttää riippuvuudet.

```text
Bloodfang
   │
   ├── Blood
   │     │
   │     └── Blood Ritual
   │
   └── Beast
         │
         └── Beastmaster
```

Klikkaamalla solmua käyttäjä pääsee suoraan kyseiseen sisältöön.

---

# 16. ENEMY EDITOR

Viholliset:

```text
Name
Type
Tier
HP
Damage
Defense
Speed
AI
Targeting
Abilities
Traits
Drops
Rewards
Tags
Visuals
Audio
```

Vihollisen voi testata:

**Spawn Enemy**

---

# 17. BOSS EDITOR

Bossille tarvitaan oma editori.

```text
Boss Identity

HP
Phases
Abilities
AI
Arena
Summons
Enrage
Weaknesses
Rewards
Story
Music
VFX
Death Sequence
```

Phase editor:

```text
PHASE 1
100–70%

PHASE 2
70–40%

PHASE 3
40–0%
```

---

# 18. BIOME EDITOR

Biome:

```text
Name
Description
Environment
Enemies
Elite Pool
Boss Pool
Events
Music
Weather
Background
Lighting
Rewards
Difficulty
```

Esimerkiksi:

**Autumnwood**

```text
Enemies:
Rootbeast
Bloodfang
Hollow

Weather:
Rain

Events:
Old Shrine
Lost Hunter
Witch Fire
```

---

# 19. WORLD EDITOR

World Editor näyttää Hearthwoodin maailman karttana.

```text
        FROSTROOT
            │
            │
AUTUMNWOOD ─┼─ MIRE
            │
         SUNSPIRE
```

Solmua klikkaamalla avautuu location-editori.

---

# 20. MAP EDITOR

Slay the Spire -tyylinen roguelite-polku voidaan rakentaa visuaalisesti.

Node-tyypit:

* Combat
* Elite
* Boss
* Event
* Shop
* Rest
* Treasure
* Mystery
* Shrine
* Story

Nodeja voi:

* lisätä
* poistaa
* siirtää
* yhdistää
* kopioida

---

# 21. EVENT EDITOR

Event voidaan rakentaa ilman koodaamista.

```text
EVENT

Trigger
   ↓
Dialogue
   ↓
Choice
 ┌───────┴───────┐
 ↓               ↓
Choice A       Choice B
 ↓               ↓
Reward          Combat
```

Jokaisella valinnalla voi olla:

* requirement
* consequence
* reward
* relationship change
* resource change
* unlock
* combat
* story flag

---

# 22. DIALOGUE EDITOR

Dialogit:

```text
Character
Dialogue
Emotion
Portrait
Choices
Conditions
Consequences
```

Dialogipuu:

```text
NPC
 │
 ├─ "Who are you?"
 │      │
 │      ├─ Friendly
 │      └─ Hostile
 │
 └─ "What happened?"
        │
        └─ Story branch
```

---

# 23. CHARACTER RELATIONSHIP EDITOR

Jos hahmoilla on suhteita:

```text
Character A
      │
      ↓
Trust
Curiosity
Fear
Respect
Friendship
```

Editorissa voidaan määrittää:

```text
Event
   ↓
Relationship change
   ↓
New dialogue
   ↓
New event
```

---

# 24. GUILD EDITOR

Guild-järjestelmä:

```text
Guild Level
Members
Buildings
Upgrades
Resources
Unlocks
Quests
Reputation
```

Jokainen guild-rakennus voidaan muokata erikseen.

---

# 25. MARKET EDITOR

Market:

```text
Item
Price
Currency
Stock
Rarity
Availability
Unlock Requirement
Refresh Rules
```

Mahdollisuus:

**Edit Market**

ja nähdä kaikki tuotteet yhdellä sivulla.

---

# 26. ECONOMY EDITOR

Kaikki numerot samaan järjestelmään.

Resurssit:

* Gold
* Essence
* Wood
* Spirit
* Blood
* Relic currency
* Event currency

Editorissa voidaan säätää:

```text
Starting Amount
Drop Rate
Reward
Price
Upgrade Cost
Shop Price
Sell Value
```

---

# 27. RELIC EDITOR

Relic:

```text
Name
Rarity
Description
Effect
Trigger
Condition
Stacks
Tags
Synergies
Visual
Audio
Unlock
```

Esimerkiksi:

```text
Heart of the Forest

Effect:
Forest units gain +10% HP.

If 3+ Forest units:
They regenerate each round.
```

---

# 28. PROGRESSION EDITOR

<!-- Marc's paste cut off here mid-sentence ("Kaikki progre...").
     Logged verbatim up to this point - ask Marc for the rest if this
     section and anything after it still needs capturing. -->
