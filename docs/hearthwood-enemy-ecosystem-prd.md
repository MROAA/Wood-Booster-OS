> **North-star design doc — the enemy side of the game.** Marc pasted
> this in full on 2026-09-09, right after PR #430 (the economy crew).
> It reframes enemies as **strategic puzzles built from the same parts
> as a player build** (tribe + role + ability + synergy + position +
> targeting + status + economy + adaptation — §1). Core content:
> 12 enemy archetypes (The Swarm / Fortress / Hunters / Rot / Cult /
> Coven / Collectors / Wanderers / Mirror / Brood / Corrupted / Ancients
> — §6–18), specialist / anti-build "soft counter" enemies (§19–20),
> a 6-level enemy-intelligence ladder (basic → role-aware → build-aware →
> counter-aware → adaptive → boss, §25) with a bounded **counter-score**
> so the AI can still make mistakes (§23, §28, §64), enemy synergies +
> formation AI (§26–27), enemy economy / build evolution in later Acts
> (§29–30), a **Rival** that evolves alongside the player across a run
> (§31, §62–63) + a **Nemesis** system (§32), elite modifiers (§34–35),
> encounter/complexity **power budgets** (§72–73), a threat-preview +
> telegraph contract (§50–51), the enemy Codex (§54–56), biome-specific
> ecosystems (§57–58), the fairness rules (§53), and a first-roster
> target (~96 enemy configs, §70). The strategic-enemy-taxonomy (§68 —
> every encounter is a damage / survival / position / targeting / status
> / economy / timing / synergy / adaptation / knowledge check) is the
> quick design lens. It **overlaps and extends** the earlier Act II
> Adaptive Enemy Build AI PRD (docs/hearthwood-adaptive-enemy-build-ai-prd.md
> — the `EnemyAI/` split-brain architecture); treat the two together.
> Slice one system per round behind the fairness gate. Related:
> docs/hearthwood-adaptive-enemy-build-ai-prd.md,
> docs/hearthwood-synergy-tribes-tiers-prd.md,
> docs/hearthwood-unit-roles-build-system-prd.md,
> docs/hearthwood-strategic-foundation-prd.md,
> docs/hearthwood-combat-system-v2-prd.md,
> docs/hearthwood-economy-system-prd.md.

---

# HEARTHWOOD

## PRD — Enemy Ecosystem & Strategic Enemy System

**Genre:** Tactical Auto-Battler / Roguelite / Synergy Builder
**Core Fantasy:** *Cosy tactics with deep synergy.*

---

# 1. Vision

Hearthwoodin viholliset eivät ole pelkkiä esteitä pelaajan etenemiselle.

Ne ovat **strategisia pulmia**.

Jokainen merkittävä vihollinen, vihollisryhmä ja boss rakentuu samalla filosofialla kuin pelaajan build:

```text
TRIBE
+
ROLE
+
ABILITY
+
SYNERGY
+
POSITION
+
TARGETING
+
STATUS
+
ECONOMY
+
ADAPTATION
=
ENEMY BUILD
```

Vihollisen tarkoitus ei ole vain tehdä vahinkoa.

Sen tarkoitus on kysyä pelaajalta:

> **"Miten aiot ratkaista tämän?"**

---

# 2. Enemy Design Pillars

Jokaisen merkittävän vihollisen tulee täyttää vähintään kolme seuraavista:

* selkeä identiteetti
* oma taistelutapa
* strateginen uhka
* selkeä heikkous
* counterplay
* synergia muiden vihollisten kanssa
* positionaalinen merkitys
* pelaajan buildiin reagoiva käyttäytyminen
* kiinnostava ability
* mahdollisuus yllättää pelaaja ilman epäreiluutta.

---

# 3. Enemy Categories

Hearthwood tarvitsee useita viholliskategorioita.

```text
COMMON
ELITE
SPECIALIST
TACTICAL
SYNERGY
ADAPTIVE
EVENT
MINI-BOSS
BOSS
LEGENDARY
```

---

# 4. Common Enemies

Common-vihollisten tehtävä on opettaa yksi selkeä idea.

Esimerkiksi:

### Thornling

**Role:** Bruiser

```text
High Armor
Low Damage
Thorn retaliation
```

Opettaa:

> Älä lyö tätä yksikköä ajattelematta.

---

### Sporeling

**Role:** Debuffer

```text
Applies Poison
Splits on death
```

Opettaa:

> Death trigger voi olla uhka.

---

### Frost Mite

**Role:** Control

```text
Applies Slow
Low HP
```

Opettaa:

> Pieni vihollinen voi olla tärkeämpi kuin iso.

---

# 5. Enemy Roles

Vihollisilla tulee olla samat perusroolit kuin pelaajalla.

```text
Tank
Bruiser
DPS
Assassin
Healer
Support
Control
Debuffer
Summoner
Artillery
Disruptor
Economy
```

Mutta viholliset voivat yhdistellä rooleja.

Esimerkiksi:

```text
Tank + Control
Assassin + Debuffer
Healer + Summoner
Artillery + Disruptor
Support + Economy
```

---

# 6. Enemy Archetypes

Vihollisen **archetype** määrittää sen strategisen identiteetin.

Ensimmäinen rosteri:

```text
THE SWARM
THE FORTRESS
THE HUNTERS
THE ROT
THE CULT
THE COVEN
THE COLLECTORS
THE WANDERERS
THE MIRROR
THE BROOD
THE CORRUPTED
THE ANCIENTS
```

---

# 7. THE SWARM

Swarm-buildin idea:

> Yksittäinen vihollinen ei ole vaarallinen. Yhdessä ne ovat.

Mekaniikat:

* pieni HP
* suuri määrä yksiköitä
* summonit
* death triggers
* adjacency
* stacking bonuses.

Esimerkki:

```text
3 Swarm units
→ +10% attack speed

6 Swarm units
→ deaths summon larvae
```

Counter:

* AOE
* chain attacks
* splash
* anti-summon.

---

# 8. THE FORTRESS

Fortress rakentaa puolustuslinjan.

```text
Tank
Tank
Support
Healer
Artillery
```

Mekaniikat:

* shields
* guard
* taunt
* healing
* armor
* damage reduction.

Heikkous:

* anti-heal
* armor break
* backline pressure
* sustained damage.

---

# 9. THE HUNTERS

Hunter-viholliset metsästävät heikkoja kohteita.

Mekaniikat:

* target priority
* marks
* mobility
* execute
* flanking.

Esimerkiksi:

```text
Hunter:
targets lowest HP.

Tracker:
marks target.

Alpha:
deals bonus damage to marked target.
```

Pelaajan pitää suojella:

> healeria, carrya ja heikkoa backlinea.

---

# 10. THE ROT

Rot-build käyttää:

* Poison
* Decay
* Disease
* Death
* Spread.

Core loop:

```text
Poison
↓
Decay
↓
Death
↓
Spore
↓
New Poison
```

Counter:

* cleanse
* resistance
* burst
* death prevention.

---

# 11. THE CULT

Cult-viholliset käyttävät rituaaleja.

Niiden voima tulee:

```text
Ritual
+
Sacrifice
+
Channeling
```

Esimerkki:

```text
Cultist:
channels Ritual.

Sacrifice:
kills ally.

Ritual:
empowers remaining enemies.
```

Pelaaja voi:

* keskeyttää ritualin
* tappaa cultistin
* tappaa sacrificen kohteen
* tappaa ritualin vahvistaman yksikön.

---

# 12. THE COVEN

Coven käyttää keskinäisiä linkkejä.

Esimerkiksi:

```text
Witch A
   ↕
Witch B
   ↕
Witch C
```

Jos yksi kuolee:

```text
remaining witches gain Curse.
```

Jos kaikki kolme ovat elossa:

```text
Hex Network active.
```

Tämä luo:

> "Kenet tapan ensin?"

---

# 13. THE COLLECTORS

Collector-viholliset varastavat pelaajan resursseja.

He voivat vaikuttaa:

* Goldiin
* Shieldiin
* Energyyn
* buffs
* relic charges
* temporary resources.

Esimerkiksi:

### Coin Thief

```text
Every 10 seconds:
steal 1 Gold from run economy.
```

Taistelussa tämä voi näkyä erillisenä:

```text
THREAT:
ECONOMIC
```

Pelaajan kannattaa tappaa se nopeasti.

---

# 14. THE WANDERERS

Wanderer-viholliset muuttavat formationia.

Mekaniikat:

* movement
* knockback
* forced movement
* teleport
* displacement.

Ne rikkovat pelaajan suunnitellun formationin.

Counter:

* anchor
* root
* resistance
* flexible positioning.

---

# 15. THE MIRROR

Mirror-viholliset jäljittelevät pelaajaa.

Ne voivat käyttää:

* pelaajan tribeja
* statusvaikutuksia
* formation-tyyppiä
* yksikkörooleja.

Esimerkiksi:

```text
Player:
4 Rootborn

Mirror:
creates Rootborn counter-build.
```

Tärkeää:

Mirror ei saa kopioida pelaajan kaikkia yksiköitä suoraan.

Sen sijaan:

> se kopioi pelaajan **strategisen idean**.

---

# 16. THE BROOD

Brood rakentuu yhden äitiyksikön ympärille.

```text
BROOD MOTHER
     ↓
EGGS
     ↓
LARVAE
     ↓
WORKERS
```

Jos Mother kuolee:

```text
Brood destabilizes.
```

Jos Mother pysyy hengissä:

```text
summons continue.
```

Pelaaja joutuu valitsemaan:

> tappaa swarm vai Mother?

---

# 17. THE CORRUPTED

Corrupted-viholliset muuttavat taistelukenttää.

Mekaniikat:

* corrupted terrain
* spreading corruption
* debuffs
* status transformation.

Esimerkiksi:

```text
Corrupted Ground
→ healing -25%

After 10 sec:
spreads to adjacent tile.
```

Pelaaja voi joutua vaihtamaan formationia kesken taistelun.

---

# 18. THE ANCIENTS

Ancients ovat hitaita mutta erittäin voimakkaita.

Niiden suunnittelu perustuu:

```text
TELEGRAPH
+
CHARGE
+
PAYOFF
```

Esimerkiksi:

```text
Ancient Oak
starts charging:

ROOTFALL

3 turns

If uninterrupted:
massive AOE
```

Pelaajan pitää valmistautua.

---

# 19. Enemy Specialists

Specialist-viholliset ovat pieniä mutta erittäin tarkoituksellisia.

Esimerkiksi:

### Silence Weaver

Target:

> Ability-dependent carry.

---

### Shieldbreaker

Target:

> Shield-heavy builds.

---

### Plague Bearer

Target:

> Healing builds.

---

### Backstabber

Target:

> Backline.

---

### Disruptor

Target:

> Formation-dependent builds.

---

# 20. Anti-Build Enemies

Hearthwoodin viholliset voivat sisältää **soft countereita**.

Esimerkiksi:

```text
Player has:
Heavy Healing

Enemy:
Plague Doctor

Effect:
Anti-Heal
```

Mutta:

```text
Healing is NOT disabled.
```

Se vain muuttuu vaikeammaksi.

---

# 21. Build Recognition

Enemy AI analysoi pelaajan buildia.

```text
BUILD ANALYSIS

Healing: HIGH
AOE: LOW
Frontline: HIGH
Backline: HIGH
Control: LOW
Economy: MEDIUM
```

Tämän perusteella vihollinen valitsee taktisen painotuksen.

---

# 22. Enemy Adaptation

Enemy voi adaptoitua kierrosten välillä.

```text
Encounter 1
↓
Enemy observes
↓
Player wins
↓
Enemy adapts
↓
Encounter 2
```

Esimerkiksi:

```text
Player repeatedly protects carry.

Enemy:
introduces flank attacker.
```

---

# 23. Adaptation Limits

Enemy ei saa täydellisesti counterata pelaajaa.

AI käyttää:

```text
COUNTER SCORE
```

Esimerkiksi:

```text
Healing Counter: 0.72
Backline Counter: 0.41
AOE Counter: 0.18
```

Se valitsee vaihtoehdon strategisesti.

Näin vihollinen voi tehdä virheitä.

---

# 24. Enemy Personalities

Vihollisilla on persoonallisuus.

Esimerkiksi:

### Aggressive

```text
High risk
Fast attacks
Backline pressure
```

### Defensive

```text
Shield
Healing
Scaling
```

### Opportunistic

```text
Targets weak units
```

### Experimental

```text
Unusual builds
```

### Relentless

```text
Does not retreat
```

### Cautious

```text
Protects important units
```

---

# 25. Enemy Intelligence Levels

Kaikkien vihollisten ei tarvitse olla älykkäitä.

```text
LEVEL 1
Basic

LEVEL 2
Role-aware

LEVEL 3
Build-aware

LEVEL 4
Counter-aware

LEVEL 5
Adaptive

LEVEL 6
Boss AI
```

Näin vaikeus kasvaa luonnollisesti.

---

# 26. Enemy Synergy

Vihollisilla on omat synergyt.

Esimerkiksi:

```text
2 Hunters
→ Mark

4 Hunters
→ Mark spreads

6 Hunters
→ Marked targets cannot escape
```

Tai:

```text
2 Rot
→ Poison

4 Rot
→ Decay

6 Rot
→ Death creates Spore
```

Vihollisen build voi siis olla aivan oikea build.

---

# 27. Enemy Formation AI

Enemy AI päättää formationin.

Se arvioi:

```text
Threat
Range
Target Priority
Synergy
Protection
Terrain
Boss Mechanics
```

Esimerkiksi:

```text
Carry protected
Healer protected
Tank frontline
Assassin flank
```

---

# 28. Formation Mistakes

Enemy ei aina löydä optimaalista formationia.

Esimerkiksi:

```text
Enemy AI confidence:
78%
```

Jos pelaaja löytää vihollisen heikon formationin:

> pelaaja saa strategisen edun.

Tämä tekee scoutingista kiinnostavaa.

---

# 29. Enemy Economy

Myöhemmissä acteissa vihollisilla voi olla oma economy.

Enemy voi:

* ostaa yksiköitä
* upgradea
* rerollata
* vaihtaa formationia
* käyttää resources
* valmistautua bossiin.

Pelaaja voi joskus nähdä tämän prosessin.

---

# 30. Enemy Build Evolution

Vihollisen build voi muuttua.

Esimerkiksi:

```text
START:
Swarm

MID:
Poison Swarm

LATE:
Poison + Death + Summon
```

Tämä tekee vihollisesta "elävän".

---

# 31. Rival Enemies

Runissa voi olla yksi erityinen kilpailija.

```text
RIVAL
```

Rival:

* kehittyy pelaajan mukana
* käyttää omaa buildia
* ilmestyy useita kertoja
* oppii aiemmista taisteluista.

Ensimmäinen kohtaaminen:

> helppo.

Toinen:

> tunnistaa pelaajan.

Kolmas:

> vastaa pelaajan strategiaan.

Final:

> täysi build-vs-build.

---

# 32. Nemesis System

Jos pelaaja häviää tietylle viholliselle:

```text
Nemesis created.
```

Vihollinen voi esiintyä myöhemmin uudelleen.

Jos pelaaja voittaa sen:

```text
Nemesis defeated.
```

Reward voi olla:

* relic
* lore
* cosmetic
* special event
* shortcut.

---

# 33. Elite Enemies

Eliteillä on yksi ylimääräinen sääntö.

Esimerkiksi:

### Thorn Guardian

```text
Normal:
Tank

Elite:
Every blocked hit grows Thorn stacks.
```

### Spore Witch

```text
Normal:
Poison

Elite:
Poisoned units spread Poison on attack.
```

Elite = tuttu vihollinen + uusi strateginen kysymys.

---

# 34. Elite Modifiers

Elite voi saada yhden tai kaksi modifieria.

```text
Reinforced
Volatile
Cursed
Hungry
Swift
Regenerating
Enraged
Corrupted
Ancient
```

Modifierit muuttavat taistelua.

---

# 35. Elite Combination System

Esimerkiksi:

```text
SWIFT + ASSASSIN
```

tai:

```text
REGENERATING + FORTRESS
```

tai:

```text
VOLATILE + SWARM
```

Yhdistelmien pitää olla testattuja.

---

# 36. Ambush Encounters

Jotkin encounterit eivät ala normaalisti.

Esimerkiksi:

```text
AMBUSH
```

Vihollinen aloittaa sivusta.

Tai:

```text
TRAP
```

yksi ruutu on vaarallinen.

Tai:

```text
HIDDEN ENEMY
```

vihollinen paljastuu myöhemmin.

---

# 37. Reinforcement System

Joissain taisteluissa vihollisia saapuu vaiheittain.

```text
Wave 1
↓
Wave 2
↓
Elite
↓
Boss
```

Tämä testaa:

* sustainia
* AOE:ta
* resource managementia
* target prioritya.

---

# 38. Summon Economy

Summonit eivät saa olla ilmaista lisä-HP:tä.

Niillä voi olla:

```text
Summon Cost
Summon Limit
Summon Lifetime
Summon Purpose
```

Summon voi esimerkiksi:

* tankata
* räjähtää
* levittää Poisonia
* kerätä threatia
* suojata casteria.

---

# 39. Sacrifice Enemies

Jotkut viholliset käyttävät toisia vihollisia resurssina.

Esimerkiksi:

```text
Sacrificer
+
3 Cultists
```

Sacrificer tappaa Cultistin:

```text
Cultist dies
→ Boss gains power.
```

Pelaaja voi estää tämän tappamalla Sacrificerin.

---

# 40. Puzzle Enemies

Jotkut viholliset ovat enemmän puzzle kuin DPS-check.

Esimerkiksi:

### The Three Bells

Kolme vihollista:

```text
Bell of Frost
Bell of Fire
Bell of Roots
```

Väärässä järjestyksessä tappaminen:

> aktivoi voimakkaan efektin.

Oikea järjestys:

> avaa heikkouden.

---

# 41. Split Enemies

Jotkin viholliset jakautuvat.

```text
Mother
↓
2 Sons
↓
4 Larvae
```

Pelaajan pitää päättää:

> burst alkuperäinen vihollinen vai hallita splitit?

---

# 42. Transforming Enemies

Vihollinen voi muuttua kesken taistelun.

```text
Beast
↓
Wounded
↓
Enraged
↓
Ancient Form
```

Pelaajan strategia voi joutua muuttumaan.

---

# 43. Conditional Death

Jotkut viholliset eivät kuole normaalisti.

Esimerkiksi:

```text
Immortal while Totem exists.
```

Pelaajan pitää tuhota:

```text
Totem
→ Shield
→ Enemy
```

Tämä luo target priority -pulman.

---

# 44. Protection Chains

Viholliset voivat suojata toisiaan.

```text
Guardian
↓
Protects
↓
Healer
↓
Protects
↓
Artillery
```

Pelaaja voi yrittää:

* murtaa ketjun
* ohittaa frontline
* tappaa supportin
* käyttää AOE:ta.

---

# 45. Threat Traps

Jotkin viholliset haluavat tulla hyökätyiksi.

Esimerkiksi:

### Thorn Mimic

```text
When targeted:
gains damage reflection.
```

Tämä tekee targetoinnista taktisen päätöksen.

---

# 46. Bait Enemies

Bait-vihollinen näyttää tärkeältä mutta ei ole.

Esimerkiksi:

```text
High DPS
Low HP
```

Pelaaja voi käyttää paljon resursseja sen tappamiseen samalla kun oikea threat valmistautuu.

---

# 47. Priority Enemies

Jotkin viholliset on suunniteltu herättämään kysymys:

> "Kuka pitäisi tappaa ensin?"

Tämä on yksi Hearthwoodin tärkeimmistä combat-päätöksistä.

---

# 48. Enemy Tags

Enemyillä tulee olla tagit:

```text
Beast
Spirit
Plant
Undead
Fungal
Cultist
Construct
Ancient
Corrupted
Insect
Elemental
Humanoid
```

Tagit voivat vaikuttaa:

* relicien toimintaan
* itemeihin
* eventteihin
* damageen
* statusreaktioihin.

---

# 49. Enemy Affinities

Jokaisella vihollisella voi olla:

```text
Strong Against
Weak Against
Neutral Against
```

Esimerkiksi:

```text
Frost Warden

Strong:
Slow resistance

Weak:
Burn

Neutral:
Poison
```

Tämä näkyy pelaajalle osittain.

---

# 50. Telegraph System

Vahvat vihollisabilityt ilmoitetaan etukäteen.

```text
WARNING

ANCIENT ROOTFALL

Incoming in:
2.0 sec
```

Pelaaja tietää:

> mitä tapahtuu.

Hän ei aina tiedä:

> miten täydellisesti vastata siihen.

---

# 51. Threat Preview

Ennen encounteria:

```text
ENEMY THREAT

★★★★★

Primary:
Control

Secondary:
Backline Pressure

Expected:
AOE
Freeze
Displacement
```

Tämä auttaa suunnittelussa.

---

# 52. Enemy Counterplay Matrix

Hearthwoodin sisäinen data tarvitsee counter-matriisin.

```text
Enemy Mechanic
→ Counter Types
→ Counter Strength
→ Counter Availability
```

Esimerkiksi:

```text
Poison
→ Cleanse
→ Resistance
→ Burst
→ Death Prevention
```

---

# 53. Enemy Fairness Rules

Vihollinen ei saa:

* tehdä mahdotonta damagea ilman telegraphia
* counterata täydellisesti jokaista buildia
* saada näkymätöntä resurssietua
* käyttää pelaajalle näkymättömiä sääntöjä
* rikkoa pelin perussääntöjä ilman että kyseessä on tarkoituksellinen boss-mekaniikka.

---

# 54. Enemy Discovery

Uuden vihollisen ensimmäinen kohtaaminen:

```text
UNKNOWN
```

Pelaaja näkee vain perustiedot.

Taistelun jälkeen:

```text
DISCOVERED
```

Codexiin avautuu:

* abilityt
* role
* tags
* weaknesses
* known interactions.

---

# 55. Enemy Codex

Codex:

```text
ENEMIES

Common
Elite
Specialist
Boss
Legendary
```

Jokaisesta:

```text
Identity
Role
Mechanics
Weakness
Counterplay
Lore
Known Synergies
```

---

# 56. Enemy Lore

Viholliset eivät ole vain gameplay-objekteja.

Esimerkiksi:

> **Spore Witch**

Entinen metsän parantaja, joka oppi käyttämään myceliumia parantamisen sijaan muistojen säilyttämiseen.

Gameplay:

```text
Heal
Poison
Memory
Death
```

Lore tukee mekaniikkaa.

---

# 57. Biome-Specific Enemy Ecosystems

Jokaisella biomella on oma vihollisekosysteeminsä.

## Autumnwood

* beasts
* thorn creatures
* scavengers
* ancient forest spirits

## Frostroot

* frost beasts
* frozen spirits
* ice constructs
* preservation cults

## Sunspire

* radiant creatures
* guardians
* solar spirits
* zealots

## Mirefall

* fungal creatures
* corrupted beasts
* swamp spirits
* poison cults.

---

# 58. Enemy Ecosystem

Viholliset voivat myös olla suhteessa toisiinsa.

Esimerkiksi:

```text
Predator
hunts
Swarm

Swarm
feeds
Rot

Rot
corrupts
Forest

Forest
creates
Ancients
```

Näin biome tuntuu ekosysteemiltä.

---

# 59. Enemy Event Integration

Vihollinen voi esiintyä myös eventissä.

Esimerkiksi:

```text
You find an injured Hunter.
```

Pelaaja voi:

```text
Help
Ignore
Recruit
Steal
```

Valinta voi vaikuttaa tuleviin encountereihin.

---

# 60. Enemy Recruitment

Harvinaisissa tilanteissa vihollinen voidaan muuttaa liittolaiseksi.

Esimerkiksi:

```text
Defeat + Spare
```

→ enemy becomes temporary unit.

Tai:

```text
Complete Enemy Quest
```

→ unlock alternative unit.

---

# 61. Enemy Reputation

Jotkin vihollisryhmät voivat reagoida pelaajan toimintaan.

```text
Cult Reputation
Forest Reputation
Mire Reputation
Ancient Reputation
```

Tämä voi muuttaa:

* encountereita
* eventtejä
* bossia
* shoppeja
* lorea.

---

# 62. Rival Build System

Erityiset rivalit käyttävät samaa build engineä kuin pelaaja.

```text
RIVAL
 ↓
SEED
 ↓
PERSONALITY
 ↓
TRIBE
 ↓
ROLE
 ↓
SHOP
 ↓
UPGRADE
 ↓
SYNERGY
 ↓
POSITION
 ↓
COMBAT
 ↓
ADAPTATION
```

Rivalin build voi siis oikeasti kehittyä.

---

# 63. Enemy Memory

Rival voi muistaa:

```text
Player Healing
Player Carry
Player Formation
Player Favorite Tribe
Player Counter
```

Esimerkiksi:

> "Viimeksi pelaaja suojasi carryaan kolmella tankilla."

Seuraavalla kerralla:

```text
Flanker probability +25%
```

---

# 64. Enemy Mistakes

Vihollinen voi tehdä virheitä.

Tämä on tärkeää.

Esimerkiksi:

```text
AI chooses:
High-risk attack
```

ja epäonnistuu.

Pelaaja saa kokemuksen:

> "Vihollinen yritti flankata, mutta formationini esti sen."

Vihollinen tuntuu älykkäältä mutta ei täydelliseltä.

---

# 65. Enemy Difficulty

Vaikeutta ei kasvateta pelkästään:

```text
HP × 5
Damage × 3
```

Sen sijaan:

```text
More Roles
+
Better Synergies
+
Better Positioning
+
Better Targeting
+
Better Adaptation
+
More Complex Mechanics
```

---

# 66. Encounter Composition

Yksi encounter voi koostua:

```text
1 Tank
1 Support
2 DPS
1 Specialist
```

Mutta tärkeää on niiden välinen suhde.

Esimerkiksi:

```text
Tank
protects
Healer

Healer
supports
Carry

Assassin
hunts
Healer
```

Tämä muodostaa viholliselle oman "pienen strategian".

---

# 67. Enemy Build Readability

Pelaajan pitää pystyä lukemaan vihollinen.

Visuaalisesti:

```text
TRIBE ICON
ROLE ICON
THREAT
STATUS
SYNERGY
```

Pelaaja voi nopeasti nähdä:

> "Tämä on Fortress."

tai:

> "Tämä on Swarm + Poison."

---

# 68. Strategic Enemy Taxonomy

Kaikki viholliset voidaan lopulta luokitella niiden aiheuttaman ongelman mukaan:

```text
DAMAGE CHECK
SURVIVAL CHECK
POSITION CHECK
TARGETING CHECK
STATUS CHECK
ECONOMY CHECK
TIMING CHECK
SYNERGY CHECK
ADAPTATION CHECK
KNOWLEDGE CHECK
```

Hyvä encounter testaa pääasiassa yhtä tai kahta.

Boss voi testata useampaa.

---

# 69. Enemy Design Formula

```text
IDENTITY
+
THREAT
+
COUNTER
+
SYNERGY
+
TELEGRAPH
+
PLAYER DECISION
=
GOOD ENEMY
```

---

# 70. Enemy Roster Target

Ensimmäinen pelattava sisältö:

```text
30 Common Enemies
15 Specialist Enemies
12 Elite Variants
10 Tactical Enemies
8 Synergy Groups
6 Mini-Bosses
8 Major Bosses
4 Legendary Encounters
3 Rival Characters
```

Yhteensä:

```text
96+ Enemy Configurations
```

Koska modifierit, formationit, synergyt ja biome-muutokset voivat yhdistellä niitä, todellinen encounter-variaatioiden määrä on huomattavasti suurempi.

---

# 71. Enemy Generation

Enemyjä ei luoda täysin satunnaisesti.

Generator käyttää:

```text
Biome
+
Act
+
Enemy Archetype
+
Difficulty
+
Seed
+
Player Build
+
Encounter Budget
```

Esimerkiksi:

```text
Mirefall
Act II
Rot
High Healing Player
Elite
```

voi generoida:

```text
Rot Mother
2 Sporelings
Plague Carrier
Mire Cultist
```

---

# 72. Encounter Budget

Jokaisella encounterilla on power budget.

```text
Enemy Power Budget = 100
```

Se jaetaan:

```text
HP
Damage
Control
Healing
Utility
Synergy
Complexity
```

Näin encounterit voidaan tasapainottaa systemaattisesti.

---

# 73. Complexity Budget

Myös pelaajan kohtaaman strategisen kompleksisuuden pitää olla rajattu.

Early game:

```text
1 mechanic
```

Mid game:

```text
2–3 mechanics
```

Late game:

```text
3–5 mechanics
```

Boss:

```text
5+
```

Mutta vain jos ne ovat selkeästi esitettyjä.

---

# 74. Encounter Pacing

Hearthwood ei saa olla jatkuvaa maksimaalista stressiä.

Pacing:

```text
Easy
↓
Learning
↓
Challenge
↓
Reward
↓
Recovery
↓
Elite
↓
Boss
```

Viholliset osallistuvat rytmiin.

---

# 75. Final Enemy Design Principle

Hearthwoodin vihollisen ei pitäisi herättää tunnetta:

> "Tuo on vain vahvempi monsteri."

Sen pitäisi herättää:

> **"Ahaa. Tämä on ongelma, joka minun täytyy ratkaista."**

Ja parhaassa tapauksessa:

> **"Minulla on idea."**

---

# 76. North Star

Hearthwoodin täydellinen vihollinen toimii näin:

```text
PLAYER SEES ENEMY
        ↓
UNDERSTANDS THREAT
        ↓
FORMULATES PLAN
        ↓
ADAPTS BUILD
        ↓
POSITIONS TEAM
        ↓
COMBAT
        ↓
LEARNS RESULT
        ↓
BECOMES BETTER
```

Vihollinen ei siis ole vain este.

**Vihollinen on Hearthwoodin tapa opettaa strategiaa.**
