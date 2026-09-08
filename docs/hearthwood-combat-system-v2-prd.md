> **North-star design doc — multi-round.** Marc pasted this in full during the
> *positioning-as-a-role-mechanic* round (shipped as PR #422). It is the umbrella
> combat vision that the earlier *Unit Roles / Build System* and *Adaptive Enemy
> Build AI* PRDs feed into. It is **not** a single build target: it is sliced one
> mechanic per round, each behind the fairness gate. Already shipped toward it:
> role & tag identity model (`roles.js` `unitProfile`, PR #420), build-evaluation
> panel (`buildScore.js`, PR #421), positioning as a battle-start bonus
> (`positionFitForSlot` / `POSITION_BONUS`, PR #422). Still open: threat/taunt
> targeting, per-DPS target profiles, the ability/energy/cooldown system,
> interrupt, status stacking + breakpoints + interactions, damage types &
> resistances, the 3×3 grid + formation archetypes/counterplay, comeback
> mechanics, the event-driven data-driven combat core, and the headless
> `CombatSimulator`.

---

# HEARTHWOOD

## Strategic Combat System V2

### Monipuolinen, taktinen ja synergiapohjainen Auto-Battler Combat

**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy
**Core Identity:** *Cosy tactics with deep synergy*
**Combat Philosophy:** *The player creates the strategy. The battle executes it.*

---

# 1. VISION

Hearthwoodin taistelun pitää tuntua enemmän kuin kahden stat-listan törmäykseltä.

Taistelussa pitää syntyä tilanteita, joissa:

* Tank suojaa Carrya
* Healer yrittää pitää frontlinen hengissä
* Assassin pääsee vihollisen backlineen
* Control pysäyttää vaarallisen vihollisen
* Debuffer valmistaa kohteen DPS:n tuhottavaksi
* Support vahvistaa koko buildin toimintaa
* positioning muuttaa taistelun lopputuloksen
* abilityjen ajoitus ratkaisee tilanteen
* vihollisen build vaatii erilaisen vastauksen
* sama build voi toimia eri tavalla eri vihollista vastaan

Taistelun tavoitteena ei ole lisätä mahdollisimman paljon mekaniikkoja.

Tavoitteena on tehdä jokaisesta taistelusta:

> **ymmärrettävä mutta vaikeasti optimoitava strateginen ongelma.**

---

# 2. CORE COMBAT LOOP

```text
BUILD
  ↓
POSITION
  ↓
PREDICT
  ↓
COMBAT
  ↓
OBSERVE
  ↓
RESULT
  ↓
ADAPT
  ↓
NEXT COMBAT
```

Pelaaja ei normaalisti ohjaa yksiköitä taistelun aikana.

Pelaaja ohjaa:

* mitä yksiköitä käytetään
* niiden upgradeja
* niiden tuotteita
* niiden positioningiä
* buildin synergioita
* targetointisääntöjä
* strategisia prioriteetteja

---

# 3. COMBAT PHASES

Taistelu jaetaan kolmeen strategiseen vaiheeseen.

## OPENING

Ensimmäiset sekunnit.

Tärkeitä:

* positioning
* first attacks
* shields
* taunt
* assassin opening
* control
* opening abilities

---

## MID COMBAT

Buildin varsinainen engine käynnistyy.

Tärkeitä:

* synergiat
* cooldownit
* healing
* debuffit
* stacking
* target vaihtuminen
* energy/mana
* frontline pressure

---

## ENDGAME

Kun yksiköitä on kuollut.

Tärkeitä:

* carry survival
* execute
* scaling
* last stand
* comeback mechanics
* remaining resources

---

# 4. UNIT COMBAT ROLES

Combat rakentuu aikaisemmin määriteltyjen roolien päälle.

## Primary Roles

* Tank
* DPS
* Healer
* Support
* Control
* Debuffer

## Secondary Roles

* Assassin
* Summoner
* Economy
* Bruiser
* Artillery
* Disruptor

Yksikön rooli vaikuttaa sen:

* targetointiin
* positioning-suositukseen
* abilityihin
* threatiin
* upgradeihin
* tuotteisiin
* synergioihin.

---

# 5. TANK SYSTEM

Tank ei ole vain suuri HP-palkki.

Tankilla on:

### Threat

Vihollisen huomio.

### Protection

Muiden yksiköiden suojaaminen.

### Mitigation

Vahingon pienentäminen.

### Control

Vihollisten pakottaminen tiettyyn käyttäytymiseen.

### Frontline Presence

Taistelulinjan hallinta.

---

# 6. THREAT SYSTEM

Hearthwoodiin rakennetaan näkyvä/taustalla toimiva Threat-järjestelmä.

Jokaisella yksiköllä on:

```text
Threat
```

Vihollinen arvioi:

* damage
* healing
* control
* proximity
* taunt
* recent actions

Threat vaikuttaa targetointiin.

Esimerkiksi:

```text
Player:

Tank       Threat 80
DPS        Threat 45
Healer     Threat 65
Support    Threat 30
```

Vihollinen pyrkii ensisijaisesti hyökkäämään Tankia vastaan, ellei jokin muu mekaniikka muuta targetointia.

---

# 7. TAUNT

Taunt ei ole täydellinen mind control.

Taunt luo:

```text
Target Priority Modifier
```

Tämä mahdollistaa:

* taunt resistance
* redirect
* ignore-taunt
* target swap
* assassination

---

# 8. HEALING SYSTEM

Healing jaetaan eri käyttäytymisiin.

### Direct Heal

Parantaa heti.

### Heal Over Time

Parantaa ajan kanssa.

### Reactive Heal

Aktivoituu kun HP laskee.

### Chain Heal

Siirtyy kohteesta toiseen.

### Shield Heal

Muuttaa osan healingistä shieldiksi.

### Sacrifice Heal

Healer käyttää omaa HP:tään.

---

# 9. HEALING STRATEGY

Healer ei automaattisesti paranna lähintä tai heikointa yksikköä.

Heal target arvioidaan:

```text
Missing HP
+
Role Importance
+
Death Risk
+
Future Value
+
Position
```

Esimerkiksi:

```text
Tank HP 40%
DPS HP 30%

Tank is protecting entire team.

Heal Tank.
```

---

# 10. DPS SYSTEM

DPS jaetaan käyttäytymisen mukaan.

### Burst

Suuri vahinko lyhyessä ajassa.

### Sustained

Tasainen vahinko.

### Execute

Vahva matalan HP:n kohteita vastaan.

### AOE

Useita kohteita vastaan.

### DoT

Damage over Time.

### Assassin

Backline / high-value target.

### Artillery

Pitkän matkan damage.

---

# 11. TARGET PRIORITY

Jokaisella DPS-yksiköllä voi olla target profile.

Esimerkiksi:

```text
Assassin:

Healer > Support > DPS > Tank
```

```text
Executioner:

Low HP > Normal target
```

```text
Tank Breaker:

Highest Armor > Tank > Others
```

---

# 12. TARGETING STRATEGY

Yksikön targetointi voidaan määritellä:

```text
Preferred Target
+
Target Conditions
+
Fallback Target
```

Esimerkiksi:

```text
Preferred:
Enemy Healer

Condition:
Healer visible

Fallback:
Lowest HP enemy
```

Tämä tekee AI-taistelusta paljon kiinnostavamman.

---

# 13. POSITIONING

Positioning on yksi Hearthwoodin tärkeimmistä strategisista järjestelmistä.

Board:

```text
[ FRONT ][ FRONT ][ FRONT ]

[ MID   ][ MID   ][ MID   ]

[ BACK  ][ BACK  ][ BACK  ]
```

Sijoittelu vaikuttaa:

* targetointiin
* abilityihin
* AOE:hen
* suojaamiseen
* rangeen
* synergioihin
* movementiin.

---

# 14. ADJACENCY

Jotkin abilityt toimivat viereisiin yksiköihin.

Esimerkiksi:

```text
Tank
+
Support
+
Healer
```

voi luoda vahvan defensive clusterin.

Mutta:

```text
Enemy AOE
```

voi rangaista liian tiivistä muodostelmaa.

---

# 15. FORMATION ARCHETYPES

Pelaajalle tarjotaan mahdollisuus rakentaa erilaisia muodostelmia.

### WALL

```text
T T T
S H S
D D D
```

### SPEAR

```text
T
T S
  D D
```

### PROTECTED CARRY

```text
T T T
S H S
D C D
```

### SPLIT

```text
T       T

D   H   D

S       C
```

---

# 16. FORMATION COUNTERPLAY

Vihollinen voi vastata formationiin.

Esimerkiksi:

```text
Player:
T T T
S H S
D D D
```

Enemy:

```text
AOE attacker
```

→ rikkoo tiiviin formationin.

Tai:

```text
Player:
Backline Carry
```

→ Enemy Assassin yrittää kiertää frontlinea.

---

# 17. RANGE

Yksiköillä on range.

Range vaikuttaa:

* targetteihin
* turvallisuuteen
* positioningiin
* movementiin
* attack frequencyyn.

Ranged DPS ei automaattisesti ole parempi.

Sen heikkous voi olla:

* low HP
* vulnerable backline
* low damage when pressured.

---

# 18. MOVEMENT

Combatissa voi tapahtua automaattista movementia.

Esimerkiksi:

* charge
* retreat
* leap
* dash
* knockback
* pull
* reposition

Movement ei tee pelistä manuaalista.

Se tekee formationista elävän.

---

# 19. COMBAT STATES

Yksiköllä voi olla tiloja:

```text
Normal
Shielded
Taunted
Stunned
Rooted
Poisoned
Burning
Bleeding
Silenced
Frozen
Marked
Enraged
Regenerating
```

---

# 20. STATUS STACKING

Osa statuksista voi stackata.

Esimerkiksi:

```text
Poison x1
Poison x2
Poison x3
Poison x4
Poison x5
```

Mutta stackien pitää olla helposti luettavia.

---

# 21. STATUS BREAKPOINTS

Joillakin statuksilla on breakpoint.

Esimerkiksi:

```text
Poison x5
↓
Toxic Burst
```

tai:

```text
Burn x3
↓
Ignite
```

tai:

```text
Bleed x4
↓
Deep Wound
```

---

# 22. STATUS INTERACTIONS

Status effectit voivat reagoida toisiinsa.

Esimerkiksi:

```text
Wet
+
Lightning
=
Shock
```

```text
Poison
+
Decay
=
Toxic Bloom
```

```text
Root
+
Fire
=
Burning Root
```

Näitä käytetään buildien moottoreina.

---

# 23. COMBO SYSTEM

Yksiköt voivat rakentaa comboja.

Esimerkiksi:

```text
Control
↓
Root
↓
Debuffer
↓
Armor Reduction
↓
DPS
↓
Burst
```

Combo ei ole ennalta käsikirjoitettu animaatio.

Se syntyy yksiköiden kyvyistä.

---

# 24. ABILITY SYSTEM

Abilityt jaetaan:

### Passive

Aina aktiivinen.

### Triggered

Aktivoituu ehdon täyttyessä.

### Cooldown

Aktivoituu tietyin väliajoin.

### Reactive

Vastaa tapahtumaan.

### Ultimate / Signature

Harvemmin tapahtuva voimakas ability.

---

# 25. ABILITY TRIGGERS

Mahdollisia triggereitä:

```text
On Combat Start
On Attack
On Hit
On Critical
On Heal
On Damage Taken
On Ally Death
On Enemy Death
On Low HP
On Shield Break
On Status Applied
On Status Removed
On Cooldown Complete
```

Tämä mahdollistaa hyvin monipuolisen buildisuunnittelun.

---

# 26. ENERGY SYSTEM

Joillakin yksiköillä on:

```text
Energy
```

Energy kasvaa esimerkiksi:

* attack
* damage taken
* healing
* status application
* ally death
* time

Kun energia täyttyy:

```text
SIGNATURE ABILITY
```

---

# 27. ABILITY TIMING

Abilityjen ajoitus syntyy automaattisesti pelitilanteesta.

Esimerkiksi:

Healer:

```text
If ally HP < 35%
→ emergency heal
```

Control:

```text
If enemy ultimate charging
→ interrupt
```

Support:

```text
If 3 allies are alive
→ team buff
```

---

# 28. INTERRUPT

Jotkin abilityt voidaan keskeyttää.

Esimerkiksi:

```text
Enemy Boss
charging ultimate
        ↓
Control
        ↓
STUN
        ↓
Ultimate cancelled
```

Tämä lisää strategista counterplayta.

---

# 29. SHIELD SYSTEM

Shield on erillinen HP-kerros.

```text
HP
+
Shield
```

Shield voi olla:

* temporary
* regenerating
* directional
* ally-only
* percentage-based

---

# 30. ARMOR / RESISTANCE

Puolustus jaetaan ainakin:

```text
Physical
Magical
Elemental
Status
```

Tämä mahdollistaa buildien väliset counterit.

---

# 31. DAMAGE TYPES

Vahinko voi sisältää:

```text
Physical
Magic
Nature
Fire
Frost
Poison
True
```

Kaikkia ei tarvitse käyttää kaikissa yksiköissä.

Damage typejen pitää palvella buildien strategiaa.

---

# 32. CRITICAL SYSTEM

Critical ei ole vain:

```text
2x damage
```

Joillakin yksiköillä critical voi:

* apply status
* reset cooldown
* heal attacker
* generate energy
* spread damage

Näin critical-buildillä on oma identiteetti.

---

# 33. BUILD ENGINE COMBATISSA

Taistelu tunnistaa pelaajan buildin.

Esimerkiksi:

```text
Tank:
High

DPS:
High

Healing:
Low

Control:
Medium

Synergy:
Poison
```

Combat engine voi käyttää näitä tietoja:

* synergioissa
* abilityissä
* relicseissä
* products
* eventeissä.

---

# 34. TEAM SYNERGY

Yksiköt voivat aktivoida team-level bonusmekaniikkoja.

Esimerkiksi:

```text
3 Forest
→ Nature Resonance

4 Forest
→ Deep Roots

6 Forest
→ Ancient Grove
```

Mutta synergy ei saa olla vain:

```text
+10% attack
```

Sen pitäisi muuttaa gameplayta.

Esimerkiksi:

```text
3 Forest:
Healing creates Roots.

4 Forest:
Roots protect adjacent allies.

6 Forest:
Roots can spread.
```

---

# 35. ROLE SYNERGY

Myös roolit voivat synergisoida.

Esimerkiksi:

```text
2 Tanks
→ Guard Formation

2 Healers
→ Shared Vitality

2 Supports
→ Harmony

2 Assassins
→ Coordinated Strike
```

---

# 36. CARRY SYSTEM

Buildissä voi olla Carry.

Carry saa paljon:

* buffs
* items
* protection
* healing
* synergy

Mutta Carrylla pitää olla selkeä riski:

```text
If Carry dies:
Build power drops dramatically.
```

Tämä tekee Carry protectionista strategisen tavoitteen.

---

# 37. CORE UNIT

Buildin Core Unit voi olla eri asia kuin Carry.

Esimerkiksi:

```text
Poison Witch
```

ei tee suurinta damagea.

Mutta:

```text
Poison Witch
↓
enables entire poison build
```

Jos se kuolee, koko buildin engine heikkenee.

---

# 38. SACRIFICE MECHANICS

Joissakin buildissa pelaaja voi hyötyä yksikön kuolemasta.

Esimerkiksi:

```text
Summoner dies
↓
Summoned spirits become enraged
```

Tai:

```text
Forest unit dies
↓
Roots appear
```

Tämä luo uusia build-arkkityyppejä.

---

# 39. DEATH SYSTEM

Kuolema ei aina tarkoita välitöntä poistumista.

Mahdollisia mechanics:

* Revive
* Death Trigger
* Last Stand
* Spirit
* Rebirth
* Sacrifice

Näiden pitää olla harvinaisia ja strategisia.

---

# 40. COMEBACK MECHANICS

Hearthwood tarvitsee mahdollisuuden comebackiin.

Esimerkiksi:

```text
Last Stand
```

tai:

```text
Low Team HP
→ increased ability generation
```

Mutta comeback ei saa kumota aiempia päätöksiä.

---

# 41. BATTLE MOMENTS

Combat engine voi tunnistaa merkittäviä tilanteita:

```text
Tank saves Carry
Critical kill
Ultimate interrupted
Last-second heal
Multi-kill
Shield break
Boss phase
```

Näitä voidaan käyttää:

* animaatioissa
* UI-feedbackissä
* rewardeissa
* lore-momenteissa.

---

# 42. BOSS PHASES

Boss voi vaihtaa käyttäytymistä HP:n mukaan.

```text
100–70%
Phase 1

70–40%
Phase 2

40–0%
Phase 3
```

Jokainen phase voi muuttaa:

* abilities
* targeting
* positioning
* summons
* status
* damage type

---

# 43. ENEMY BUILD AI INTEGRATION

Aiemmin määritelty Enemy Build AI käyttää tätä combat-järjestelmää.

Enemy:

```text
Build
↓
Roles
↓
Upgrades
↓
Items
↓
Position
↓
Combat
↓
Result
↓
Adaptation
```

Näin vihollinen pelaa samalla systeemillä kuin pelaaja.

---

# 44. ENEMY TACTICAL AI

Enemy Tactical AI arvioi:

```text
Threat
Target
Position
Ability Timing
Role Priority
Player Weakness
```

Esimerkiksi:

```text
Player healer exposed
+
Assassin available
+
Target reachable

→ Assassin attacks healer.
```

---

# 45. COUNTER SYSTEM

Buildit eivät ole absoluuttisia.

Esimerkiksi:

```text
Heavy Armor
→ Armor Penetration

Heavy Healing
→ Anti-Heal

Summons
→ AOE

Assassin
→ Backline Guard

Control
→ Resistance

Poison
→ Cleanse
```

---

# 46. RESISTANCE

Jokaisella yksiköllä voi olla resistance:

```text
Stun Resistance
Poison Resistance
Slow Resistance
Burn Resistance
Control Resistance
```

Resistance voidaan rakentaa tuotteilla ja upgradeilla.

---

# 47. ANTI-COMBO MECHANICS

Vihollinen voi rikkoa pelaajan comboja.

Esimerkiksi:

```text
Player:
Root → Poison → Burst

Enemy:
Cleanse
↓
Root removed
↓
Combo fails
```

Tämä tekee vastustajasta strategisen.

---

# 48. COMBAT DECISION DENSITY

Jokaisessa taistelussa pitäisi olla useita merkityksellisiä strategisia kysymyksiä:

```text
Who protects the carry?
Who dies first?
Who should be targeted?
Which synergy is most important?
Where should units stand?
What does the enemy build?
What is the enemy weakness?
Can the combo survive?
```

---

# 49. READABILITY

Monipuolisuus ei saa tehdä taistelusta sekavaa.

Pelaajan pitää pystyä ymmärtämään:

```text
WHO
did WHAT
TO WHOM
and WHY
```

Combat UI näyttää tärkeät tapahtumat selkeästi.

---

# 50. COMBAT LOG

Taistelun aikana voidaan näyttää tiivis log:

```text
Moss Guardian
blocked 42 damage.

Mycelium Healer
healed Moss Guardian.

Poison Witch
applied Poison x3.

Thorn Assassin
critically struck Rootkeeper.

Rootkeeper
was stunned.
```

Ei kaikkea dataa tarvitse näyttää.

Vain merkittävät tapahtumat.

---

# 51. COMBAT RECAP

Taistelun jälkeen:

```text
VICTORY

Damage:
████████

Healing:
████

Damage Taken:
██████

Control:
███

Top Performer:
Poison Witch

Most Valuable:
Moss Guardian
```

Lisäksi:

```text
Why you won:
Strong frontline + poison scaling
```

---

# 52. DEFEAT ANALYSIS

Häviön jälkeen pelaaja saa hyödyllisen analyysin.

Esimerkiksi:

```text
DEFEAT

Your damage:
HIGH

Your survivability:
LOW

Enemy advantage:
Backline pressure

Likely weakness:
Healer protection
```

Tavoitteena ei ole kertoa pelaajalle mitä hänen on pakko tehdä.

Se antaa ymmärrettävän vihjeen.

---

# 53. STRATEGIC AUTO-BATTLER

Hearthwood ei muutu manuaaliseksi tactics-peliksi.

Pelaaja ei normaalisti paina:

```text
ATTACK
HEAL
MOVE
```

Pelaaja tekee päätökset:

```text
BUILD
POSITION
UPGRADE
ITEM
SYNERGY
TARGETING RULE
```

Sitten järjestelmä toteuttaa ne.

---

# 54. PLAYER STRATEGIC CONTROL

Myöhemmin voidaan tarjota rajattuja taktisia prioriteetteja.

Esimerkiksi:

```text
Combat Priority:

Protect Carry
Focus Healer
Protect Frontline
Focus Lowest HP
Focus Highest Threat
```

Pelaaja ei ohjaa yksittäistä hyökkäystä.

Hän määrittää **strategian**.

---

# 55. AUTO-BATTLE INTEGRITY

Combatin pitää olla deterministisesti simuloitavissa.

Sama:

```text
Board
+
Stats
+
Items
+
Upgrades
+
Seed
```

tuottaa saman lopputuloksen.

Tämä helpottaa:

* debugging
* replay
* balancing
* AI simulation
* testing.

---

# 56. COMBAT SIMULATION

Järjestelmässä pitää olla mahdollisuus simuloida taistelua ilman renderöintiä.

```text
CombatSimulator
```

voi ajaa:

```text
1000 simulations
```

ja arvioida buildien vahvuutta.

Tätä voidaan käyttää:

* AI:ssa
* balance toolissa
* developer toolsissa
* unit testingissä.

---

# 57. COMBAT EVENT SYSTEM

Combat rakennetaan event-pohjaiseksi.

Esimerkiksi:

```text
COMBAT_START

UNIT_SPAWN

ATTACK_START

ATTACK_HIT

DAMAGE_DEALT

HEAL

STATUS_APPLIED

ABILITY_CAST

UNIT_DIED

COMBAT_END
```

Tämä mahdollistaa laajan määrän synergioita ilman että jokaista yksikköä varten kirjoitetaan täysin omaa combat-logiikkaa.

---

# 58. DATA-DRIVEN COMBAT

Abilityt, status effectit, damage types ja triggers pitää määritellä datana aina kun mahdollista.

Esimerkiksi:

```json id="7z0zpj"
{
  "id": "root_guard",

  "role": "tank",

  "trigger": "on_damage_taken",

  "condition": {
    "ally_hp_percent": {
      "less_than": 50
    }
  },

  "effect": {
    "type": "shield_ally",
    "value": 25
  }
}
```

Näin content-tiimi ja AI-dev tool voivat rakentaa uusia unitteja ilman combat-enginen muuttamista.

---

# 59. COMBAT POWER ≠ RAW STATS

Yksikön voimaa arvioitaessa huomioidaan:

```text
Raw Stats
+
Role Value
+
Synergy Value
+
Utility
+
Position Value
+
Timing Value
+
Build Dependency
```

Tämä estää yksinkertaisen:

> "Suurempi Attack = parempi yksikkö."

---

# 60. STRATEGIC DEPTH MODEL

Hearthwoodin combatissa on viisi strategista tasoa:

```text
LEVEL 1
Unit selection

LEVEL 2
Role composition

LEVEL 3
Positioning

LEVEL 4
Synergy + upgrades

LEVEL 5
Counter-building
```

Act I opettaa tasot 1–3.

Act II alkaa avaamaan tasoja 4–5.

---

# 61. ACT PROGRESSION

## ACT I

Helppo ymmärtää:

* Tank
* DPS
* Healer
* basic abilities
* positioning
* simple synergy

## ACT II

Älykkäämpi:

* enemy builds
* counters
* advanced upgrades
* status interactions
* complex synergies
* adaptive enemy AI

## ACT III+

Syvempi:

* advanced build interactions
* boss phases
* environmental combat
* rare mechanics
* high-level optimization

---

# 62. FOREST ENVIRONMENT

Myöhemmässä vaiheessa taistelukenttä voi vaikuttaa combat-mechanicsiin.

Esimerkiksi:

### AUTUMNWOOD

Leaf effects:

* dodge
* movement
* decay

### FROSTROOT

Frost:

* slow
* freeze
* resistance

### SUNSPIRE

Light:

* burst
* regeneration
* radiant effects

### MIREFALL

Mire:

* poison
* root
* decay

---

# 63. ENVIRONMENTAL STRATEGY

Board ei ole vain tyhjä tila.

Myöhemmin voidaan lisätä:

```text
Terrain
Hazards
Shrines
Roots
Water
Fire
Mushrooms
```

Mutta nämä pidetään erillisenä laajennuksena.

---

# 64. COMBAT BALANCE

Tärkeimmät balanssikysymykset:

### TANK

Ei saa tehdä liikaa damagea samalla kun se on paras puolustaja.

### DPS

Ei saa olla tehokas kaikissa tilanteissa.

### HEALER

Ei saa tehdä kuolemasta mahdotonta.

### CONTROL

Ei saa lukita vihollista loputtomasti.

### ASSASSIN

Ei saa aina tappaa backlinea automaattisesti.

### SUMMONER

Ei saa ylittää boardin luettavuutta.

---

# 65. COMBAT HEALTHY DESIGN

Jokaisella vahvalla mekaniikalla pitää olla vastamekaniikka.

```text
Strong mechanic
↓
Counter exists
↓
Counter has cost
↓
Player chooses whether to invest
```

Counter ei saa olla automaattinen ratkaisu.

---

# 66. MVP COMBAT SYSTEM

Ensimmäinen toteutus:

### Roles

* Tank
* DPS
* Healer
* Support
* Control
* Debuffer

### Combat

* Basic attacks
* Ability system
* Cooldowns
* Energy
* Threat
* Targeting
* Positioning
* Shields
* Healing
* Status effects
* Damage types
* Criticals

### Strategy

* Frontline/backline
* Synergies
* Carry
* Core Unit
* Counter mechanics
* Enemy Build AI integration

---

# 67. PHASE 2

Lisätään:

* advanced status interactions
* interrupt
* movement
* summons
* death triggers
* revive
* boss phases
* formation counters
* tactical priorities

---

# 68. PHASE 3

Lisätään:

* environmental combat
* terrain
* advanced combos
* rare legendary mechanics
* complex boss encounters
* simulation-based enemy AI
* advanced combat prediction

---

# 69. TESTING REQUIREMENTS

Jokaiselle unitille testataan:

```text
Role
Damage
Survivability
Targeting
Positioning
Ability
Upgrade
Synergy
Counter
```

Jokaiselle buildille testataan:

```text
Early Game
Mid Game
Late Game
Boss
Counter Build
```

---

# 70. AUTOMATED COMBAT TESTS

Combat Simulatorilla ajetaan:

```text
Unit vs Unit

Build vs Build

Build vs Counter Build

Boss vs Build

AI Build vs Player Build
```

Esimerkiksi:

```text
1000 simulations
```

tuottaa:

```text
Win Rate
Average Duration
Average Damage
Average Healing
Average Deaths
```

---

# 71. ACCEPTANCE CRITERIA

Combat V2 hyväksytään kun:

* yksiköillä on selkeät roolit
* positioning vaikuttaa merkittävästi
* targetointi on ymmärrettävää
* Tank pystyy suojaamaan muita
* Healer pystyy ylläpitämään joukkuetta
* DPS-yksiköillä on erilaisia damage-profiileja
* Support muuttaa muiden yksiköiden tehokkuutta
* Controlilla on selkeät counterit
* status effectit ovat strategisia
* abilityt muodostavat comboja
* upgradeilla on vaikutus combat-identiteettiin
* itemit vaikuttavat buildiin
* synergiat vaikuttavat combat-käyttäytymiseen
* vihollinen voi counteroida pelaajan buildiä
* pelaaja voi counteroida vihollisen buildiä
* taistelut ovat automaattisia mutta strategisesti ohjattavia
* combat voidaan simuloida ilman UI-renderöintiä
* combat voidaan toistaa deterministisellä seedillä
* combat-eventit ovat auditoitavissa
* järjestelmä toimii Enemy Build AI:n kanssa.

---

# 72. FINAL DESIGN PRINCIPLE

Hearthwoodin taistelun pitäisi tuottaa tilanteita kuten:

> Tank ottaa iskun vastaan juuri ennen Carryyn osuvaa hyökkäystä.

> Healer selviää Assassinilta yhden Shieldin ansiosta.

> Control keskeyttää Bossin ultin.

> Poison saavuttaa viidennen stackin ja käynnistää buildin kombon.

> Support kuolee, mutta sen death-trigger antaa Carrylle viimeisen mahdollisuuden.

> Vihollinen tunnistaa Poison-buildin ja alkaa rakentaa vastalääkettä.

> Pelaaja huomaa vihollisen rakentavan Assassin-buildeja ja muuttaa formationinsa.

Näissä hetkissä syntyy Hearthwoodin varsinainen strategia.

---

# 73. HEARTHWOOD COMBAT FORMULA

Hearthwoodin combat ei ole:

```text
POWER
VS
POWER
```

Se on:

```text
BUILD
+
ROLE
+
POSITION
+
SYNERGY
+
TIMING
+
COUNTER
+
ADAPTATION
=
COMBAT RESULT
```

---

# 74. ULTIMATE GOAL

Hearthwoodin taistelun jälkeen pelaajan pitäisi pystyä sanomaan:

> **"Tiedän miksi voitin."**

tai:

> **"Tiedän miksi hävisin."**

Ja vielä tärkeämpää:

> **"Tiedän mitä voin tehdä seuraavalla kerralla paremmin."**

Tämä on Hearthwoodin strategisen combat-järjestelmän ydin.

**Easy to understand.
Hard to master.
Deep enough to build around.**
