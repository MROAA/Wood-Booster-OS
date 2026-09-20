> **North-star design doc — the visual / UI shell.** Marc pasted this in
> full on 2026-09-09, during the threat-preview round (PR #432, which
> ships a small slice of its §38 "Scouting UI" / §51 threat-preview
> idea). Visual identity: *cosy fantasy + tactical strategy + living
> forest* — "a living storybook that happens to be a deep strategy
> game". Core content: the clarity-first / three-tier visual hierarchy
> (§2-3), the master layout (top bar · player | combat/world | enemy ·
> bottom action bar — §4), a living animated world + 4 biome visual
> identities (§5-6, §61 transitions), per-screen specs (main menu, run
> start, world map + node icons, shop, unit card, combat board, boss
> intro/health, combat log + recap, defeat screen + adaptation hints,
> event/treasure/relic screens, economy HUD, scouting UI, tooltips +
> advanced tooltips, Codex + Collection + discovery animation — §7-44),
> the UI-motion philosophy + feedback-for-every-action rule (§45-47,
> §66), tribe/tier/status/ability visual languages (§13-15, §23-24,
> §50), colour + typography systems (§51-52), accessibility + combat
> speed + responsive + performance priority order (§56-59), and — the
> architecturally load-bearing part — a **data-driven, event-driven
> presentation layer**: `GameUI/` component tree (§68), data-driven
> visual configs on units/statuses (§69), a visual event bus
> (UNIT_ATTACK / STATUS_APPLIED / SYNERGY_ACTIVATED / BOSS_PHASE_CHANGED
> / … — §70), the GAME EVENT → COMBAT EVENT → VISUAL EVENT → ANIMATION →
> PARTICLE → UI → AUDIO pipeline (§71), strict **separation of game
> logic from presentation** so combat stays deterministic / headless /
> replayable (§72-73), a debug overlay + AI visual debug (§74-75), a
> visual-QA checklist (§76), and an 8-screen graphical MVP (§77) with a
> PLACEHOLDER→PROTOTYPE→MVP→POLISHED→FINAL asset-quality ladder (§80)
> and a 10-step dev priority order led by READABILITY (§81). Not a build
> target — the shipping Hearthwood already follows much of it (the
> autobattler engine is already headless/deterministic and pure;
> `heartwood.css` design tokens; `CardGlyph` data-driven art;
> `soundManager` synthesised SFX + the `play("name")` hook layer;
> `coach.js` contextual tips; the spectacle layer #418). Slice one
> screen / system per round. Related:
> docs/hearthwood-strategic-foundation-prd.md,
> docs/hearthwood-synergy-tribes-tiers-prd.md,
> docs/hearthwood-enemy-ecosystem-prd.md,
> docs/hearthwood-combat-system-v2-prd.md,
> docs/hearthwood-seed-playstyle-systems-prd.md.

---

# HEARTHWOOD

## PRD — Graphical Presentation, UI & Visual Game Experience

**Project:** Hearthwood
**Genre:** Tactical Auto-Battler / Roguelite / Synergy Builder
**Visual identity:** Cosy Fantasy + Tactical Strategy + Living Forest
**Core fantasy:** *Cosy tactics with deep synergy.*

---

# 1. VISUAL VISION

Hearthwoodin graafinen näkymä yhdistää:

* lämminhenkisen metsäfantasian
* taktisen strategiapelin selkeyden
* modernin korttipelin käyttöliittymän
* satumaisen maailman
* vahvat yksikköpersoonallisuudet
* selkeät combat-efektit
* pehmeän mutta laadukkaan käyttöliittymän.

Visuaalinen tavoite:

> **"A living storybook that happens to be a deep strategy game."**

Pelin pitää näyttää samaan aikaan:

```text
COZY
+
MAGICAL
+
TACTICAL
+
PREMIUM
+
MYSTERIOUS
```

---

# 2. VISUAL DESIGN PRINCIPLES

## 2.1 Clarity First

Pelaajan pitää ymmärtää nopeasti:

* mitä tapahtuu
* kuka hyökkää
* kuka on vaarassa
* mikä ability aktivoituu
* mikä status vaikuttaa
* mitä voi ostaa
* mitä valinta tekee.

Visuaalinen näyttävyys ei saa peittää gameplayta.

---

# 3. VISUAL HIERARCHY

Kaikissa näkymissä käytetään kolmea informaatiotasoa.

## Primary

Tärkein asia: combat / shop / map / valinta.

## Secondary

Strateginen informaatio: HP / Gold / Energy / Synergies / Threat / Status.

## Tertiary

Lisätieto: lore / numerot / combat log / item details / advanced statistics.

---

# 4. MASTER GAME LAYOUT

```text
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR                                                     │
│ HP | GOLD | LEVEL | XP | SEED | RUN INFO                   │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│ PLAYER       │                              │ ENEMY         │
│ INFO         │       COMBAT / WORLD        │ INFO          │
│              │                              │               │
│ Units        │                              │ Threat        │
│ Synergies    │                              │ Formation     │
│ Relics       │                              │ Boss          │
│              │                              │               │
├──────────────┴──────────────────────────────┴───────────────┤
│ BOTTOM ACTION BAR                                            │
│ SHOP / REROLL / LEVEL / LOCK / ITEMS / SCOUT                 │
└─────────────────────────────────────────────────────────────┘
```

Layoutin pitää pysyä visuaalisesti rauhallisena.

---

# 5. WORLD PRESENTATION

Hearthwoodin maailma ei ole staattinen taustakuva. Se on elävä.

Taustalla voidaan nähdä: liikkuvia lehtiä · pieniä eläimiä · hyönteisiä · sieniä · tuulta · valon vaihtelua · sumua · sadepisaroita · lumisadetta · taikahiukkasia.

Taustan animaatio on hidasta ja rauhallista. Combatissa maailma muuttuu aktiivisemmaksi.

---

# 6. BIOME VISUAL IDENTITY

**Autumnwood:** ruska · suuret puut · lämmin valo · lehdet · pienet metsäeläimet · kultainen sumu. → *Ancient autumn forest.*

**Frostroot:** lumi · jää · sinertävä valo · jääkiteet · hengityshöyry · frozen roots. → *Silent frozen wilderness.*

**Sunspire:** kirkas valo · kultaiset puut · aurinkoenergia · kukat · suuret kivirakennelmat. → *Sacred forest sanctuary.*

**Mirefall:** sumu · suot · sienet · muta · vihreä bioluminesenssi · tummat vedet. → *Beautiful but dangerous.*

---

# 7. MAIN MENU

Päävalikko ei saa näyttää tekniseltä launcherilta. Sen pitäisi näyttää paikalta Hearthwoodin maailmassa.

```text
              HEARTHWOOD

          [ CONTINUE RUN ]
          [ NEW RUN ]
          [ DAILY SEED ]
          [ CODEX ]
          [ COLLECTION ]
          [ SETTINGS ]
```

Taustalla: Hearthwood · suuri vanha puu · pieniä eläimiä · liikkuva sää · vaihtuva vuodenaika.

---

# 8. RUN START SCREEN

```text
┌────────────────────────────────────────────┐
│            BEGIN YOUR JOURNEY              │
│  BIOME     Autumnwood                      │
│  SEED      HW-7F39-A2                      │
│  [ BEGIN RUN ]                             │
└────────────────────────────────────────────┘
```

Näytetään: biome · seed · vaikeustaso · mahdolliset modifierit · lyhyt lore.

---

# 9. WORLD MAP

Yksi pelin tärkeimmistä näkymistä. Polut kulkevat metsässä · node on pieni fyysinen paikka · puut ja sumu muodostavat taustan · nodeissa on selkeät ikonit.

```text
                 BOSS
                  │
             ┌────┴────┐
          ELITE       EVENT
             │         │
          SHOP        COMBAT
             └────┬────┘
                START
```

---

# 10. MAP NODE DESIGN

`⚔ Combat` · `👑 Elite` · `🛒 Shop` · `❔ Event` · `💎 Treasure` · `🔥 Rest` · `☠ Challenge` · `🌲 Mystery` · `💀 Boss`.

Ikonin lisäksi: muoto · animaatio · tooltip. **Väri ei saa olla ainoa informaation lähde.**

---

# 11. SHOP VIEW

Shopin pitää tuntua oikealta metsämarkkinapaikalta.

```text
┌─────────────────────────────────────────────┐
│ SHOP                         GOLD: 18       │
│ [UNIT] [UNIT] [UNIT] [ITEM] [UNIT]         │
│  BUY    BUY    BUY    BUY    BUY            │
│ REROLL 2G   LEVEL UP 8G   LOCK             │
└─────────────────────────────────────────────┘
```

Voi näkyä: pieni myyjä · tavaroita pöydällä · kortit · yksikköfiguurit · itemit · relicit.

---

# 12. UNIT CARD

```text
┌──────────────────────┐
│      UNIT ART        │
│ Moss Guardian        │
│ ROOTBORN             │
├──────────────────────┤
│ 🛡 TANK              │
│ HP   ████████        │
│ ATK  ████            │
│ DEF  ███████         │
├──────────────────────┤
│ ABILITY  Thorn Guard │
├──────────────────────┤
│ ★ ★                  │
└──────────────────────┘
```

Kortin pitää olla nopeasti luettava.

---

# 13. UNIT VISUAL LANGUAGE

Jokaisella yksiköllä on: silhouette · tribe identity · role icon · tier frame · unique animation · ability visual · status visual. Pelaajan pitää tunnistaa yksikkö pienestäkin kuvasta.

---

# 14. TRIBE VISUAL IDENTITY

**ROOTBORN** puunrungot / lehdet / juuret / vihreä / ruskea / kilvet · **MOSSKIN** sammal / pienet eläimet / sienet / orgaaniset muodot · **WILDCLAW** kynnet / hampaat / turkki / liike / aggressiiviset siluetit · **MYCELIAN** sienet / itiöt / orgaaniset verkostot / spore-pilvet · **SUNWARDEN** valo / kultaiset symbolit / aurinkokehät · **FROSTROOT** jää / kristallit / kylmä valo · **FENBORN** suo / muta / myrkky / korruptio · **ASHEN** hiillos / savu / tuhka / palavat symbolit.

---

# 15. TIER VISUAL SYSTEM

```text
TIER 1  Simple frame
TIER 2  Decorated frame
TIER 3  Animated frame
TIER 4  Magical frame
TIER 5  Legendary animated frame
```

Tier 5 tuntuu erityiseltä, mutta luettavuus säilyy.

---

# 16. SYNERGY UI

Ei pelkkä lista.

```text
ROOTBORN   ●●●●○○   4 / 6
GROVE NETWORK   Active
All Rootborn gain: Regrowth on Block
```

Breakpoint aktivoituu → `SYNERGY ACTIVATED` + pieni animaatio kulkee tiimin läpi.

---

# 17. BUILD PANEL

```text
YOUR BUILD
ROOTBORN 4 · WILDCLAW 2 · GUARDIAN 3 · HEALER 1
POISON 0 · CONTROL 2 · ECONOMY 1
CORE: Moss Guardian
STYLE: DEFENSIVE / SCALING
```

Antaa jatkuvan kuvan: *mitä olen rakentamassa?*

---

# 18. COMBAT BOARD

```text
ENEMY TEAM    [E] [E] [E]
       ⚔ BATTLEFIELD ⚔
PLAYER TEAM   [P] [P] [P]
```

Ei shakkilauta — fyysinen paikka.

---

# 19. GRID

Hienovarainen ruudukko taustalla: positioning · ability range · movement · AOE. Combatin aikana grid lähes katoaa.

---

# 20. UNIT COMBAT PRESENTATION

`CHARACTER + HP BAR + ENERGY + STATUS + THREAT INDICATOR`.

---

# 21. HEALTH BARS

Selkeitä, pieniä, nopeasti luettavia. `████████░░` · Shield: extra `▓▓▓▓` · Barrier: `◇◇◇`.

---

# 22. DAMAGE NUMBERS

Eivät saa täyttää ruutua. Tyypit: Normal · Critical · Heal · Shield · Poison · Burn · Blocked · Miss · Resisted — eri animaatiot.

---

# 23. STATUS VISUALS

`ICON + STACK COUNT + WORLD EFFECT`. Esim. Poison: `☠ 3` + pieni vihreä/sienenomainen partikkeliefekti.

---

# 24. ABILITY VISUALS

Tunnistettavia animaation alusta: **Thorn Guard** juuret nousevat · **Frost Nova** jää muodostuu · **Spore Burst** sienihiukkaset leviävät · **Radiant Beam** valonsäde kohteeseen.

---

# 25. TELEGRAPH SYSTEM

Vaaralliset abilityt näytetään ennen: `⚠ ANCIENT ROOTFALL [ AOE ] 1.8s`. AOE näkyy kentällä; pelaaja ehtii reagoida formationilla.

---

# 26. COMBAT CAMERA

Dynaaminen mutta hallittu. Normaali: top-down / 3D angled · ability: small emphasis · critical: brief impact · boss: larger movement. **Ei jatkuvaa tärinää.**

---

# 27. BOSS PRESENTATION

```text
        THE ROTMOTHER
             BOSS
     "The forest remembers."
```

Oma intro · soundtrack cue · UI frame · health bar · phase indicator.

---

# 28. BOSS HEALTH UI

```text
THE ROTMOTHER
████████████████████████
PHASE I    ○ ○ ○
```

Phase vaihtuu näkyvästi.

---

# 29. COMBAT LOG

```text
12.4s  Moss Guardian blocked 83
12.7s  Growth activated
13.1s  Healer restored 124 HP
13.8s  Rootborn synergy triggered
14.0s  Ancient Stag entered Phase II
```

Avataan sivupaneeliksi.

---

# 30. COMBAT RECAP

```text
VICTORY
Damage 8,421 · Healing 3,204 · Blocked 4,102 · Control 11 · Deaths 0
CORE UNIT  Moss Guardian
BEST SYNERGY  Rootborn 4
TIME  43.2 sec
```

---

# 31. DEFEAT SCREEN

Ei vain `DEFEAT` — sen pitää opettaa.

```text
DEFEAT
YOUR TEAM SURVIVED: 31 sec
MAIN PROBLEM: Backline pressure
YOUR STRONGEST: Healing
YOUR WEAKEST: Control
OPPORTUNITY: Enemy healer remained alive for 24 sec.
```

---

# 32. POST-COMBAT RECOMMENDATIONS

```text
POSSIBLE ADAPTATION — You could consider:
• Anti-Heal  • Backline protection  • Burst damage  • Target priority adjustment
```

Ei pakotettua ratkaisua.

---

# 33. EVENT SCREEN

Pieni satukirjan sivu.

```text
        THE OLD GARDENER
An old figure waits beside a tree.
"The roots remember your kindness."
[ HELP ] [ LEAVE ] [ ASK ABOUT THE TREE ]
```

Käyttää: kuvitusta · pieniä animaatioita · ympäristöääniä · tekstiefektejä.

---

# 34. TREASURE SCREEN

```text
       TREASURE FOUND
      ✦ Ancient Relic ✦
       [ OPEN CHEST ]  ↓
   THE ROOTKEEPER'S OATH
```

Chest avautuu animaatiolla.

---

# 35. RELIC PRESENTATION

```text
┌──────────────────────┐
│      RELIC ART       │
│ Rootkeeper's Oath    │
│ Every third heal     │
│ creates a Seed.      │
│ ACTIVE               │
└──────────────────────┘
```

---

# 36. ECONOMY UI

`🪙 24` · `LV 5 ██████░░░` · `♥ 37 / 50`. Näkyvissä tärkeimmissä näkymissä.

---

# 37. PLAYER HP AS WORLD ELEMENT

`♥ ♥ ♥ ♥` + tarkka numero aina saatavilla. HP laskee → UI reagoi kevyesti · maailma tummuu hieman · musiikki muuttuu hienovaraisesti. Ei liian dramaattisesti.

---

# 38. SCOUTING UI

Ennen combatia:

```text
ENEMY SCOUT — FORTRESS BUILD
TANK █████ · HEALING ████ · DAMAGE ██ · CONTROL █
LIKELY: Long fight, High sustain
WEAKNESS: Anti-Heal, Armor Break
```

Pelaaja saa strategista tietoa ennen taistelua.

---

# 39. INVENTORY

`UNITS · ITEMS · RELICS · CONSUMABLES`. Tukee drag & drop · inspect · compare · equip · unequip.

---

# 40. TOOLTIP SYSTEM

```text
REGROWTH
Heals 5% of maximum HP at the start of the unit's turn.
STACKS: 3   SOURCE: Rootborn Synergy
```

Avautuu: hover · click · controller focus.

---

# 41. ADVANCED TOOLTIP

`ADVANCED` → formula · source · duration · stack rules · interactions · counter mechanics.

---

# 42. CODEX

Kategoriat: TRIBES · UNITS · ENEMIES · BOSSES · ITEMS · RELICS · SYNERGIES · STATUS · REACTIONS · BIOMES · LORE. Sisältö avautuu löytämisen mukaan.

---

# 43. COLLECTION

```text
UNITS 42/120 · RELICS 31/80 · ENEMIES 67/96 · SECRETS 12/30
```

---

# 44. DISCOVERY ANIMATION

```text
✦ DISCOVERY ✦   NEW UNIT
MYCELIAN SPORE WITCH
```

Lyhyt, palkitseva.

---

# 45. UI ANIMATION PHILOSOPHY

Kaiken ei pidä liikkua. **Micro:** hover / click / tooltip · **Medium:** card appear / purchase / synergy activation · **Large:** boss entrance / relic discovery / new biome · **Epic:** legendary unit / major transformation / final boss.

---

# 46. UI MOTION

Pehmeä · nopea · hieman orgaaninen. Vältetään aggressiivisia bounce-animaatioita · jatkuvaa neon-glowta · liiallista motion bluria.

---

# 47. VISUAL FEEDBACK

Jokaisesta tärkeästä toiminnosta palaute: BUY → card moves to team · REROLL → shop refresh · LEVEL UP → XP burst · SYNERGY → connection animation · ITEM EQUIP → item attaches · UPGRADE → unit transformation.

---

# 48. UNIT UPGRADE ANIMATION

`3 × Unit → 2★`: kortit yhdistyvät (`UNIT + UNIT + UNIT ↓ ✨ ↓ UPGRADED`). Ulkoasu voi muuttua hieman. Tier ei muutu, rank muuttuu.

---

# 49. UNIT EVOLUTION

`MOSS GUARDIAN ↓ GROVE PROTECTOR` on suurempi visuaalinen tapahtuma: uusi ulkoasu · uusi ability visual · uusi portrait · uusi korttikehys.

---

# 50. VISUAL LANGUAGE FOR STRATEGY

Strategia näkyvissä ilman numeroiden lukemista: SHIELD → shield icon · POISON → spore cloud · ROOT → roots · FREEZE → ice · TAUNT → threat symbol · MARK → target symbol.

---

# 51. COLOR SYSTEM

Luonnollinen paletti: forest greens · warm browns · muted gold · cream · deep blue · soft purple · ember orange. Värit informaation tukena. **Ei neon-UI:ta.**

---

# 52. TYPOGRAPHY

Moderni · erittäin luettava · hieman persoonallinen. Hierarkia: TITLE / Heading / Subheading / Body / Caption / Combat Number. Ei koristeellista fonttia tärkeän gameplay-informaation kohdalla.

---

# 53. CARD DESIGN

```text
┌────────────────────────┐
│ Tier / Tribe           │
│       ART              │
│ NAME / ROLE            │
│ ABILITY                │
│ TAGS                   │
└────────────────────────┘
```

Toimii shopissa · inventoryssä · combatissa · codexissa.

---

# 54. DRAG & DROP

Shop→Unit · Unit→Formation · Item→Unit · Relic→Run · Unit→Sell. Dragauksen aikana validit kohteet korostuvat.

---

# 55. CONTEXTUAL UI

UI näyttää vain tarvittavan: combatissa combat-info · shopissa economy-info · mapissa route-info. Ei yhtä valtavaa HUDia.

---

# 56. ACCESSIBILITY

colorblind-friendly icons · text labels · scalable UI · reduced motion · larger text · screen shake toggle · combat speed · animation reduction. **Väri ei saa olla ainoa tapa tunnistaa status.**

---

# 57. COMBAT SPEED

`1× / 2× / 3×` + `Pause` + mahdollisuuksien mukaan `Detailed Combat` / `Fast Combat`.

---

# 58. RESPONSIVE DESIGN

Target 16:9 (1920×1080, 2560×1440). Tuetaan 1280×720, 3440×1440. UI skaalautuu ilman että gameplay-elementit peittyvät.

---

# 59. PERFORMANCE

`GAMEPLAY > READABILITY > ANIMATION > PARTICLES > BACKGROUND DETAIL`. GPU kuormittuu → 1. taustapartikkelit 2. post-processing 3. ympäristöanimaatio 4. gameplay-efektit säilyvät.

---

# 60. PARTICLE SYSTEM

magic · status · tribe identity · relics · legendary effects · boss mechanics. Tunnistettavia mutta pieniä.

---

# 61. WORLD TRANSITIONS

`AUTUMNWOOD ↓ fog ↓ leaves disappear ↓ snow appears ↓ FROSTROOT`. Ei vain loading screen — pieni matkakokemus.

---

# 62. LOADING SCREEN

```text
HEARTHWOOD
LORE TIP
"Some roots remember every footstep."
```

---

# 63. AUDIO-VISUAL INTEGRATION

Synergy Activated → visual pulse + sound cue · Boss Phase → screen transition + music change · Legendary Drop → visual burst + unique sound.

---

# 64. VISUAL STORYTELLING

Maailma näyttää kuka täällä asuu · mitä on tapahtunut · mikä biome on vaarallinen · mikä tribe hallitsee. Esim. Mirefall: sieniverkostot kasvavat raunioiden yli.

---

# 65. UI PERSONALITY

Ei geneerinen dashboard. Pieniä orgaanisia yksityiskohtia: puunjuurimaisia dividereitä · käsin piirrettyjä ikoneita · pieniä lehtianimaatioita · paperimaisia korttitaustoja · metsäaiheisia kehyksiä. Mutta koristeet eivät saa estää tiedon lukemista.

---

# 66. PLAYER FEEL

BUY → satisfying click · SYNERGY → magical pulse · UPGRADE → transformation · DISCOVERY → reveal · VICTORY → world reacts · BOSS DEFEAT → major visual celebration.

---

# 67. VISUAL GAME STATES

`MAIN MENU → RUN START → MAP → EVENT → SHOP → FORMATION → SCOUT → COMBAT → REWARD → UPGRADE → MAP`. Jokaisella oma layout, yhteinen design language.

---

# 68. COMPONENT SYSTEM

```text
GameUI/
├── HUD/         PlayerStatus · EconomyBar · XPBar · RunInfo
├── Map/         WorldMap · MapNode · Route
├── Shop/        ShopPanel · UnitCard · ItemCard · RelicCard · ShopActions
├── Combat/      CombatBoard · UnitActor · HealthBar · StatusBar · DamageNumber · AbilityEffect · Telegraph · CombatLog
├── Build/       BuildPanel · SynergyPanel · Formation · Inventory
├── Events/      EventPanel · ChoiceButton
├── Codex/       Codex · UnitEntry · EnemyEntry · SynergyEntry
└── Shared/      Tooltip · Modal · Button · Card · Icon · Notification
```

---

# 69. DATA-DRIVEN VISUALS

Graafinen järjestelmä lukee gameplay-dataa.

```text
Unit { tribe, role, tier, portrait, model, abilityVFX, idleAnimation, attackAnimation, deathAnimation }
Status { icon, particleEffect, stackDisplay, durationDisplay }
```

---

# 70. VISUAL EVENT SYSTEM

`UNIT_ATTACK · UNIT_HIT · UNIT_CRIT · UNIT_HEAL · UNIT_DEATH · ABILITY_CAST · STATUS_APPLIED · STATUS_REMOVED · SYNERGY_ACTIVATED · ITEM_EQUIPPED · UNIT_UPGRADED · BOSS_PHASE_CHANGED · VICTORY · DEFEAT`. Jokainen gameplay-event voi laukaista visuaalisen tapahtuman.

---

# 71. COMBAT PRESENTATION PIPELINE

```text
GAME EVENT → COMBAT EVENT → VISUAL EVENT → ANIMATION → PARTICLE → UI FEEDBACK → AUDIO CUE
```

Gameplay engine ei saa olla riippuvainen grafiikasta. Grafiikka kuuntelee gameplay-eventtejä.

---

# 72. SEPARATION OF SYSTEMS

`GAME LOGIC → EVENT BUS → VISUAL PRESENTATION`. Ei: UI muuttaa combat-logiikkaa suoraan. Mahdollistaa replayt · deterministisen combat-simulaation · fast-forwardin · testauksen · headless simulationin.

---

# 73. REPLAY SUPPORT

`Seed + Combat State + Event Stream` → replay näyttää saman taistelun uudelleen.

---

# 74. DEBUG VISUAL MODE

Dev buildissä `F1`: `DEBUG OVERLAY — FPS · ENTITY COUNT · COMBAT STATE · CURRENT EVENT · TARGET · THREAT · STATUS · RNG STREAM · AI DECISION`. Tärkeä Spacemonkeyn kehitystyölle.

---

# 75. AI VISUAL DEBUG

```text
AI TARGET — Healer: 87 · Tank: 42 · Carry: 73
POSITION SCORE — Front-left: 82 · Front-mid: 91 · Back-left: 45 · Back-mid: 67
```

Auttaa tasapainottamaan vihollis-AI:ta.

---

# 76. VISUAL QA

```text
□ UI readable            □ No overlapping cards
□ No hidden status       □ No clipped text
□ Combat effects visible □ Boss telegraphs visible
□ Tooltips work          □ Scaling works
□ Reduced motion works   □ Colorblind mode works
□ 60 FPS target maintained
```

---

# 77. MVP GRAPHICAL SCOPE

Screen 1 Main Menu · 2 World Map · 3 Shop · 4 Formation · 5 Combat · 6 Reward · 7 Event · 8 Codex. Näillä koko ensimmäinen pelattava loop.

---

# 78. MVP COMBAT ART

Ei täydellisiä 3D-malleja. Ensimmäinen versio: `2D character portraits + animated sprites + particles + simple battlefield + strong UI`. Tavoite: gameplay näyttää valmiilta ennen kuin kaikki assetit ovat valmiita.

---

# 79. ART PRODUCTION PIPELINE

`CONCEPT ART → CHARACTER DESIGN → MODEL / SPRITE → ANIMATION → VFX → UI INTEGRATION → GAMEPLAY TEST → POLISH`.

---

# 80. VISUAL QUALITY LEVELS

`PLACEHOLDER · PROTOTYPE · MVP · POLISHED · FINAL`. Spacemonkey tietää mitä ei tarvitse vielä viimeistellä.

---

# 81. GRAPHICAL DEVELOPMENT PRIORITY

`1. READABILITY  2. COMBAT BOARD  3. UNIT CARDS  4. SHOP  5. MAP  6. SYNERGY UI  7. VFX  8. BIOME POLISH  9. BOSS PRESENTATION  10. CINEMATIC POLISH`.

---

# 82. FINAL VISUAL NORTH STAR

`SEE → UNDERSTAND → DECIDE → ACT → WATCH → REACT → LEARN`. Pelaaja näkee ensin maailman, sitten strategian, sitten tekee päätöksen, sitten peli näyttää seuraukset.

---

# 83. FINAL DESIGN STATEMENT

Käyttöliittymän ei pidä näyttää siltä, että pelaaja käyttää ohjelmaa. Sen pitää näyttää siltä, että pelaaja **astuu metsään.** Shop on paikka. Map on maailma. Unitit ovat hahmoja. Synergiat ovat eläviä yhteyksiä. Combat on tapahtuma. Bossit ovat kohtaamisia. Relicit ovat muinaisia esineitä. Codex on pelaajan oma metsäkirja.

> **Auttaa pelaajaa näkemään oman strategiansa elävän maailman sisällä.**

---

# 84. IMPLEMENTATION GOAL

Rakennetaan `Hearthwood Visual Shell`: App Shell + Navigation + World Background + HUD + Card System + Map + Shop + Formation + Combat Board + Unit Presentation + Synergy UI + Tooltip System + Event System + Animation Layer. Kaikki **data-driven**. Graafinen frontend ei saa sisältää pelilogiikkaa kovakoodattuna.

---

# 85. ULTIMATE EXPERIENCE

Pelaaja avaa Hearthwoodin. Metsä hengittää. Hän näkee seuraavan polun. Löytää uuden yksikön. *"Mielenkiintoinen."* Huomaa synergian. *"Odota…"* Yhdistää relicin. *"Nyt tämä toimii."* Sijoittaa tiimin. Vihollinen saapuu. *"Tuo vastustaa tätä buildia."* Muuttaa formationia. Taistelu alkaa. Synergia aktivoituu. Metsä reagoi. Boss saapuu. Pelaaja näkee telegraphin. Ymmärtää ongelman. Ja tekee päätöksen.

**Tämä on Hearthwoodin graafisen näkymän tavoite.**
