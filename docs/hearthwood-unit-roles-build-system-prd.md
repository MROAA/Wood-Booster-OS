# Hearthwood — Unit Roles, Build System & Strategic Upgrades V1

> **Status: north-star vision, delivered one slice per round.**
> Marc's PRD for the tactical team-building / unit-identity layer — roles
> (Tank / DPS / Healer / Support / Control / Debuffer, secondary Assassin /
> Summoner / Economy), per-unit identity (primary + secondary role, strengths,
> weaknesses, synergy tags, preferred position, upgrade paths), build archetypes,
> a build-evaluation layer, and positioning as a role mechanic. It builds on the
> earlier `docs/hearthwood-strategic-upgrades-prd.md` — not a single build target.
>
> **Shipped so far against this PRD:**
> - **Upgrade branches** (`feat/hearthwood-upgrade-branches`) — sections **14, 15, 38**:
>   a unit's level-up is now a choice of one of **Power / Defense / Synergy /
>   Utility / Economy** (`src/data/heartwood/upgrades.js`), recorded on
>   `bench[].upgrades`, folded at battle start. The pick-once rule (only Power
>   repeats) is the "power budget". `UpgradeChoice.jsx` overlay + ▲ chips on the
>   bench card.
>
> **Not yet built:** the role/tag data model (§27–29), the build-evaluation
> layer / build score (§18, §30–31), positioning-as-role-mechanic (§20–21),
> breakpoint upgrades (§25), counterplay tags (§33). Those are later slices.
>
> Everything below is Marc's original document, preserved verbatim.

---

**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy
**Core identity:** *Cosy tactics with deep synergy*

---

# 1. Vision

Hearthwoodin yksiköt eivät ole vain erilaisia stat-paketteja.

Jokaisella yksiköllä pitää olla **oma tehtävänsä taistelussa**.

Pelaajan pitäisi pystyä katsomaan omaa joukkuettaan ja ymmärtämään:

* kuka ottaa vahingon
* kuka tekee vahinkoa
* kuka parantaa
* kuka suojaa
* kuka kontrolloi vihollisia
* kuka vahvistaa muita
* kuka rakentaa resursseja
* kuka skaalautuu pitkissä taisteluissa
* kuka toimii tietyn synergiabuildin ytimenä

Buildin voima ei synny yhdestä ylivoimaisesta yksiköstä.

**Buildin voima syntyy yksiköiden välisestä suhteesta.**

---

# 2. Design Principle

Hearthwoodin yksikön suunnittelussa käytetään viittä kerrosta:

```text
UNIT
 │
 ├── Role
 │    ├── Primary Role
 │    └── Secondary Role
 │
 ├── Strengths
 │
 ├── Weaknesses
 │
 ├── Synergies
 │
 └── Upgrade Paths
```

Esimerkiksi:

```text
Moss Guardian

Primary Role: TANK
Secondary Role: SUPPORT

Strengths:
+ High HP
+ Taunt
+ Damage mitigation
+ Protects adjacent allies

Weaknesses:
- Low damage
- Slow
- Weak against poison

Synergies: Forest / Guardian / Nature / Shield

Upgrade Paths: Guardian / Thornwall / Ancient Oak
```

---

# 3. Core Combat Roles

## 3.1 TANK

Ottaa vahinkoa, suojaa muita, ohjaa vihollisten hyökkäyksiä, pitää taistelulinjan kasassa. Tank ei saa olla vain "paljon HP:tä" — sillä pitää olla **aktiivinen suojausmekaniikka** (Taunt, Guard, Shield, Damage Reduction, Damage Redirect, Barrier, Intercept, Frontline bonus, Ally protection, Retaliation).

```text
ROOTGUARD
Role: Tank
Passive: Adjacent allies receive 15% less damage.
Ability: Guard the weakest ally for 3 seconds.
Weakness: Low damage output.
Upgrade: ROOT WALL — Guard also grants the protected ally a shield.
```

# 4. DPS — jaettu alatyyppeihin

- **4.1 BURST** — suuri vahinko lyhyessä ajassa; boss damage, crits, execution. Heikkous: pitkä cooldown, heikko puolustus.
- **4.2 SUSTAIN** — tasainen vahinko pitkällä aikavälillä; attack speed, stacking damage, bleed, poison, burn, escalating damage.
- **4.3 AOE** — useita vihollisia; swarmit, board control. Heikkous: pienempi single-target.
- **4.4 ASSASSIN** — tärkeän vihollisen tappaminen; backline targeting, crit, execute, mark, stealth, first-hit bonus.

# 5. HEALER — archetypet

DIRECT HEALER · HOT (heal over time) · SHIELD HEALER (healing → shield) · REACTIVE HEALER (kun liittolainen putoaa HP-rajan alle) · SUPPORT HEALER (vähemmän healingiä + buffeja) · SACRIFICE HEALER (oma HP muiden parantamiseen).

# 6. SUPPORT

Tekee **muista yksiköistä parempia**: Attack Speed, Damage Buff, Armor Buff, Healing Power, Cooldown Reduction, Energy generation, Critical Chance, Positioning, Resource generation.

# 7. CONTROL

Muuttaa taistelun kulkua: Stun, Slow, Silence, Root, Knockback, Blind, Freeze, Interrupt, Taunt, Disarm. Heikko suorassa damage-vertailussa, vahva oikeassa buildissa.

# 8. DEBUFFER

Heikentää vihollisia: −Armor, −Attack, −Healing received, −Attack speed, −Movement, −Resistance. Toimii erityisesti DPS-buildien kanssa.

# 9. SUMMONER

Kutsuu spirits / wolves / roots / mushrooms / insects / forest guardians / temporary creatures. **Kutsutut yksiköt eivät ole tavallisia yksiköitä — ne ovat osa buildin mekaniikkaa.**

# 10. ECONOMY UNIT

```text
GOLDEN SQUIRREL
Role: Economy / Support
Passive: Generates 1 acorn every 2 rounds.
Upgrade: Each 3rd acorn grants +1 shop refresh.
```

Heikko taistelussa, strategisesti arvokas.

# 11. HYBRID ROLES

Kaksi roolia sallittu (Tank/Support, DPS/Assassin, DPS/Debuffer, Healer/Support, Tank/Control, Summoner/DPS, Support/Economy). **Hybridi ei saa olla paras molemmissa — sen pitää olla kompromissi.**

# 12. ROLE POWER BUDGET

```text
Tank:    80% defense / 20% damage
DPS:     80% damage / 20% utility
Healer:  70% healing / 30% support
Support: 30% damage / 70% team utility
Hybrid Tank/DPS: 60% defense / 40% damage
```

Estää tilanteen jossa yksi yksikkö tekee kaiken.

# 13. UNIT IDENTITY

Jokaisella yksiköllä: 1. Primary Role · 2. Secondary Role · 3. Strength · 4. Weakness · 5. Synergy · 6. Upgrade Identity.

# 14. UNIT UPGRADE SYSTEM

Nykyistä level- ja upgrade-mekaniikkaa **ei korvata — sitä laajennetaan.** Yksikkö saa leveliä nykyisen progression kautta, mutta level-up voi antaa **strategisen valinnan**:

```text
LEVEL 2 — Choose an upgrade:
[ GUARDIAN ]   + stronger shields / better protection
[ THORNBORN ]  + attackers receive damage
[ ROOTHEART ]  + regenerates HP over time
```

Sama yksikkö voi kehittyä eri tavoin eri runissa.

# 15. UPGRADE PATHS

Jokaisella merkittävällä yksiköllä 2–4 upgrade pathia:

- **POWER** — päätehtävän vahvistaminen
- **DEFENSE** — lisää selviytymistä
- **SYNERGY** — vahvistaa tribe/keyword/build-yhteyksiä
- **UTILITY** — uusi taktinen toiminto

# 16. EXAMPLE: SAME UNIT, THREE BUILDS

**MOSS GUARDIAN** (base: Tank, "Protect adjacent allies")
- **IRONBARK** — +Armor / +HP / +Damage Reduction → **Pure Tank**
- **THORNBARK** — kun blockaa vahinkoa, tekee Thorn-vahinkoa hyökkääjään → **Tank / DPS**
- **ROOTHEART** — joka kerta kun suojaa liittolaista, liittolainen saa regenin → **Tank / Support**

# 17. BUILD ARCHETYPES

CLASSIC BALANCED (2 Tank / 2 DPS / Healer / Support) · GLASS CANNON (Tank / 3 DPS / Support / Assassin) · SUSTAIN (Tank / 2 Healer / Support / 2 DPS) · CONTROL (Tank / 2 Control / Debuffer / DPS / Support) · POISON FOREST (Tank / 2 Poison DPS / Debuffer / Healer / Support) · SUMMONER (Tank / 2 Summoner / Support / Healer / DPS).

# 18. BUILD SCORE

Ei yhtä lukua ("POWER = 94"). Useita ominaisuuksia: SURVIVABILITY / DAMAGE / SUSTAIN / CONTROL / SYNERGY / ECONOMY / SCALING — pylväsdiagrammina. Auttaa pelaajaa ymmärtämään oman buildinsa identiteetin.

# 19. UNIT SYNERGY MATRIX

```text
TANK → protects → HEALER → keeps alive → DPS → kills enemies
Support → buffs DPS
Debuffer → amplifies DPS
Control → creates safe window
Healer → enables Tank
Tank → protects Healer
Economy → enables stronger upgrades
```

# 20. POSITIONING AS ROLE MECHANIC

Front = Tankit · Middle = Support/bruiser/healer · Back = DPS/healer/ranged. Väärä sijoittelu voi rikkoa muuten hyvän buildin.

# 21. ROLE + POSITION

Yksikölle määritellään Preferred Position + Secondary Position (esim. Ancient Oak: Preferred Front, Secondary Center, Never Back).

# 22. UNIQUE STRENGTHS

Jokaisella yksiköllä vähintään yksi asia jossa se on erityisen hyvä (best frontline protection / best single-target / best healing / best poison application / best summon scaling / best economy generation).

# 23. WEAKNESSES ARE REQUIRED

Jokaisella yksiköllä vähintään yksi merkittävä heikkous (High DPS → low HP; Great healer → low damage; Strong tank → slow; Strong control → low scaling; Strong economy → weak combat; Summon build → vulnerable to AOE).

# 24. UPGRADE TRADE-OFFS

Ei aina +10%/+10%/+10%. Parempi: `+25% damage BUT −15% defense`; `Healing affects 2 targets BUT reduced amount`; `Taunt lasts longer BUT unit attacks slower`.

# 25. BREAKPOINT UPGRADES

Jotkin upgradet muuttavat yksikön toimintaa kokonaan:

```text
LEVEL 3
NORMAL:     Protect adjacent ally.
BREAKPOINT: Protect all allies in same row.

Poison attacks → at 5 Poison stacks: EXPLOSION
```

# 26. COMBO BUILDS

```text
POISONER (applies Poison)
+ MYCELIUM HEALER (heals allies whenever Poison damage occurs)
+ FOREST WITCH (increases Poison stacks)
+ TANK (keeps everyone alive)
```

Poison ei ole vain debuff — se on **buildin moottori**.

# 27. ROLE TAGS

Jokaisella yksiköllä koneellisesti määriteltävät tagit:

```json
{ "roles": ["tank", "support"], "tags": ["frontline", "shield", "forest", "guardian"] }
```

Käytetään: synergioissa, upgradeissa, tuotteissa, relicsissä, shopissa, AI-analyysissä, tooltipissä, build recommendationissa, balance-analyysissä.

# 28. UNIT DATA MODEL

```json
{
  "id": "moss_guardian",
  "role": { "primary": "tank", "secondary": "support" },
  "stats": { "health": 100, "attack": 12, "armor": 20, "speed": 0.7 },
  "strengths": ["protection", "survivability"],
  "weaknesses": ["low_damage", "slow"],
  "tags": ["forest", "guardian", "shield"],
  "preferredPosition": "front",
  "upgradePaths": ["guardian", "thornbark", "rootheart"]
}
```

# 29. UPGRADE DATA MODEL

```json
{
  "id": "moss_guardian_thornbark",
  "unitId": "moss_guardian",
  "path": "thornbark",
  "level": 2,
  "effects": [ { "type": "reflect_damage", "value": 0.15 } ],
  "tradeoff": { "type": "attack_speed", "value": -0.1 }
}
```

# 30. BUILD ENGINE

Build Evaluation Layer — ei pelaa peliä pelaajan puolesta, vaan ymmärtää "what is this player building?" (Primary: Forest/Poison; Roles: Tank 1 / DPS 2 / Healer 1 / Support 1; Missing: Backline protection; Strength: Excellent scaling; Weakness: Low burst damage). Näytetään myöhemmin System Pulse / Spacemonkey -integraation kautta.

# 31. BUILD COMPLETENESS

Arvioi: Frontline · Damage · Sustain · Control · Scaling · Synergy · Economy.

# 32. NO REQUIRED META COMPOSITION

Peli ei pakota "1 Tank / 1 Healer / 4 DPS". `3 Tank / 1 Support / 2 DPS` voi olla validi. Tasapaino syntyy **trade-offeista, ei pakollisesta kompositiosta.**

# 33. COUNTERPLAY

Jokaisella buildillä counter: High Armor Tank ← Armor penetration; Glass Cannon ← Assassin; Summoner ← AOE; Heavy Healing ← Anti-heal; Poison ← Cleanse; Control ← Resistance.

# 34. BUILD EVOLUTION DURING RUN

Early: löydä Tank → DPS → synergia. Mid: upgrade core → add support → commit. Late: optimize roles → upgrade key units → solve weakness.

# 35. CORE UNIT

1–2 Core Unitia joiden ympärille build muodostuu (esim. Poison Witch coreksi, muut sen ympärille).

# 36. CARRY UNIT

Käyttää suuren osan buildin resursseista: Tank protects Carry, Healer sustains Carry, Support buffs Carry, Debuffer amplifies Carry, Carry kills enemies.

# 37. SUPPORT CORE

Kaikkien buildien ei tarvitse olla DPS-carry: "Tank Core" (koko joukkue tukee yhtä kestävää tankkia) tai "Summon Core" (Summoner on moottori).

# 38. UNIT LEVELING

Levelit säilyvät. Level-up antaa myös **IDENTITY CHOICE**:

```text
LEVEL 2 — Choose:
⚔ POWER   🛡 GUARDIAN   🌿 SYNERGY
```

# 39. UPGRADE VISIBILITY

Pelaajan pitää nähdä nopeasti: Unit / Tank·Support / LEVEL 3 / BUILD: Thorn Guardian / Strength ★★★★★ Defense / Weakness ★★ Damage / Synergies: Forest·Shield·Guardian. Ei pitkiä tekstejä.

# 40. SHOP INTEGRATION

Shopissa roolit selkeästi: `MOSS GUARDIAN 🛡 TANK 🌿 FOREST — 12 GOLD — Synergy: Shield/Guardian/Forest`. Tuotteet: `THORN HEART — Best for Tank/DPS — Synergy: Thorn/Guardian`.

# 41. ITEM + ROLE INTERACTION

Tuotteet eivät anna vain yleisiä statuksia: `Guardian's Bark` (Tank: +Armor / DPS: reduced effect); `Bloodroot` (DPS: gain damage below 50% HP / Healer: healing restores additional HP).

# 42. STRATEGIC SHOP QUESTION

Joka kierros: **"Parannanko nykyistä buildia vai korjaanko sen heikkoutta?"** Paras ostos ei aina ole uusi DPS — Healer voi olla arvokkaampi.

# 43. BUILD SYSTEM GOAL

Pelaaja voi sanoa "tämä on minun Poison Tank -buildini" / "rakennan Summoner-control buildia" / "tämä yksikkö on minun carryni" — ei vain "minulla on kuusi hyvää yksikköä".

# 44. CORE DESIGN RULE

Yksikön suunnittelun testi: 1. Mitä tämä yksikkö tekee? 2. Miksi juuri tämä kannattaa ottaa? 3. Mikä on sen heikkous? 4. Minkä buildin kanssa se toimii? 5. Miten pelaaja voi kehittää sitä? — Jos selkeää vastausta ei saada, yksikköä ei hyväksytä tuotantoon.

# 45. MVP

**Roles:** Tank / DPS / Healer / Support / Control / Debuffer. **Secondary:** Assassin / Summoner / Economy.
**Unit system:** primary role, secondary role, strength, weakness, preferred position, synergy tags, level progression, 2–3 upgrade paths.
**Build system:** frontline, backline, carry, core unit, support, build synergy.

# 46. PHASE 2

hybrid roles · advanced positioning · counter mechanics · breakpoint upgrades · complex combo builds · summon builds · economy builds · dynamic build evaluation.

# 47. PHASE 3

unique legendary upgrade paths · build-specific relics · advanced shop interactions · biome-specific build mechanics · boss-specific counters · run-specific build mutations.

# 48. ACCEPTANCE CRITERIA

Järjestelmä hyväksytään kun: jokaisella yksiköllä on selkeä primary role · vähintään yksi selkeä vahvuus · vähintään yksi merkittävä heikkous · vähintään yksi meaningful synergy · level-up voi muuttaa build-identiteettiä · sama yksikkö voi päätyä eri upgrade-poluille · Tank ei ole vain HP-paketti · DPS ei ole vain attack-stat · Healer ei ole vain heal-nappi · Support vaikuttaa muiden toimintaan · positioning vaikuttaa rooleihin · tuotteet voivat vahvistaa eri rooleja · buildillä voi olla useita valideja kompositioita · pelaaja voi rakentaa selkeän carry/core-unitin · buildillä on selkeitä vahvuuksia ja heikkouksia · counterplay on mahdollista · järjestelmä toimii nykyisten level-, upgrade-, item-, relic-, tribe- ja synergy-mekaniikkojen kanssa.

# 49. FINAL DESIGN PHILOSOPHY

Yksiköiden ei pitäisi tuntua korteilta joiden numeroita nostetaan — vaan **metsän hahmoilta joilla on oma tehtävä.**

> Tank: "Minun takanani olet turvassa."
> DPS: "Anna minulle aikaa ja minä tapan vihollisen."
> Healer: "Pidän tämän joukkueen hengissä."
> Support: "Minun voimani tekee muista parempia."
> Control: "Minä päätän milloin vihollinen saa toimia."
> Summoner: "Minä tuon lisää metsää taisteluun."

**Hearthwoodin todellinen build ei ole yksikkölista. Build on järjestelmä, jossa jokainen yksikkö tekee jotain, joka mahdollistaa jonkin toisen yksikön toiminnan.**
