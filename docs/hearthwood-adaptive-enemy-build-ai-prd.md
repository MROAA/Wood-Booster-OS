# Hearthwood — Adaptive Enemy Build AI (Act II)

> **Status: north-star vision, pre-production. Target: Act II, unlocked after the tutorial.**
> Marc's PRD for an enemy AI that builds its *own* strategic team using the same
> mechanics the player has — units, roles, shop, economy, upgrades, items,
> relics, synergies, positioning. It sits on top of the role/build/upgrade
> systems in `docs/hearthwood-unit-roles-build-system-prd.md` and
> `docs/hearthwood-strategic-upgrades-prd.md`. **Not built yet** — nothing in
> this doc ships in the upgrade-branches round; it's logged here as the direction
> Act II is heading.
>
> **Core rule (§57):** *"Älä tee vihollisesta vahvempaa. Tee vihollisesta
> älykkäämpi."* — don't make the enemy stronger, make it smarter. The player
> should lose and think *"its build worked better than mine"*, never *"it cheated"*.
>
> Marc's document, condensed but faithful (all 59 sections, repetitive ASCII trimmed).

---

## 1–3. Vision & unlock

Act I / tutorial teaches the mechanics. **Act II: the opponent starts building.**
The enemy AI selects units, builds a role distribution, hunts synergies, uses
the shop and economy, levels units and picks upgrades, buys items, builds carry
units, reacts to the player's build, spots its own weaknesses, and shifts
strategy mid-run. The goal is not a perfect AI — it's a **believable tactical
opponent**.

## 2. Design principle — AI plays by the player's rules

**AI may NOT normally:** create free gold, get free units, skip shop rules, see
hidden info, get impossible upgrades, use a mechanic the player lacks.
**AI may use:** units, roles, upgrades, items, relics, synergies, shop, economy,
positioning, combat mechanics. This makes the opponent fair.

## 4. Enemy identity

Each intelligent enemy has: Enemy Identity → Personality → Strategic Preference →
Build Preference → Combat Preference. Examples:
- **The Rootkeeper** — Tank / Healing / Shield / Sustain
- **The Thorn Witch** — Poison / DoT / Debuff / Scaling
- **The Hollow Hunter** — Assassin / Burst / Backline targeting / Crit

## 5. Multiple archetypes

The AI can choose among: Tank Wall, Glass Cannon, Poison, Summon, Control,
Sustain, Burst, Economy, Scaling, Hybrid — and can switch direction mid-run.

## 6–8. Build generation & the two brains

Loop: **Observe → Evaluate → Choose Direction → Shop → Build → Upgrade → Fight →
Analyze → Adapt.** The build is not finished before the first fight; it evolves.
Split into:
- **EnemyBuildBrain** — build design, unit selection, role balance, synergy
  evaluation, upgrade & item selection, economy decisions. Not combat execution.
- **EnemyTacticalBrain** — positioning, target priority, combat adaptation,
  frontline placement, backline protection, threat evaluation.

## 9–11. Memory & player-build analysis

The AI keeps **memory** of what it observed about the player (role counts,
detected synergies, detected weakness) — only what the mechanics let it see, no
future shop rolls, no hidden picks. From it, it forms a **Player Build Analysis**
(frontline / damage / healing / control / scaling ratings, detected core,
detected weakness) and may try to **counter-build**.

## 12. AI does not always counter

Critical: the AI must **not** always respond perfectly to the player's build, or
the game feels cheating. It weighs `Own Build Strength + Available Resources +
Player Threat + Counter Opportunity + Risk` — e.g. *70% continue own build / 30%
adapt to player* (tunable).

## 13–15. Commitment, confidence, core

Once a build reaches enough synergy the AI should stop flip-flopping.
**BuildConfidence** (0.20 experimenting → 0.50 possible → 0.80 committed → 0.95
core) — higher confidence, less direction-changing. The AI seeks a **Core Unit +
Core Synergy + Core Mechanic** and picks other units to support it.

## 16–17. Role balancing & failure detection

The AI rates its own team's roles (Tank/DPS/Healer/Support/Control counts →
frontline/damage/healing/control/scaling ratings). A missing Tank → "frontline
CRITICAL" → prioritise a Tank next shop. After a fight, from
damage-dealt/taken/deaths/healing it can conclude e.g. *"enough damage, too
little sustain"* → next-shop priority Healer / Shield / Tank upgrade.

## 18–21. Economy AI

Same economy system as the player: decide BUY / SAVE / REROLL / UPGRADE / SELL —
not always spend immediately. **Economic personalities:** Hoarder / Gambler /
Investor / Tempo / Adaptive. The **Shop Decision Engine** scores each option:
`Unit + Role + Synergy + Upgrade + Counter + Future value − Economic cost`, and
weighs **Future Value** ("what does this enable in later rounds?"), not just this
round.

## 22–25. Upgrade & item AI

Upgrade AI scores the branch options against its own build (a Poison build picks
the poison-synergy branch). **Adaptive upgrades:** if the player counters (heavy
cleanse), the AI can pivot the *next* upgrade (poison scaling → direct damage).
Item AI scores `Best Unit + Best Role + Best Synergy + Best Timing`, not the
biggest stat bonus — e.g. an anti-heal item is "medium" normally, "very high"
against a healing player. **Timing:** defensive item before a boss, economy item
early, burst item just before an elite.

## 26. Positioning AI

EnemyTacticalBrain builds the formation around tank position, healer protection,
DPS safety, and the enemy's threats (AoE / assassin / ranged). A backline
assassin on the player's side → AI shifts its healer.

## 27–28. Combat learning & reflection

Post-battle analysis: win/loss, damage, healing, deaths, targets, overkill,
control, positioning → updates strategy. Internal reflection e.g.
`BUILD: strong / FAILURE: healer died early / CAUSE: backline exposed / ACTION:
protect healer / NEXT PRIORITY: Tank, Positioning` — not shown to the player as
raw data.

## 29. Enemy personality

**Aggressive** (favours DPS, spends fast, accepts risk) · **Defensive**
(Tank/Healer, saves, builds sustain) · **Clever** (favours counters, uses
control, changes strategy) · **Wild** (high variance, unusual builds, high risk).

## 30–32. Difficulty & imperfection

Difficulty must **not** be just `+50% HP / +50% Damage` — it affects
decision-making. **Easy** makes mistakes, sees only obvious synergies, reacts
slowly. **Normal** builds a working team, uses economy. **Hard** spots build
weaknesses, uses counters, optimises upgrades. **Expert** plans several rounds
ahead, uses advanced synergies, reacts to the player. And the AI must sometimes
pick the 82-value option over the 85-value one — *a believable AI is fun, a
perfect AI is not*. **No cheating** (§32): if the AI needs to be harder, raise
decision quality before numbers.

## 33–35. Enemy build visibility

The player does not see the AI's internal reasoning, but does see enemy units /
roles / upgrades / items / formation — enough to infer *"it's building Poison"*.
Optional readable-intent hints: *"Enemy is strengthening its frontline"* /
*"The enemy is gathering Poison units"*. The point isn't harder enemies — it's
**Player Build vs Enemy Build**, both building, both evolving, both trying to
solve each other's weaknesses.

## 36–39. Act II loop & roguelite hooks

New loop: `SHOP → BUILD → COMBAT → OBSERVE ENEMY → ANALYZE ENEMY BUILD → ADAPT →
SHOP → UPGRADE → COMBAT`. Different Act II biomes carry different AI profiles
(Autumnwood → Sustain/Nature, Frostroot → Control/Defense, Sunspire →
Burst/Aggression, Mirefall → Poison/Debuff). Elites get **Build AI Level 2 +
advanced adaptation**; bosses get **Level 3 + a unique strategy** — a boss can be
a *whole build* (The Root King: core Ancient Oak, tank-heavy, "outlast the player").

## 40–41. Data models

```json
// Build Archetype
{ "archetype": "poison_control", "preferredRoles": ["debuffer","control","dps"],
  "preferredTags": ["poison","mire","dot"], "economyStyle": "adaptive",
  "riskTolerance": 0.65, "counterPriority": 0.55 }

// AI Build State
{ "enemyId": "thorn_witch",
  "build": { "coreUnit": "poison_witch", "primaryArchetype": "poison", "secondaryArchetype": "control" },
  "roles": { "tank": 1, "dps": 2, "healer": 1, "support": 1, "control": 1 },
  "confidence": 0.82, "riskTolerance": 0.65, "adaptationLevel": 0.70 }
```

## 42–44. Decision pipeline

`GAME STATE → Enemy Observation → Own Build Analysis → Player Build Analysis →
Economy Analysis → Available Options → Utility Scoring → Risk Evaluation →
Strategic Decision → Action`. Each decision:
`Score = ImmediateValue + SynergyValue + FutureValue + CounterValue + RoleValue −
EconomicCost − Risk`, weighted by personality.

## 45–47. Adaptation limits

**Build Inertia:** the further a build has developed, the higher the cost of
changing strategy. A **Failure Counter** rises on repeated losses → the AI asks
*"is the build fundamentally broken?"* → **Emergency Adaptation** (buy a
defensive item, move DPS, upgrade Tank) only if yes; otherwise continue.

## 48–49. Fairness & player experience

AI strength comes from **better decisions / build understanding / timing /
positioning / adaptation** — not primarily stat inflation. Target feelings:
tutorial "I learned how Hearthwood works" → Act II "the enemy uses the same rules
against me" → mid "it's building Poison" → late "it noticed my healer is the core
of my build" → boss "I have to rebuild my whole build to beat this".

## 50–53. Architecture

```
EnemyAI/
 ├─ EnemyBuildBrain      (what to build)
 ├─ EnemyTacticalBrain   (how to fight)
 ├─ EnemyEconomyBrain    (what to spend on)
 ├─ EnemyShopBrain       (what to buy)
 ├─ EnemyUpgradeBrain    (how to develop units)
 ├─ EnemyAdaptationBrain (how strategy changes)
 ├─ EnemyMemory          (what it learned)
 ├─ EnemyPersonality
 ├─ BuildAnalyzer / PlayerBuildAnalyzer
 ├─ SynergyEvaluator / RoleEvaluator / ThreatEvaluator
 └─ DecisionEngine
```

**AI-first, not ML-first (§53):** the first version is a *deterministic strategic
AI* — `Game State + Rules + Utility Scoring + Memory + Personality + Randomness`
— debuggable, balanceable, predictable, testable, fast, offline. ML/LLM
components can be layered onto the decision layer later without rebuilding combat.

## 54–56. Later & anti-repetition

Future: strategic AI + simulation + ML ("if I buy this unit, how does my build
perform over the next 3 rounds?") — not in the Act II MVP. **Anti-repetition:**
the same enemy must not always build the same thing — a Poison archetype may
grow into Poison+Control, Poison+Sustain, or Poison+Assassin.

## 52. Act II MVP

5 build archetypes · 5 personalities · role evaluation · synergy evaluation ·
shop decisions · economy decisions · upgrade decisions · positioning · basic
player-build analysis · basic countering · post-battle adaptation. **Not yet:**
real ML, account-level learning, free strategy generation, RL.

## 55. Telemetry

Enemy build win/loss rate · shop-decision quality · upgrade choice · role
distribution · counter success · adaptation frequency · economy efficiency ·
positioning efficiency — for balancing the AI.

## 57–59. The design outcome

The important rule: **make the enemy smarter, not stronger.** Act II changes
Hearthwood from *Player vs Encounter* to *Player Build vs Enemy Build* (and later
*Build vs Build vs Environment*). The Act II enemy is not an obstacle — it's
another player operating inside Hearthwood's own rules: *a tactical AI strategist
you try to read before it reads you.*
