# Hearthwood — Battlefield plan: the living forest

The art-direction and build plan for the tactics battlefield, made from Marc's
PRD *"Taistelun visuaalinen maailma" (Combat Visual Identity v1.0)* plus his
standing direction (2026-10-18):

- the field is full of forest things — stones, moss, leaves, roots, trees,
  mushrooms — and **every one of them gives a strategic choice**;
- **everything can be destroyed and manipulated**, so the field changes during
  the fight — *"siitä syntyy strategiaa"*;
- it is a **platform for theme-based generation**: biomes are data, so new
  themes and new forest pieces can be added for years without rewriting the
  generator;
- careful, polished, zero known defects; the result is developed further.

Read together with `docs/hearthwood-visual-theme.md` (Nordic forest theme,
palette, runes, English-only game text, one plain cursor).

---

## 1. The idea in one breath

You are looking down at a small magical world in an ancient forest. The floor
is moss, leaves and roots; stones and old trees stand in it; mushrooms glow.
Every piece is something you can **use, break, burn or move** — and the enemy
can too. The centre of the fight always stays readable: units first, forest
second.

## 2. The four visual layers (PRD §2)

| Layer | What | Rule |
|---|---|---|
| 1 Forest floor | painted ground, biome-tinted; moss/leaf/root **ground tiles** | continuous, low contrast, never louder than units |
| 2 Natural forms | stones, trees, stumps, logs, mushrooms (objects); framing roots/stones outside the grid | frames the field, adds depth; objects sit on a soft ground patch with a contact shadow (#633) |
| 3 Living magic | glowcap glow, drifting spores, fireflies, falling leaves, ability FX | clearly separate from the floor; few at a time |
| 4 Units | heroes, shadows, target rings, health, combat animation | ALWAYS on top and always readable |

**Breathing room:** generated forest pieces never go in the deploy/spawn
columns and never cut every route across; decor never covers a unit, a health
number or a telegraph.

## 3. Forest pieces — each one a choice

Ground tiles can be walked on; objects block and have HP. Every piece has: a
rule a player can read in one line, art, a tooltip, and a way to be destroyed.

| Piece | Kind | Strategic use | How it is destroyed / changed |
|---|---|---|---|
| **Moss** | ground | ending your turn on it heals 1 — little healing spots worth holding | fire → ash; heavy impacts tear it up → bare ground |
| **Dry leaves** | ground | tinder: fire **flares** across connected leaves at once, burning whoever stands in them — a trap to lure enemies into | fire → flare → ash; impacts scatter them → bare ground |
| **Roots** | ground | cost 2 to cross; ending a move in them **snags** you (no more moving this turn) — slows charges, makes chokepoints | fire burns them away → ash; impacts → bare ground |
| **Runestone** (mossy standing stone) | object, 10 HP | FULL cover that lasts — the strongest shelter on the field | smashed → rubble (half cover) |
| **Glowcap** (glowing mushroom cluster) | object, 1 HP | break it and healing spores heal **every** unit in the 3×3 (yours AND theirs) — pop it at the right moment | any hit pops it; leaves moss behind |
| Tree (existing) | object | full cover; chop it to fall and crush 2 tiles | falls → log + stump; burns → ash |
| Tall grass (existing) | ground | can't be targeted from range; half cover | burns → ash; impacts flatten it → bare ground |
| Rocks (existing) | ground | rough (cost 3), full cover next to it | heavy impacts break them → rubble |
| Fallen log / stump (existing) | ground | half cover | burn → ash; impacts splinter → bare ground |
| Barrel, spore pod, boulder, ice pillar (existing) | object | explode / roll / shatter | as before |

**Heavy impacts** = an explosion, a falling tree, a rolling boulder, a
shattering ice pillar. **Fire** = flames, burning trees, fire attacks.

### Break-down chains — big things become smaller things
Marc: *"spellit voi rikkoa puita… niistä tulee oksia tai pienempiä asioita"*.
Spells and attacks break things **in stages**, and every stage is still a
piece you can use:

- tree → (chopped / blasted by a spell) fallen log + stump → log splinters
  into **branches** (walkable, half cover, very flammable) → ash or bare ground
- runestone → rubble (half cover) → gravel (bare, no cover)
- boulder → rubble → gravel
- glowcap → moss
- tall grass / leaves / roots → ash (fire) or bare ground (impact)

**Spells hit the forest:** area spells, blasts and fire/frost abilities damage
the objects in their area, so a well-aimed spell can strip an enemy's cover or
drop a tree on them.

**Different terrain, different manipulation** (Marc: *"eri maastotyyppejä joita
voi manipuloida eri tavoin"*): trees are chopped and fall; boulders are shoved;
leaves flare; grass and roots burn; moss is damp and stops fire; water freezes;
ice pillars go brittle and shatter; barrels and pods explode; glowcaps pop;
runestones only crack slowly.

### How destruction is built (extensible)
Two data tables in `tacticsForest.js` decide what every tile becomes:
- `BURNS_TO` — what fire turns a tile into (and whether it flares);
- `CRUSHES_TO` — what a heavy impact turns a tile into.
A new piece = one entry in `TERRAIN` + `TERRAIN_INFO`, optional entries in
these tables, one art function. No engine change.

### Manipulation (now and next)
Now: chop trees to fall where you want, shove boulders (runestones stay put —
they are the field's anchors), burn leaves/roots to open paths or set traps,
pop glowcaps, freeze water into bridges, smash cover away from enemies.
Next (later pieces): class skills that *shape* the forest — grow roots or moss
(druid-type heroes), kick leaves onto a tile, plant a glowcap, topple a stone.

## 4. Biomes — theme-based generation (PRD §4)

`src/data/heartwood/battleBiomes.js` is the single source. Each biome is data:

```
{ id, name, mood,
  palette: { floor, moss, accent, light },   // Layer 1 tint (CSS tokens)
  dressing: [{ type, min, max }],            // forest pieces the generator scatters
  ambient: ["leaves", "fireflies", "glowcaps"], // Layer 3 life (piece 3)
  acts: [1, 2] }                             // where it appears
```

The generator (`generateForestDressing`) reads the biome for the fight's Act and
scatters its pieces on free middle tiles with its **own seeded stream**
(`${node}:forest`), so the same seed = the same forest, and the older layout
rolls stay byte-identical. Path-across is always guaranteed.

| Biome | Palette | Character | Status |
|---|---|---|---|
| **Autumnwood** | copper · moss green · amber | fallen leaves, red caps, golden evening light | MVP (piece 2) |
| Frostroot | ice blue · bone white · dark spruce | frosted roots, ice crystals, snowy moss | piece 5 |
| Sunspire | gold · pale green · cream | tall grass, golden flowers, sun shafts | piece 5 |
| Mirefall | deep green · turquoise · dim violet | pools, mushrooms, slow mist | piece 5 |

Until a biome exists for an Act, the Act uses Autumnwood.

### Fields that fit the story (Marc: *"tehdään pelikentistä tarinaan sopivaa"*)
The run walks deeper into the forest, so the battlefield follows the story's
Acts (names: `src/components/hearthwood-studio/actNames.js`). Each Act gets a
biome **and** a light, set in `BIOME_FOR_ACT`:

| Act | Story place | Biome | Light / mood |
|---|---|---|---|
| I | The Outer Grove | Autumnwood | golden evening, homely |
| II | The Deepening Woods | Mirefall | dimmer, mist between the trees |
| III | The Wounded Hearthwood | Wounded grove (Autumnwood gone grey: ash, dead wood, blight) | sick, low light |
| IV | The Reckoning | Frostroot | cold, clear, hard shadows |
| V | The Crownless | Sunspire (a fallen golden court) | bright but broken |
| VI–VII | The Echo Rift / Verge | Echo (mirrored, violet) | uncanny |

Story moments may also set a fight's biome directly (`battle.biome`).

## 4b. The forest lives while you play (Marc: *"metsä elää sitä pelatessa"*)

- **Now (piece 2):** fireflies, drifting leaves, butterflies on the rim, sun
  shafts; evening deepens a little every turn (the fight runs into dusk);
  victory warms the light, defeat dims it and lets mist gather.
- **Piece 4:** the forest answers events — dust/leaves puff where a blow lands,
  flowers open under a heal, roots rise for root magic, frost creeps for ice,
  dry leaves glow for fire; trampled grass where heroes walked.
- **Piece 3:** the forest *changes* — every piece breaks down into smaller ones.

## 4c. Heroes get their own art (later)
Marc will create heroes with their own graphics. Commander canon: **Tommy is
an orange cat, Aatos a white reindeer, Repo a robot.** The battlefield keeps
units the brightest, clearest thing on the field so that hero art can drop in
without re-tuning the forest.

## 5. Readability rules (PRD §5)

- Silhouettes: units keep their card frames; forest art is darker and lower
  contrast than any unit.
- Ground tiles are flat patterns (no tall shapes) so they never hide a unit.
- Objects are short enough that the health pips and fire badge stay visible.
- Hazards use colour **and** shape (flames, flare glow, root tangles).
- Every new piece shows in the terrain legend and tile tooltip.

## 6. Animation (PRD §6) — short, never slowing the turn

| Event | FX |
|---|---|
| Leaves flare | quick amber flash across the burning tiles |
| Glowcap pops | soft teal-gold bloom + heal numbers on everyone hit |
| Heavy impact flattens ground | brief dust flash on the changed tiles |
| Ambient (piece 3) | glowcaps pulse, a few leaves drift, fireflies — capped counts, reduced-motion = still |
| Victory / defeat (piece 4) | light warms, fireflies return / light dims, mist thickens |

## 7. Build order (each piece = one PR, independently verified)

Marc (2026-10-18): **"first the game must look good"** — the graphics polish
comes before the new rules.

1. ✅ #633 Terrain belongs to the ground (objects on the floor, not in boxes).
2. ✅ #634 **The look (Autumnwood)** — biome registry (palette + floor detail +
   ambient, as data), seeded non-blocking floor detail on empty tiles that
   gathers around trees/rocks/water (aspen leaves, fly agarics, chanterelles,
   lingonberries, cones, fern, twigs, pebbles, moss tufts, flowers), moss and
   leaf-litter patches across tile borders, old roots framing the corners,
   ambient life (drifting leaves, fireflies, butterflies, sun shafts), dusk
   deepening per turn, victory/defeat light. Purely visual — no rule changes.
3. ✅ **Living forest rules** — forest rules (`tacticsForest.js`), moss / leaves
   / roots / runestone / glowcap / branches / gravel with art, burn + crush +
   break tables, spells striking the forest (`FOREST_SPELLS`), dressing
   generator reading the biome, AI awareness, fire telegraph, legend +
   tooltips, `.scratch/verify_forest_rules.mjs`.
   Rule: **one blow = one break-down step** (a quake never fells a tree AND
   crushes its stump in the same hit).
4. Combat FX per PRD §6 (hit dust/leaves, heal flowers, root magic, frost,
   fire), unit shadows and target rings, victory/defeat mood.
5. Frostroot, Sunspire, Mirefall as data + their unique pieces.
6. Forest-shaping class skills (manipulation part 2).
7. Readability + performance pass with a full board (many units, many FX).

## 8. Acceptance (PRD §10, checked every piece)

- the field looks like a living forest, not an empty board;
- rich detail — moss, roots, plants, mushrooms, stones, dead wood;
- decor is composed, never covers units;
- units, health, targets, abilities stay clear;
- each biome recognisable;
- the forest reacts to battle events, calmly; no flicker;
- readable with many units; stable performance;
- **every forest piece can be destroyed or changed, and gives a choice.**
