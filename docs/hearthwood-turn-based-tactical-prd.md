# Hearthwood — PRD: Turn-Based Tactical Roguelite RPG

> **North star, not a work order — and a genuinely different one from every other logged
> PRD.** Marc pasted this verbatim (2026-09-12), no round trigger attached. Every other
> Hearthwood PRD in `docs/` (Enemy Ecosystem, Progressive Challenge, Build Archetype,
> Market/Money-Sinks, Strategic Upgrades, Roles/Build System, Seed/Playstyle...) proposes
> a system layered **on top of** the shipping auto-battler: `startAutoBattle` /
> `resolveRound` fully auto-resolves a fight from a pre-battle formation choice, with
> **zero in-combat player interaction and zero in-combat RNG** — that split (`easy to
> play, hard to master`; all the depth lives in recruiting, positioning, tribes,
> upgrades, relics *before* the fight starts) has been the explicit, standing design
> mandate behind all 41 shipped Hearthwood rounds to date (#384–#445), including all 9
> shipped enemy archetypes (Swarm through Ancients), the whole role/build/counterplay
> analysis layer, and the threat-preview system.
>
> **This PRD proposes retiring that split.** Its core thesis (§3, §56) is the opposite
> one: *"a good build can still lose on a bad decision; a weak build can win on a good
> one"* — i.e. move the depth **into** combat via a full turn-based tactics layer (a
> grid, Action Points, initiative order, enemy telegraphs/intents, line of sight,
> terrain, reactions/interrupts, objectives beyond "kill everything", and a real
> `CombatEngine`/`TurnManager` architecture, §35–§53). That is not an additive slice —
> it is a from-scratch combat engine that would obsolete or require re-deriving the
> combat-facing half of `autoBattleEngine.js`, every enemy archetype's tick/trigger
> mechanics (`applyAncientCharge`, `applyCultTick`, `applyCovenTick`, threat targeting,
> pattern attacks, auras...), and the FormationScreen → one-click-battle flow the whole
> game is built around.
>
> **Logged as-is, standalone (no code change in this PR).** Whether/when/how much of
> this becomes real work — a distant "Hearthwood 2.0" exploration, a hybrid slice (e.g.
> just enemy telegraphs/intents, which the Ancients archetype already gestures at with
> its ⚡-countdown), or shelved as inspiration alongside the Boosterverse Chess and
> Living Forest Ecosystem visions — is Marc's call, asked separately from this doc.

---

## PRD — Turn-Based Tactical Roguelite RPG

### Uusi pelisuunta: Auto-battlerista vuoropohjaiseksi taktiseksi tiimipeliksi

**Versio:** 1.0
**Status:** Core Direction / Concept Development
**Genre:** Turn-Based Tactical RPG + Roguelite + Team Builder + Synergy Strategy
**Core fantasy:** Cosy tactics with deep synergy

---

# 1. Vision

Hearthwood on vuoropohjainen taktinen roguelite-peli, jossa pelaaja rakentaa metsän hengistä koostuvan tiimin ja ohjaa sitä taisteluissa.

Pelaaja ei enää vain suunnittele buildiä ja katso taistelua.

Pelaaja tekee itse taktiset päätökset:

* kuka liikkuu
* kuka hyökkää
* mitä kykyä käytetään
* kuka suojataan
* mihin vihollinen houkutellaan
* milloin riskeerataan
* milloin vetäydytään
* miten synergiat ketjutetaan

Build-järjestelmä säilyy tärkeänä, mutta se ei yksin ratkaise taistelua.

Uusi peruskaava:

```text
BUILD
↓
FORMATION
↓
SCOUT
↓
READ ENEMY INTENT
↓
TAKE TURN
↓
MOVE / ATTACK / ABILITY / DEFEND
↓
ENEMY TURN
↓
ADAPT
↓
VICTORY OR DEFEAT
```

---

# 2. Uusi genre-identiteetti

## Aiempi suunta

```text
Auto-battler
+
Roguelite
+
Synergy Builder
```

## Uusi suunta

```text
Turn-Based Tactical RPG
+
Roguelite
+
Team Builder
+
Synergy System
+
Story Exploration
```

Hearthwoodin identiteetti ei ole enää:

> "Rakenna joukkue ja katso sen taistelevan."

Vaan:

> "Rakenna joukkue ja käytä sen strategiaa itse."

---

# 3. Design North Star

> **Every turn is a meaningful decision.**

Suomeksi:

> **Jokaisella vuorolla on merkityksellinen päätös.**

Hyvä vuoro voi tarkoittaa:

* vihollisen tappamista
* paremman aseman ottamista
* liittolaisen suojaamista
* kyvyn valmistelua
* vihollisen houkuttelemista ansaan
* resurssien säästämistä
* vihollisen suunnitelman rikkomista
* riskin ottamista paremman palkinnon vuoksi

Pelaajan ei pitäisi vain painaa aina vahvinta hyökkäystä.

---

# 4. Core Gameplay Loop

```text
EXPLORE FOREST
↓
CHOOSE ROUTE
↓
SCOUT ENCOUNTER
↓
PREPARE TEAM
↓
POSITION UNITS
↓
TURN-BASED COMBAT
↓
REWARDS
↓
UPGRADES / ITEMS / RELICS
↓
STORY EVENT
↓
ADAPT BUILD
↓
DEEPER FOREST
```

Laajempi run-loop:

```text
World Map
→ Event
→ Shop
→ Team Building
→ Formation
→ Combat
→ Reward
→ Character Development
→ New Route
→ Boss
→ Next Act
```

---

# 5. Taistelun perusrakenne

Taistelu tapahtuu ruudukolla tai pienellä taktisen alueen kartalla.

Esimerkiksi:

```text
      ENEMY SIDE

  E1   E2   E3   E4

  .    .    .    .

  .    .    .    .

  A1   A2   A3   A4

      PLAYER SIDE
```

Ruudukko voi myöhemmin sisältää:

* korkeuseroja
* metsiä
* kiviä
* vettä
* jäätä
* mutaa
* piikkejä
* sienialueita
* pyhiä paikkoja
* tuhoutuvia esteitä

---

# 6. Unit Turn System

Jokainen yksikkö toimii omalla vuorollaan.

Yksikön vuorolla sillä on esimerkiksi:

```text
2 Action Points
```

Toimintoja:

| Toiminto       |  AP-kustannus |
| -------------- | ------------: |
| Move           |             1 |
| Basic Attack   |             1 |
| Strong Attack  |             2 |
| Ability        |           1–2 |
| Defend         |             1 |
| Interact       |             1 |
| Overwatch      |             2 |
| Prepare        |             1 |
| Revive Attempt | erikoissääntö |

Yksikkö voi esimerkiksi:

```text
Move + Attack
```

tai:

```text
Attack + Defend
```

tai:

```text
Move + Ability
```

---

# 7. Action Point -järjestelmä

Jokaisella yksiköllä on:

```text
AP
Movement
Range
Energy
Cooldowns
```

## Esimerkki

```text
Ironbark Guardian

AP: 2
Movement: 3
Attack Range: 1
Energy: 0 / 100
```

Vuorolla:

```text
Move 2 tiles
+
Guard an ally
```

Tai:

```text
Move 1 tile
+
Attack enemy
```

AP-järjestelmä tekee jokaisesta vuorosta pienen pulman.

---

# 8. Vuorojärjestys

Hearthwoodiin voidaan tehdä Initiative-järjestelmä.

Yksikön vuoroon vaikuttavat:

* Speed
* Initiative
* Status effects
* Terrain
* Formation
* Items
* Tribe bonuses
* Enemy abilities
* Tactical events

Esimerkki:

```text
1. Enemy Assassin
2. Wildclaw Hunter
3. Rootborn Guardian
4. Mycelian Alchemist
5. Enemy Beast
6. Healer
```

Pelaaja ei siis aina saa kaikkia yksiköitä toimimaan peräkkäin.

---

# 9. Vaihtoehtoinen vuorojärjestelmä: Team Initiative

Jos yksittäinen initiative tekee pelistä liian hitaasti hallittavan, voidaan käyttää tiimivuoroja.

```text
PLAYER TURN
↓
Pelaaja käyttää 1–4 yksikön toiminnot
↓
ENEMY TURN
↓
Vihollinen toimii
```

Tämä on aloittelijalle selkeämpi.

## Suositus

### MVP

Käytä:

```text
Player Team Turn
→ Enemy Team Turn
```

### Myöhemmin

Lisää:

```text
Mixed Initiative
```

eli yksiköt toimivat nopeusjärjestyksessä.

---

# 10. Player Team Turn

Pelaajan vuorolla hän saa käyttää kaikkia yksiköitään.

Esimerkiksi:

```text
PLAYER TURN

Guardian:
Move + Guard

Archer:
Attack

Alchemist:
Apply Poison

Healer:
Heal

END TURN
```

Pelaaja voi lopettaa vuoron ennen kuin kaikki yksiköt ovat toimineet.

Tämä antaa taktisen valinnan:

> Käytänkö kaikki toimintoni vai säästänkö jonkin yksikön reaktiota varten?

---

# 11. Reactions

Yksiköt voivat toimia myös vihollisen vuorolla.

Esimerkkejä:

* Overwatch
* Counterattack
* Guard
* Intercept
* Emergency Heal
* Retaliation
* Dodge
* Shield Trigger
* Trap
* Opportunity Attack

## Esimerkki

```text
Enemy Assassin moves toward Healer
↓
Guardian has Overwatch
↓
Guardian intercepts
↓
Assassin is stopped
```

Tämä tekee asemoinnista tärkeää myös silloin, kun pelaaja ei ole omalla vuorollaan.

---

# 12. Combat Intent System

Viholliset eivät saa olla täysin arvaamattomia.

Tärkeät vihollisen toiminnot näytetään intentteinä.

Esimerkiksi:

```text
Enemy Boss Intent:
"Crushing Root Strike"

Target:
Area B3–D3

Effect:
Heavy damage + Root
```

Pelaaja voi:

* siirtää yksiköitä
* käyttää Shieldiä
* keskeyttää kyvyn
* suojata kohteen
* hyväksyä iskun
* käyttää terrainia
* jakaa joukkueen

Tämä tekee taistelusta taktisen ongelman.

---

# 13. Telegraph System

Vaaralliset hyökkäykset näkyvät ennen toteutusta.

Telegraph näyttää:

* kohdealueen
* vahingon tyypin
* mahdolliset statukset
* vuoron, jolloin isku tapahtuu
* keskeytysmahdollisuuden
* turvalliset ruudut

Esimerkiksi:

```text
BOSS CHARGES AOE ATTACK

Danger Zone:
[ X ][ X ][ X ][ X ]

Safe Zone:
[   ][   ][   ][   ]
```

Pelaaja ei häviä vain siksi, ettei tiennyt mitä tapahtuu.

---

# 14. Unit Roles uudessa pelissä

Aiemmat roolit säilyvät, mutta niitä laajennetaan taktisesti.

## Tank

* suojaa alueita
* estää liikkumista
* käyttää Guardia
* pakottaa vihollisen targetointia
* pitää choke pointteja
* interceptaa hyökkäyksiä

## DPS

* tuottaa vahinkoa
* käyttää korkeuseroja
* keskittyy tärkeisiin kohteisiin
* hyödyntää flankingia
* viimeistelee heikot viholliset

## Healer

* parantaa
* poistaa statuksia
* ylläpitää tiimin toimintakykyä
* ennakoi vahinkoa
* käyttää suojaavia kykyjä

## Support

* antaa AP:tä
* antaa Energyä
* muuttaa Initiativea
* vahvistaa rangea
* luo taktisia mahdollisuuksia

## Control

* sulkee ruutuja
* hidastaa
* pysäyttää
* pakottaa vihollisen reitit
* estää kykyjä

## Assassin

* liikkuu nopeasti
* hyökkää sivustaan
* tappaa heikkoja kohteita
* pakenee ennen vastaiskua

## Artillery

* hyödyntää rangea
* ampuu korkealta
* tekee AOE-vahinkoa
* tarvitsee suojaa

## Summoner

* luo tilapäisiä yksiköitä
* täyttää ruutuja
* rakentaa saartoja
* käyttää summonien kuolemaa hyödyksi

---

# 15. Formation System

Formation ei enää ole vain passiivinen bonus.

Se määrittelee:

* aloituspaikat
* suojauksen
* kulkureitit
* choke pointit
* flankkien riskit
* line of sightin
* ability-alueet
* vihollisen lähestymisreitit

Mahdolliset formationit:

## Line

Hyvä:

* puolustamiseen
* kapeisiin käytäviin
* Guardian-rakenteisiin

Heikko:

* AOE:lle
* flankkaukselle

## Wedge

Hyvä:

* aggressiiviseen etenemiseen
* melee-painotteisiin buildeihin

Heikko:

* backline-paineelle

## Split

Hyvä:

* AOE:n välttämiseen
* usean kohteen painostamiseen

Heikko:

* heikko keskinäinen suoja

## Fortress Formation

Hyvä:

* Tank
* Shield
* Healer
* Control

Heikko:

* hidas
* haavoittuva Artillerylle

## Ambush Formation

Hyvä:

* Assassin
* Trap
* Burst
* Terrain

---

# 16. Movement & Positioning

Liikkuminen saa olla yksi pelin tärkeimmistä taktisen syvyyden lähteistä.

Liikkumiseen vaikuttavat:

* Movement Points
* terrain
* status effects
* unit size
* obstacles
* formation
* enemy control
* mobility abilities

## Terrain examples

### Forest

* antaa suojaa
* vähentää ranged-vahinkoa
* vahvistaa Nature-yksiköitä

### Water

* hidastaa
* mahdollistaa Frost-reaktioita
* heikentää Fire-yksiköitä

### Ice

* liukastuminen
* liikkumisen muuttuminen
* Freeze-synergiat

### Mire

* poison
* slow
* corruption

### Sacred Ground

* healing
* cleanse
* Radiance-bonukset

---

# 17. Line of Sight

Ranged-yksiköt eivät saa ampua kaikkialle.

Line of sight riippuu:

* esteistä
* korkeuseroista
* metsästä
* yksiköistä
* savusta
* sumusta
* terrainista

Tämä antaa Artillery- ja Control-buildeille lisää merkitystä.

---

# 18. Build Archetypes uudessa taistelussa

Aiemmat buildit säilyvät, mutta niiden pelitapa muuttuu.

## Fortress

Strategia:

* pidä choke point
* suojaa Healer
* pakota vihollinen hyökkäämään
* käytä Guardia ja Shieldiä
* voita kuluttamalla vihollinen

## Assassin

Strategia:

* etsi heikko kohde
* liiku sivustaan
* käytä Burstia
* tapa ja vetäydy
* vältä vastaiskua

## Control

Strategia:

* hallitse ruutuja
* estä reittejä
* hidasta vihollisen etenemistä
* riko vihollisen formation
* keskeytä kyvyt

## Swarm

Strategia:

* täytä ruudukko
* estä liikkumista
* saarra vihollinen
* käytä summonien kuolemaa
* suojaa Summoner

## Poison

Strategia:

* merkitse kohteet
* levitä statuksia
* pakota vihollinen liikkumaan
* odota stackien kasvua
* hallitse pitkää taistelua

## Economy

Strategia:

* heikompi alkupeli
* paremmat Market-valinnat
* enemmän itemeitä
* paremmat yksiköt myöhemmin
* suurempi taktinen joustavuus

## Sacrifice

Strategia:

* uhraa yksikkö oikealla hetkellä
* aktivoi Death Engine
* luo summon
* aiheuta ketjureaktio
* käytä kuolemaa resurssina

---

# 19. Uusi Build Dimension: Tactical Execution

Aiemmat build-arvot eivät yksin riitä.

Lisätään:

```text
Tactical Execution
```

Se kuvaa sitä, kuinka paljon build hyötyy pelaajan tarkasta ohjauksesta.

Esimerkiksi:

| Build     | Tactical Execution |
| --------- | -----------------: |
| Fortress  |                  5 |
| Bruiser   |                  4 |
| Swarm     |                  7 |
| Assassin  |                  9 |
| Control   |                 10 |
| Artillery |                  8 |
| Sacrifice |                 10 |
| Economy   |                  6 |

Tämä ei tarkoita, että korkea arvo olisi aina parempi.

Se tarkoittaa, että build tarjoaa enemmän päätöksiä ja palkitsee hyvän pelaamisen.

---

# 20. Uusi Build Dimension: Position Dependency

Kuinka paljon build tarvitsee oikean asemoinnin.

```text
Position Dependency: 0–10
```

Esimerkiksi:

* Fortress: 8
* Assassin: 10
* Artillery: 9
* Bruiser: 4
* Swarm: 7
* Economy: 3

Tämä auttaa rakentamaan selkeitä vahvuuksia ja heikkouksia.

---

# 21. Uusi Build Dimension: Action Economy

Action Economy kertoo, kuinka tehokkaasti build käyttää vuoronsa.

Esimerkiksi:

* ylimääräiset AP:t
* bonusliikkeet
* ilmaiset kyvyt
* useat targetit
* reactionit
* summonit
* cooldown reduction
* ally assistance

Build voi olla heikko statseissa mutta vahva toimintojen määrässä.

Esimerkki:

```text
Support gives ally +1 AP
↓
Ally moves
↓
Attacks
↓
Triggers combo
```

Action Economy ei saa olla liian vahva, koska ylimääräiset vuorot voivat rikkoa tasapainon.

---

# 22. Combo System

Vuoropohjainen peli tarvitsee kykyketjuja.

Esimerkkejä:

```text
Root
↓
Thorn Strike
↓
Bleed
↓
Execute
```

```text
Wet Terrain
↓
Frost Ability
↓
Freeze
↓
Shatter
```

```text
Poison
↓
Decay
↓
Spread
↓
Corruption
```

```text
Shield
↓
Radiance
↓
Cleanse
↓
Holy Barrier
```

Combojen tulee perustua näkyviin sääntöihin.

Pelaajan pitää pystyä oppimaan:

> "Jos teen A:n ennen B:tä, syntyy C."

---

# 23. Status Effects vuoropohjaisessa pelissä

Statukset saavat selkeän vuororakenteen.

Jokaisella statuksella on:

* duration
* stacks
* trigger timing
* source
* removal method
* interaction rules

Esimerkiksi:

## Poison

* vahinko vuoron lopussa
* stackit kasvavat
* voidaan levittää
* voidaan puhdistaa

## Root

* Movement = 0
* ei estä kaikkia kykyjä
* voidaan poistaa Cleanse-kyvyllä

## Stun

* yksikkö menettää vuoron
* erittäin vahva
* harvinainen ja kallis

## Slow

* vähentää Movementia
* ei poista koko vuoroa
* hyvä soft control

---

# 24. Cooldown System

Kyvyt eivät saa olla rajattomasti käytettävissä.

Jokaisella kyvyllä voi olla:

```text
Cooldown
Energy Cost
AP Cost
Range
Area
Target Rules
```

Esimerkki:

```text
Root Wall

AP Cost: 1
Energy Cost: 20
Cooldown: 3 turns
Range: 5
Duration: 2 turns
```

Tämä luo päätöksen:

> Käytänkö Root Wallin nyt vai säästänkö sen bossin seuraavaan vaiheeseen?

---

# 25. Energy System

Energy kertyy esimerkiksi:

* hyökkäyksistä
* vahingon ottamisesta
* liittolaisten suojaamisesta
* statusten käyttämisestä
* comboista
* oikea-aikaisista reactioneista
* vihollisen kyvyn keskeyttämisestä

Energyä käytetään:

* signature abilities
* ultimate abilities
* emergency actions
* team commands
* powerful reactions

---

# 26. Team Commands

Pelaajalla voi olla pieni määrä koko tiimin komentoja.

Esimerkiksi:

## Rally

Kaikki liittolaiset saavat:

* +1 Movement
* pieni Shield
* parempi Morale

## Hold the Line

* frontline saa Defense-bonuksen
* yksiköt eivät voi vapaaehtoisesti siirtyä kauas
* hyvä Fortress-buildille

## Coordinated Strike

* kaksi yksikköä hyökkää samaan kohteeseen
* mahdollistaa Combo-triggerin

## Retreat

* tiimi vetäytyy
* voi maksaa palkinnon tai HP:n
* estää täydellisen wipeout-tilanteen

Team Commands kuluttavat Tactical Resourcea.

---

# 27. Tactical Resource

Lisätään:

```text
Tactical Command Points
```

Niitä saadaan:

* taistelun alussa
* bossin vaiheista
* relicien kautta
* Commander-yksiköistä
* onnistuneista tavoitteista

Niitä käytetään:

* Team Commands
* Emergency Move
* Interrupt
* Formation Shift
* Reinforce
* Tactical Item

---

# 28. Victory Conditions

Kaikki taistelut eivät saa olla "tapa kaikki".

Mahdolliset tavoitteet:

* Defeat all enemies
* Survive X turns
* Protect NPC
* Protect Heartwood Seed
* Reach extraction point
* Destroy corrupted object
* Capture sacred ground
* Escort spirit
* Defeat boss phase
* Collect forest fragments
* Escape ambush
* Prevent ritual
* Keep specific unit alive

Tämä tekee eri buildeista hyödyllisiä eri tilanteissa.

---

# 29. Battle Objectives ja Build Diversity

Esimerkiksi:

## Fortress

Vahva:

* Survive
* Protect
* Hold Position

Heikko:

* Timed Escape
* Kill Priority Target

## Assassin

Vahva:

* Kill Target
* Destroy Object
* Ambush

Heikko:

* Protect NPC
* Long Defense

## Control

Vahva:

* Hold Area
* Prevent Ritual
* Delay Enemy

## Swarm

Vahva:

* Occupy Area
* Escort
* Block Routes

## Artillery

Vahva:

* Defeat Boss
* Protect Position
* Destroy Structures

---

# 30. Enemy AI

Vihollinen käyttää samoja perusperiaatteita kuin pelaaja.

Vihollinen voi:

* liikkua
* käyttää kykyjä
* suojata yksiköitä
* käyttää terrainia
* vetäytyä
* tehdä flankin
* käyttää reactioneita
* priorisoida pelaajan carryn
* rikkoa formationin

Enemy AI -tasot:

1. Basic
2. Role-aware
3. Position-aware
4. Synergy-aware
5. Objective-aware
6. Adaptive
7. Boss AI

---

# 31. Enemy Intent AI

Vihollinen ilmoittaa tärkeät aikeensa.

Esimerkiksi:

```text
Enemy Archer:
"Targeting your Healer."

Enemy Guardian:
"Preparing Guard."

Enemy Shaman:
"Summoning reinforcements."

Boss:
"Preparing area corruption."
```

Vihollinen ei saa huijata pelaajaa näkymättömillä bonusvuoroilla.

Jos vihollinen käyttää erikoissääntöä, sen pitää olla ymmärrettävissä.

---

# 32. Roguelite Progression

Taistelujen jälkeen pelaaja saa:

* Gold
* Units
* Items
* Relics
* Skill upgrades
* Tribe unlocks
* New abilities
* Character memories
* Story fragments
* Market upgrades

Pelaaja voi kehittää:

```text
Team
+
Units
+
Synergies
+
Items
+
Relics
+
Tactical Options
```

---

# 33. Unit Progression

Yksiköt voivat kehittyä:

```text
Level 1
↓
Level 2
↓
Level 3
```

Tai:

```text
Base Unit
↓
Specialization
↓
Evolution
```

Esimerkki:

```text
Moss Guard
↓
Ironbark Guardian
↓
Grove Protector
```

Kehitys voi muuttaa:

* kykyä
* rangea
* roolia
* movementia
* synergyjä
* reactioneita
* targetointia
* terrain-affinityä

---

# 34. Unit Build Identity

Jokainen yksikkö tarvitsee taktisen identiteetin.

```text
Unit {
  id
  name
  tribe[]
  role[]
  tags[]
  stats
  movement
  range
  ap
  initiative
  abilities[]
  reactions[]
  passives[]
  synergies[]
  itemAffinities[]
  terrainAffinities[]
  upgradePaths[]
  tacticalIdentity
}
```

Esimerkki:

```text
Ironbark Guardian

Role:
Tank / Protector

Tactical Identity:
Area control and ally protection

Strength:
Hold narrow spaces

Weakness:
Low mobility

Signature:
Rootwall Guard
```

---

# 35. Combat State

```text
CombatState {
  turnNumber
  activeSide
  activeUnit
  units[]
  grid
  terrain[]
  objectives[]
  enemyIntents[]
  activeStatuses[]
  cooldowns
  energy
  tacticalPoints
  combatEvents[]
  victoryConditions[]
  defeatConditions[]
}
```

---

# 36. Action Model

Kaikki taistelutoiminnot tulee kuvata datana.

```text
CombatAction {
  id
  actorId
  actionType
  targetIds[]
  targetTiles[]
  apCost
  energyCost
  range
  area
  effects[]
  conditions[]
  reactions[]
  animationKey
  soundKey
}
```

Mahdolliset actionType-arvot:

```text
MOVE
ATTACK
ABILITY
DEFEND
GUARD
OVERWATCH
INTERACT
USE_ITEM
TEAM_COMMAND
WAIT
RETREAT
```

---

# 37. Event-Driven Combat

Taistelu perustuu tapahtumiin.

```text
UNIT_TURN_STARTED
UNIT_MOVED
UNIT_ATTACK_DECLARED
UNIT_ATTACK_HIT
UNIT_ATTACK_MISSED
ABILITY_CAST
STATUS_APPLIED
STATUS_REMOVED
REACTION_TRIGGERED
UNIT_DEFEATED
OBJECTIVE_UPDATED
ENEMY_INTENT_REVEALED
BOSS_PHASE_CHANGED
TURN_ENDED
COMBAT_WON
COMBAT_LOST
```

Pipeline:

```text
PLAYER ACTION
↓
VALIDATION
↓
ACTION RESOLUTION
↓
GAME EVENTS
↓
STATUS / SYNERGY PROCESSING
↓
REACTIONS
↓
ANIMATION
↓
NEXT TURN
```

---

# 38. Deterministic Combat

Taistelun tulee olla toistettavissa.

```text
Seed
+
Game Version
+
Ruleset Version
+
Combat State
```

tuottaa saman lopputuloksen.

RNG-streamit voidaan erottaa:

* Combat RNG
* Loot RNG
* World RNG
* Event RNG
* Enemy RNG

Tämä mahdollistaa:

* replayt
* debuggaamisen
* combat logit
* tasapainotestit
* challenge seed -tilat

---

# 39. Combat Log

Pelaaja voi avata taistelun tapahtumalokin.

Esimerkiksi:

```text
Turn 3
Guardian moved to B4
Guardian used Guard
Enemy Assassin targeted Healer
Guardian intercepted
Healer applied Regrowth
Poison ticked for 8 damage
```

Combat Log auttaa oppimaan pelin järjestelmiä.

---

# 40. Defeat Analysis

Häviön jälkeen peli kertoo:

* miksi hävisit
* mikä yksikkö kuoli liian aikaisin
* mikä vihollinen oli suurin uhka
* mitä kykyä ei keskeytetty
* missä formation hajosi
* mikä synergy jäi puuttumaan
* mikä counter olisi auttanut

Esimerkki:

```text
DEFEAT ANALYSIS

Main Cause:
Your Healer was exposed.

Secondary Cause:
Enemy Assassin reached the backline.

Suggested Adaptations:
- Add Guard unit
- Use Split Formation
- Keep Healer behind terrain
- Save Interrupt for Assassin
```

Tämä tekee tappiosta oppimiskokemuksen.

---

# 41. Taistelun kesto

Vuoropohjaiset taistelut voivat olla pidempiä kuin auto-battler-taistelut.

Suositellut alkuarvot:

| Encounter          | Vuorot |
| ------------------ | -----: |
| Small Encounter    |    3–6 |
| Normal Encounter   |   5–10 |
| Elite              |   8–15 |
| Tactical Encounter |   8–18 |
| Mini-Boss          |  12–20 |
| Boss               |  15–30 |
| Final Boss         |  20–40 |

Nämä ovat testauksen aloitusarvoja.

Tärkeää:

**Pidempi taistelu ei saa tarkoittaa samaa toimintoa toistettuna 30 kertaa.**

Pitkässä taistelussa pitää tapahtua:

* uusia vaiheita
* muuttuvia tavoitteita
* uusia vihollisia
* terrain-muutoksia
* statusmuutoksia
* bossin käyttäytymisen muutoksia
* uusia taktisia ongelmia

---

# 42. Boss Design

Bossit toimivat vaiheittain.

```text
Phase 1:
Control the arena

Phase 2:
Summon reinforcements

Phase 3:
Corrupt terrain

Phase 4:
Desperation attack
```

Bossilla voi olla:

* näkyvät intentit
* arena mechanics
* destructible parts
* adds
* environmental hazards
* changing objectives
* unique reactions
* anti-build mechanics

Bossin ei pidä olla vain suuri HP-palkki.

---

# 43. World Map ja vuoropohjaisuus

Vuoropohjaisuus ulottuu myös maailmankartalle.

Pelaaja voi käyttää yhden World Turnin:

* liikkumiseen
* scoutingiin
* lepäämiseen
* Marketissa käymiseen
* resurssien keräämiseen
* tapahtuman tutkimiseen
* vihollisen välttämiseen
* NPC:n auttamiseen

Maailma reagoi pelaajan toimintaan.

```text
PLAYER WORLD TURN
↓
ACTION
↓
FOREST RESPONSE
↓
ENEMY / EVENT / WEATHER UPDATE
```

---

# 44. Tactical Exploration

Tutkiminen voi sisältää pieniä taktisia tilanteita:

* piiloutuminen partioilta
* ansan purkaminen
* NPC:n suojaaminen
* resurssin kerääminen
* vaarallisen alueen ylittäminen
* vihollisen väijyttäminen
* vaihtoehtoisen reitin avaaminen

Näin kaikki pelattavuus ei ole taistelua.

---

# 45. Combat Modes

Peli voi sisältää erilaisia taistelutyyppejä:

## Standard Battle

Tapa viholliset.

## Ambush

Pelaaja aloittaa edullisesta asemasta.

## Defense

Pidä alue tietyn vuoromäärän ajan.

## Escort

Suojaa NPC:tä.

## Hunt

Tapa tietty vihollinen ennen kuin se pakenee.

## Survival

Selviä tietty määrä vuoroja.

## Puzzle Battle

Ratkaise ympäristön tai vihollisen mekanismi.

## Boss Battle

Vaiheittainen erikoiskohtaaminen.

---

# 46. Difficulty Scaling

Vaikeus ei kasva vain vihollisen HP:n kautta.

Kasvavat:

* enemy composition
* enemy abilities
* terrain complexity
* objective complexity
* enemy coordination
* status interactions
* boss phases
* enemy reactions
* environmental threats
* tactical pressure

## Story Acts

```text
Act I — Forest Edge
Act II — Deep Woods
Act III — Ancient Grove
Act IV — Corrupted Wild
Act V — Heartwood
```

### Act I

* yksinkertaiset viholliset
* vähän terrainia
* selkeät intentit
* pieni määrä statuksia

### Act II

* role-based enemies
* formation pressure
* basic synergy enemies
* enemmän liikettä

### Act III

* combo enemies
* terrain mechanics
* counterplay
* useita objectiveja

### Act IV

* adaptive AI
* corruption
* complex status chains
* boss mechanics

### Act V

* multi-phase bosses
* advanced synergies
* dynamic terrain
* high tactical pressure

---

# 47. Accessibility

Vuoropohjainen peli antaa mahdollisuuden:

* pause anytime
* undo movement ennen hyökkäystä
* combat speed controls
* readable telegraphs
* colorblind-friendly icons
* larger UI
* reduced animation
* optional damage previews
* optional movement range preview
* optional threat preview
* clear action confirmation

## Undo-sääntö

MVP:ssä voidaan sallia:

* liikkeen peruminen ennen hyökkäystä
* targetin vaihtaminen ennen actionin vahvistamista

Ei sallita:

* jo ratkaistun hyökkäyksen peruuttamista
* vihollisen vuoron peruuttamista
* kuoleman peruuttamista

---

# 48. MVP Combat Scope

Ensimmäinen pelattava prototyyppi sisältää:

## Grid

* 8 × 8 tai 10 × 10 ruudukko
* yksinkertainen terrain
* liikkuminen

## Player Team

* 3–4 yksikköä
* Tank
* DPS
* Support
* Control

## Enemy Team

* 3–5 vihollista
* melee
* ranged
* control
* basic boss

## Actions

* Move
* Attack
* Ability
* Defend
* End Turn

## Systems

* AP
* HP
* Energy
* Cooldown
* Initiative
* Status effects
* Enemy intent
* Combat log
* Victory / Defeat

---

# 49. MVP:n ulkopuolelle

Ensimmäisessä versiossa ei vielä tehdä:

* monimutkaista korkeuserojärjestelmää
* täydellistä destructible terrainia
* 20+ action-tyyppiä
* useita samanaikaisia resursseja
* monimutkaista overwatch-järjestelmää
* 100 yksikön rosteria
* kaikkia tribe-synergioita
* täyttä online-multiplayeria
* liian monimutkaista reaction-ketjua

---

# 50. Toteutusarkkitehtuuri

```text
Hearthwood/
├── combat/
│   ├── CombatEngine
│   ├── TurnManager
│   ├── ActionResolver
│   ├── MovementSystem
│   ├── TargetingSystem
│   ├── AbilitySystem
│   ├── StatusSystem
│   ├── ReactionSystem
│   ├── InitiativeSystem
│   ├── EnemyIntentSystem
│   ├── ObjectiveSystem
│   ├── TerrainSystem
│   └── CombatLog
├── units/
│   ├── UnitDefinitions
│   ├── UnitRuntime
│   ├── UnitAbilities
│   ├── UnitReactions
│   └── UnitProgression
├── builds/
│   ├── BuildAnalyzer
│   ├── BuildArchetypes
│   ├── SynergyEngine
│   ├── FormationSystem
│   └── BuildState
├── world/
│   ├── WorldMap
│   ├── WorldTurn
│   ├── Events
│   ├── Biomes
│   └── WorldState
├── progression/
│   ├── Rewards
│   ├── Market
│   ├── Items
│   ├── Relics
│   └── MetaProgression
└── presentation/
    ├── CombatBoard
    ├── UnitActor
    ├── AbilityPreview
    ├── IntentDisplay
    ├── TurnOrder
    ├── ActionBar
    ├── CombatLog
    └── VictoryDefeat
```

---

# 51. Combat Engine Rules

Combat Enginein vastuulla on:

* vuorojen hallinta
* actionien validointi
* liikkumisen tarkistus
* range-tarkistus
* AP-kustannukset
* cooldownit
* damage
* statukset
* reaktiot
* vihollisen toiminta
* objectivejen päivitys
* victory / defeat

Combat Engine ei saa olla sidottu UI:hin.

```text
Game Logic
    ↓
Combat Events
    ↓
Presentation Layer
```

---

# 52. Player Action Validation

Ennen actionin suorittamista tarkistetaan:

```text
Can Actor Act?
Can Actor Reach Target?
Is Target Valid?
Is Action Off Cooldown?
Does Player Have Enough AP?
Does Player Have Enough Energy?
Is Tile Occupied?
Is Line of Sight Valid?
Does Status Prevent Action?
```

Jos jokin ehto ei täyty, actionia ei suoriteta.

---

# 53. AI Action Evaluation

Enemy AI arvioi mahdollisia toimintoja:

```text
Action Score =
Damage Value
+ Survival Value
+ Objective Value
+ Position Value
+ Synergy Value
+ Threat Value
+ Escape Value
- Risk
```

AI:n ei tarvitse aina valita suurinta damagea.

Se voi esimerkiksi:

* suojata Healeria
* vetäytyä
* pitää chokepointin
* valmistella seuraavaa vuoroa
* käyttää Controlia
* uhrata yksikön
* vaihtaa kohdetta

---

# 54. Strategic Depth Model

Hearthwoodin uusi syvyys syntyy viidestä päätöksestä:

```text
1. BUILD
2. POSITION
3. TARGET
4. TIMING
5. RESOURCE
```

Pelaaja kysyy:

### Build

Mitä strategiaa rakennan?

### Position

Missä yksiköiden pitää olla?

### Target

Mikä vihollinen on tärkein?

### Timing

Milloin kyky käytetään?

### Resource

Käytänkö AP:n, Energyn tai Tactical Pointin nyt?

---

# 55. Pelaajan taitotasot

## Aloittelija

* liikuttaa yksiköitä
* hyökkää
* käyttää peruskykyjä

## Keskitasoinen

* käyttää formationia
* lukee intentit
* suojaa Healeria
* hyödyntää rangea

## Edistynyt

* rakentaa comboja
* käyttää reactioneita
* hallitsee AP:tä
* manipuloida vihollisen reittejä

## Expert

* suunnittelee usean vuoron ketjuja
* käyttää terrainia
* rakentaa hybridisynergioita
* ennakoi vihollisen AI:ta
* uhraa yksiköitä tarkoituksella

---

# 56. Lopullinen pelifilosofia

Hearthwood ei ole enää peli, jossa paras build voittaa automaattisesti.

Uusi periaate:

```text
Good Build
+
Good Position
+
Good Decisions
=
Victory
```

Huono build voi voittaa hyvällä taktiikalla.

Hyvä build voi hävitä huonolla päätöksellä.

Tämä on vuoropohjaisen pelin tärkein lupaus.

---

# 57. Final Game Identity

## Hearthwood

### Turn-Based Tactical Roguelite

> Build your forest team.
> Read the enemy.
> Control the battlefield.
> Make every turn matter.

Suomeksi:

> **Rakenna metsän tiimisi. Lue vihollista. Hallitse taistelukenttää. Tee jokaisesta vuorosta merkityksellinen.**

---

# 58. Seuraava kehitysjärjestys

## Vaihe 1 — Combat Prototype

* ruudukko
* yksiköt
* liikkuminen
* hyökkäys
* vuorot
* HP
* voitto/häviö

## Vaihe 2 — Tactical Layer

* AP
* abilities
* cooldowns
* energy
* targeting
* enemy intent

## Vaihe 3 — Build Layer

* tribes
* roles
* synergies
* formations
* items
* relics

## Vaihe 4 — World Layer

* map
* events
* biomes
* story
* rewards
* Market

## Vaihe 5 — Advanced Combat

* terrain
* reactions
* combos
* objectives
* boss phases
* adaptive AI

---

# 59. MVP Acceptance Criteria

MVP hyväksytään, kun:

* pelaaja voi ohjata vähintään kolmea yksikköä
* yksiköt liikkuvat ruudukolla
* pelaaja voi valita hyökkäyskohteen
* yksiköt toimivat vuorotellen
* vihollinen tekee omat päätöksensä
* AP toimii
* kyvyt toimivat
* HP ja kuolema toimivat
* taistelulla on selkeä voitto- ja häviötila
* vihollisen intentit näkyvät
* pelaaja voi voittaa eri taktiikoilla
* formation vaikuttaa taisteluun
* buildin synergiat vaikuttavat actioneihin
* taistelun tapahtumat näkyvät Combat Logissa
* combat voidaan toistaa samalla seedillä
* UI ei vaadi pelaajalta jatkuvaa mikromanagerointia
* taistelu tuntuu päätöksenteolta eikä pelkältä nappien painamiselta

---

# 60. North Star

```text
BUILD
↓
POSITION
↓
READ
↓
DECIDE
↓
ACT
↓
REACT
↓
ADAPT
↓
MASTER
```

Hearthwoodin lopullinen identiteetti:

> **Pelaaja ei vain rakenna voimakasta joukkuetta.
> Pelaaja oppii käyttämään sitä oikein.**
