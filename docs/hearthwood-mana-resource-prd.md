# HEARTHWOOD

## Universal Mana & Skill Resource System

### Monipuolinen manajärjestelmä kaikille classeille

> **Mana is not just a cost. Mana is how a class expresses its identity.**

*(Marc, 2026-10-05. Kirjoitettu reaaliaikaisin termein ("/sec"); Hearthwoodin vuoropohjaisessa taistelussa "/sec" tarkoittaa "/vuoro". Mana step 1 (PR #589) toteutti jo: kaikilla sankareilla ja vihollisilla mana, classin mukainen pool, AP + mana + cooldown, roolikohtainen generointi, Overcharge, Commanderin mana-ultimate, juomat/reliikit/drain.)*

---

# 1. VISION

Hearthwoodiin rakennetaan universaali **Mana & Skill Resource System**, jonka kautta kaikki manaa käyttävät classit voivat käyttää aktiivisia skillejä, ultimateja, reaktioita ja muita kykyjä.

Järjestelmän tarkoitus ei ole tehdä kaikista classeista samanlaisia.

Päinvastoin:

> **Kaikilla classeilla voi olla mana, mutta jokainen class käyttää sitä eri tavalla.**

Esimerkiksi:

* Mage rakentaa manaa ja käyttää sitä voimakkaisiin loitsuihin.
* Warrior käyttää Rage-tyyppistä manaa.
* Rogue kerää Comboa.
* Druid käyttää Nature Manaa.
* Necromancer käyttää Soul Manaa.
* Blood Mage käyttää Blood Manaa.
* Frost Mage käyttää Frost Manaa.
* Summoner käyttää Spirit Manaa.

Kaikki käyttävät samaa taustajärjestelmää, mutta eri resource-profiilia.

---

# 2. DESIGN GOAL

Mana-järjestelmän pitää tehdä skilleistä kiinnostavia.

Pelaajan ei pitäisi ajatella:

> "Voinko painaa skill-nappia?"

Vaan:

> **"Milloin minun kannattaa käyttää mana?"**

Järjestelmän pitää luoda:

* päätöksiä
* ajoitusta
* build-synergioita
* risk/reward-tilanteita
* class-identiteettiä
* resource managementia
* power spikeja

---

# 3. UNIVERSAL RESOURCE MODEL

Jokaisella classilla on resurssiobjekti:

```text
Resource
├── Current
├── Maximum
├── Regeneration
├── Generation
├── Consumption
├── Conversion
├── Overflow
├── Thresholds
└── Modifiers
```

Perusmalli:

```text
CURRENT MANA
████████████░░░░
72 / 100
```

---

# 4. BASIC MANA

Normaali Mana:

```text
Maximum Mana: 100
Current Mana: 100
Regeneration: 5/sec
```

Skill:

```text
Fireball
Cost: 20 Mana
```

Käyttö: 100 → 80 → 60 → 40 → 20 → 0

---

# 5. MANA REGENERATION

Mana voi palautua useilla tavoilla.

* **Passive regeneration** (+5 Mana / sec)
* **Combat regeneration** – mana palautuu vain taistelussa.
* **Damage regeneration** – mana palautuu, kun pelaaja tekee damagea.
* **Kill regeneration** – tappo antaa +3 Mana.
* **Ability regeneration** – tietty skill tuottaa manaa.
* **Time regeneration** – mana palautuu automaattisesti ajan perusteella.

---

# 6. MANA GENERATION

Mana voidaan tuottaa aktiivisesti, esimerkiksi Basic Attack → +2 Mana, Critical Hit → +5 Mana, Enemy Kill → +4 Mana. Tämä tekee classin pelaamisesta aktiivista.

---

# 7. MANA COST

Skillillä voi olla: Mana Cost, Cooldown, Cast Time, Charges, Condition.

Esimerkiksi Fireball – Mana: 25, Cooldown: 3 sec, Damage: 100.

---

# 8. SKILL TIERS

* **Basic** 10–20 Mana
* **Advanced** 20–40 Mana
* **Powerful** 40–60 Mana
* **Ultimate** 60–100+ Mana – ultimate voi käyttää koko mana-poolin.

---

# 9. MANA TYPES

* **Universal Mana** – perusmana.
* **Rage** – aggressiosta syntyvä resurssi.
* **Energy** – nopea, jatkuvasti uusiutuva resurssi.
* **Spirit** – summonien ja henkien resurssi.
* **Blood** – HP:hen liittyvä resurssi.
* **Nature** – luontoon liittyvä resurssi.
* **Shadow** – pimeyden resurssi.
* **Frost** – kylmyydestä syntyvä resurssi.
* **Arcane** – puhdas maaginen resurssi.
* **Soul** – kuolleista syntyvä resurssi.

---

# 10. RESOURCE ARCHITECTURE

Kaikki resurssit käyttävät samaa engineä (Universal Resource System → Mana, Rage, Energy, Spirit, Blood, Nature, Soul …). Uusi class voidaan rakentaa ilman uuden resource-engine-järjestelmän ohjelmointia.

---

# 11. CLASS RESOURCE PROFILES

Jokaisella classilla on: Primary Resource, Secondary Resource, Generation Method, Consumption Method, Special Mechanic, Ultimate Mechanic.

---

# 12. MAGE

Resource: **Arcane Mana**, maximum 100. Generation: time, spell interactions, Arcane attacks. Mage käyttää manaa klassisesti. Esim. Fireball 20, Meteor 70, Arcane Nova 40.

# 13. WARRIOR

Warrior ei käytä tavallista manaa. Resurssi: **RAGE** 0–100. Rage syntyy: damage dealt, damage taken, critical hits, kills. Esim. Attack +5, Heavy Attack +10, Take Damage +8.

# 14. RAGE SKILLS

Rage Strike 20 · Whirlwind 40 · Berserker 60 · Blood Rage 100 (100 Rage: **Berserk state**).

# 15. ROGUE

Resurssi: **COMBO** 0–10. Syntyy onnistuneista hyökkäyksistä, dodgeista, backstabista, critical hiteistä. Combo katoaa hitaasti.

# 16. ROGUE SKILLS

Quick Strike 2 · Shadowstep 3 · Fan of Knives 5 · Assassin's Mark 7 · Death From Shadows 10. Combo tekee Roguesta **momentum-based classin**.

# 17. PALADIN

Resource: **HOLY POWER** 0–5. Syntyy: healing, blocking, protecting allies, holy attacks. Skillit kuluttavat Holy Poweria.

# 18. PALADIN SKILLS

Holy Strike 1 · Divine Shield 3 · Holy Nova 4 · Divine Judgment 5. Palkitsee **puolustamista + suojelemista**.

# 19. DRUID

Resource: **NATURE MANA** 0–100. Syntyy: nature abilities, healing, growth, environmental interaction. Nature States: ROOT, BEAST, BLOOM, STORM – tietyt skillit vaihtavat statea.

# 20. DRUID — RESOURCE CYCLE

Nature Spell → Bloom → Nature Mana → Beast Form → Generate Rage-like Nature → Storm. Druidin gameplay on resurssikierto.

# 21. NECROMANCER

Resource: **SOULS** 0–30. Syntyy: enemy deaths, summoned deaths, Soul spells.

# 22. NECROMANCER SKILLS

Raise Skeleton 5 · Bone Spear 3 · Soul Drain 8 · Army of the Dead 20 · Death Ritual 30. Necromancer **muuttaa kuoleman voimaksi**.

# 23. BLOOD MAGE

Resource: **BLOOD MANA** 0–100. Tuotetaan: damagea tekemällä, vihollisia tappamalla, omasta HP:sta, Bleed-efekteistä.

# 24. BLOOD MAGE — RISK SYSTEM

HP → Blood Mana. Esim. Sacrifice: -10% HP, +30 Blood Mana. Risk/reward-class.

# 25. WITCH

Resource: **HEX POWER** 0–100. Syntyy curseista, debuffeista, vihollisten kärsimyksestä. Täynnä: **Grand Curse**.

# 26. WARLOCK

Resource: **CORRUPTION** 0–100. Skillien käyttö lisää Corruptionia (Dark Bolt +5, Demon Summon +20, Void Ritual +40). Kasvava Corruption: damage ↑, skill cost ↓, mutta incoming damage ↑.

# 27. SUMMONER

Resource: **SPIRIT** (pool 100) summonien ylläpitoon. Wolf 20, Bear 35, Ancient Spirit 60. Valinta: monta pientä summonia vai yksi suuri?

# 28. RANGER

Resource: **FOCUS** 0–100. Syntyy: ranged hits, critical hits, staying at range. Parantaa accuracy, crit, damage. Skillit kuluttavat Focusia.

# 29. BARD

Resource: **INSPIRATION** 0–100. Syntyy buffien antamisesta, onnistuneista comboista, ally actions. Käyttö: songs, buffs, team abilities, crowd control.

# 30. ALCHEMIST

Resource: **REAGENTS** (Fire, Frost, Poison, Arcane, Blood). Yhdistetään, esim. Fire + Poison → Explosive Venom.

# 31. MONK

Resource: **CHI** 0–100. Syntyy: attacks, dodges, perfect timing. Mahdollistaa Dash, Counter, Palm Strike, Chi Burst.

# 32. ASSASSIN

Resource: **SHADOW** 0–100. Kasvaa, kun pelaaja ei ota damagea, tappaa nopeasti, hyökkää takaapäin. Käyttö: invisibility, teleport, assassination, clones.

# 33. BERSERKER

Resource: **FURY**, kasvaa nopeasti mutta ei palaudu helposti. 0–30 Normal, 30–70 Enraged, 70–100 Blood Frenzy. Skillit voimistuvat korkealla Furylla.

# 34. SHAMAN

Resource: **ELEMENTAL POWER**, neljä kanavaa FIRE, WATER, EARTH, AIR. Elementaalinen kierto, esim. Water → Lightning → Storm.

# 35. ELEMENTAL MANA

Elementit samassa resurssijärjestelmässä: Mana → Fire, Frost, Lightning, Nature, Void.

# 36. RESOURCE OVERFLOW

Maksimissa ylimenevä energia → Overflow Charge. Kun Overflow täyttyy: **Overcharge**.

# 37. OVERCHARGE

Voi antaa: bonus damage, free spell, empowered spell, cooldown reset, AoE explosion. Resource management ei tunnu hukkaan menevältä.

# 38. RESOURCE SPENDING MODES

Fixed Cost (20 Mana) · Percentage (20% Maximum Mana) · All-In (consume all; voimakkuus riippuu käytetystä määrästä).

# 39. CHANNELING

Jotkut skillit kuluttavat manaa jatkuvasti (esim. Flamethrower 10 Mana/sec). Kun mana loppuu, skill pysähtyy.

# 40. CHARGED SKILLS

Pidempi charge = enemmän manaa = voimakkaampi skill (0.5s 25, 1.0s 40, 2.0s 70).

# 41. SKILL COMBOS

Esim. Frost Nova → Frozen → Fireball → Steam Explosion. **Combo skill economy.**

# 42. RESOURCE CONVERSION

Esim. HP → Blood Mana, Souls → Dark Mana, Rage → Energy. Paljon build-synergioita.

# 43. RESOURCE MODIFIERS

Relicit, traits ja items muuttavat resourcea: Mana Ring (+30 Maximum Mana), Blood Chalice (HP loss → Blood Mana), Spirit Crown (+25% Spirit generation).

# 44. RESOURCE REGEN MODIFIERS

+Mana Regeneration, +Mana Generation, -Skill Cost, +Maximum Resource, +Overflow, +Resource from Crit/Kill/Damage.

# 45. RESOURCE BUILD ARCHETYPES

Mana Battery (paljon max manaa) · Mana Engine (nopea regen) · Burst Caster (suuret skillit, hidas regen) · Infinite Loop (skillit tuottavat takaisin enemmän) · Glass Cannon · Sustain (resource + healing) · Overflow (maksimoi overcharge).

# 46. RESOURCE BREAKPOINTS

25% minor bonus · 50% empowered · 75% enhanced · 100% overcharge. Esim. Mage: mana > 75% → spells +10% damage; 100% → next spell Empowered.

# 47. RESOURCE STARVATION

Tyhjällä resurssilla ei skillejä, mutta pelaajalla on aina: basic attack, movement, basic defense, muu tapa rakentaa resourcea. Peli ei saa tuntua rikkinäiseltä.

# 48. RESOURCE UI

Selkeä: HP-palkki, MANA-palkki (68 / 100), skillit pikanäppäimineen.

# 49. CLASS-SPECIFIC UI

Mage: Mana Orb · Warrior: Rage Bar · Rogue: Combo Pips · Necromancer: Soul Counter · Blood Mage: Blood Gauge · Druid: Nature Wheel · Shaman: Element Wheel.

# 50. RESOURCE VISUAL FEEDBACK

Saadessa: flash, sound, particle, counter animation. Käyttäessä: bar vähenee, skill visual, sound. Täynnä: vahvempi visual feedback.

# 51. ULTIMATE RESOURCE

Ultimate voi käyttää erillistä **Ultimate Meteriä**, joka täyttyy damagesta, killeistä, healingista, skill usagesta, class-specific actioneista. Ultimate ei välttämättä käytä tavallista manaa.

# 52. DUAL RESOURCE CLASSES

Esim. Blood Knight: RAGE + BLOOD; Crimson Execution maksaa 30 Rage + 20 Blood. Syviä build-archetypeja.

# 53. RESOURCE SYNERGY

Mana Bloom (relic: every 50 Mana spent → summon a Bloom) · Blood Conversion (trait: every 100 damage taken → 10 Blood Mana) · Arcane Reservoir (card: Max Mana +25). Resource liittyy classiin, relicceihin, kortteihin, traitteihin, varusteisiin, synergioihin, progressioniin.

# 54. RESOURCE TAG SYSTEM

Resursseilla on tagit synergioita varten (Mana: Magic, Resource, Arcane; Blood: Resource, Life, Blood, Dark).

# 55. RESOURCE EVENTS

Esim. Ancient Spring: Drink (+50 Mana) tai Drink Deeply (+100 Maximum Mana, mutta Curse).

# 56. RESOURCE RELICS

Mana Crystal (+20 Max Mana) · Broken Hourglass (cooldowns -10%) · Blood Chalice (HP → Blood Mana) · Soul Lantern (kills → Souls) · Endless Flask (potion → Mana) · Heart of the Storm (Lightning skills → Energy).

# 57. RESOURCE MASTERIES

Arcane Mastery (+10% Mana generation, +10 Max Mana, +5% spell damage) · Blood Mastery (+15% Blood Mana generation, Blood skills heal +5%).

# 58. BALANCE RULES

Mana ei saa muuttua "käytä skill → odota". Hyvä loop: PLAY → GENERATE RESOURCE → USE SKILL → CREATE EFFECT → GENERATE MORE RESOURCE → POWER SPIKE.

# 59. BAD RESOURCE LOOP

Vältetään: USE SKILL → EMPTY → WAIT → WAIT → WAIT → USE SKILL.

# 60. UNIVERSAL SKILL DEFINITION

Skill: Identity, Resource Cost, Cooldown, Cast Time, Target, Range, Area, Damage, Healing, Status, Conditions, Resource Generation, Resource Consumption, VFX, SFX, Synergies.

# 61. HEARTHWOOD STUDIO INTEGRATION

Studioon **Resource Editor**: Mana, Rage, Energy, Spirit, Blood, Soul, Nature, Shadow, Focus, Combo, Chi, Corruption, custom resources.

# 62. RESOURCE EDITOR

Name, Maximum, Regeneration, Generation (esim. Spell Hit +3), Overflow (enabled, limit), Visual (Mana Orb), Sound.

# 63. CLASS EDITOR

Name, Primary Resource, Secondary Resource, Generation, Consumption, Conversion (HP → Blood), Ultimate.

# 64. SKILL EDITOR

Name, Cost, Cooldown, Damage, Area, Status, Resource Generation (+10 per enemy hit), Synergy tags.

# 65. RESOURCE SIMULATOR

Studioon resource-simulaattori: class, start, action, after, enemy hits, generated, final – näkee, toimiiko classin resource loop.

# 66. RESOURCE BALANCE DASHBOARD

Average Mana / Minute, Average Skill Usage, Average Empty Time, Average Resource Overflow, Average Ultimate Charge. Jos pelaaja on 35 % ajasta ilman resourcea → **WARNING: Resource starvation may be too high.**

# 67. MVP RESOURCE SYSTEM

* **Resource Engine:** Mana, Rage, Energy, Spirit, Blood, Soul
* **Skill System:** mana cost, cooldown, resource generation, resource thresholds, basic skill, ultimate
* **UI:** resource bar, skill icons, cost display, cooldown display, ready state
* **Editor:** Resource Editor, Class Editor, Skill Editor

# 68. FUTURE RESOURCE SYSTEM

Custom resources, dual resources, resource conversion, overflow, corruption, stealing, sharing, drain, locking, suppression, stealing from enemies, environmental resources, resource combos, resource reactions, resource-based transformations.

# 69. FINAL DESIGN PRINCIPLE

Hearthwoodissa mana ei ole vain sininen palkki. Mana on **classin identiteetti.** Mage hallitsee Arcanea, Warrior rakentaa Ragea, Rogue rakentaa Comboa, Necromancer kerää Souls, Blood Mage uhraa HP:tä Blood Manaksi, Druid kierrättää Naturea, Summoner hallitsee Spiritiä, Shaman yhdistää elementtejä.

# 70. CORE FORMULA

CLASS → RESOURCE → RESOURCE GENERATION → SKILLS → COMBOS → SYNERGIES → BUILD → PLAYSTYLE

Tavoitteena on, että pelaaja pystyy tunnistamaan classin jo sen resource-järjestelmästä.

> **Don't just give every class mana.**
>
> **Give every class a unique relationship with power.**

Hearthwoodin manajärjestelmän pitää tehdä jokaisesta classista erilainen, mutta pitää kaikki classit saman teknisen Skill/Resource Engine -järjestelmän sisällä.
