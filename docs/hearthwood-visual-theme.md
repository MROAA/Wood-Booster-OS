# Hearthwood Visual Theme — "The Nordic Forest"

The standing look, feel, lore and UI rules for **every** Hearthwood screen.
Everything new follows this; when an older screen is touched, move it toward
this. Living document — extend it as the game grows.

Source: Marc's direction, 2026-10-16/17 (graphics rounds, PRs #605–#610 and the
Market / Headquarters round that followed).

---

## 1. The idea in one breath

A strategic, challenging game that **loves the forest, and it shows**.
Natural and calm. Nordic: Finnish, Sámi and Viking roots, Scandinavian
restraint. Clear like Hearthstone — lots of information, never cluttered.

Marc's own words, kept as the compass:

- *luonnollinen ja rauhallinen* — natural and calm
- *strateginen ja haastava, luonnonläheinen* — strategic, challenging, close to nature
- *peli pitää metsästä ja luonnosta ja se näkyy* — the game loves the forest and nature, and it shows
- *suomi ja saami · viikingit inspiraatioksi · riimut on hienoja · skandinaavinen tyyli*
- *käytä inspiraationa Hearthstonea, siinä on selkeä ja mukava käyttöliittymä*
- *UI:n pitää pystyä antamaan paljon tietoa ilman tulematta sekavaksi*
- *peli on hyvä ja haastava sekä mukavan näköinen*

## 2. Lore of the places

### Headquarters
- The player's **own camp**. It travels with the squad along the road.
- Name on screen: **Headquarters**. ("Päämaja" is only our internal working name - never shown in the game.)
- It is the **default stance** at a market stop: you arrive, and you are in
  your camp. From here you **pilot the run** — the commander, the whole squad
  with every action, relics and bag, your build, the road ahead, Continue.
- It should **feel like a real headquarters**: a place, a cockpit, not a menu.

### The market
- A place **your camp arrives at** ("Your camp arrives at the market").
  The merchant (e.g. *The Forest Trader*) has set up shop; you go over to trade.
- The market is for **trading only**: heroes and gear for sale, Reroll,
  Freeze, Gamble, Antidote, Market level/Tier, the Ledger (investments with
  the merchant). The squad strip stays in view while you buy.
- It sells what the current shop system offers; the shop itself will be
  developed further.
- Back to camp is one click (`← Headquarters`).

### Cards
- Hero cards are like **tarot cards carrying a unit's lore and numbers**
  (the hero ids are the Major Arcana: the-fool, the-magician, the-chariot…).
- They should **feel like cards you handle**: weight, shine, being dealt,
  flying to your hand.

## 3. Language

- The game is in **English** - **no Finnish visible anywhere in the game**
  (Marc, 2026-10-17: "ei suomea näkyviin pelissä"). Finnishness lives in
  the look (forest, birch, kuusenhavu), never in on-screen words.
- Runes stay (decorative, with their meaning in English on hover).

## 4. Palette (tokens on `.hw-root`, heartwood.css — Studio-editable)

| Token | Default | Role |
|---|---|---|
| `--hw-ui-accent` | `#cdb47a` | lichen gold — the ONE accent, used sparingly for what you can act on |
| `--hw-ui-leaf` | `#8fb07a` | moss — hairlines, leaves, "ready/affordable" |
| `--hw-ui-text` | `#e8e2c8` | pale lichen — panel text |
| `--hw-ui-panel` | `#0f130c` | forest floor — panel background |
| (fixed) | ember red | danger only (HP, damage, "hurt") |

Rules: calm panels, the cards are the stars; one accent; warm firelight
from below, darkness at the edges so the eye rests in the middle.

## 5. Runes (Elder Futhark) — chosen by meaning

| Rune | Name | Meaning | Used for |
|---|---|---|---|
| ᚠ | fehu | wealth | Market level / tier |
| ᛟ | othala | inheritance | the Ledger, relics & bag |
| ᚲ | kenaz | the torch, the craftsman | the merchant / the market |
| ᚱ | raido | the journey | the road |
| ᚢ | uruz | strength | heroes for sale |
| ᚷ | gebo | the gift | gear for sale |
| ᛗ | mannaz | the people | the squad |
| ᛏ | tiwaz | the warrior | the commander |
| ᛜ | ingwaz | what waits to grow | the reserve |
| ᛉ | algiz | protection | your build |
| ᛞ | dagaz | daybreak, a new stop | Headquarters, arrival |

Runes glow softly (`--hw-ui-rune-glow`), like the runes carved in the World
Tree backdrop. All titles/runes/meanings live in
`src/data/heartwood/marketUi.js` (Studio: **Market & Headquarters Texts**).

## 6. Nordic craft details — thin, muted, never louder than the cards

- **Sámi ribbon**: a gákti-trim inspired band of thin muted stripes (red,
  gold, blue, green) under top bars and over the squad strip. Abstract colour
  bands only — **no drum or other sacred motifs**, out of respect.
- **Kuusenhavu**: the Finnish spruce-twig chevron (ryijy rugs, woven bands)
  along the top edge of the merchant's table.
- **Koivu**: a sliver of birch bark on the squad strip's edge.
- **Tree-stump table**: faint growth rings on the merchant's table.
- **Hearth glow**: warm firelight breathing up from the bottom (`--hw-ui-hearth-glow`).
- **Forest floor** on the battle board: grain, moss blots, canopy light,
  fireflies, edge vignette.

## 7. UI principles (how to show a lot without clutter)

1. **Hierarchy** — the most important thing first and biggest.
2. **Detail on demand** — tags, rarity text, class names, recipes open on
   hover/click (e.g. squad chip → hero inspector).
3. **Consistency** — the same information always in the same place and form
   (cost top-left, health bottom-right, actions bottom-left on every card;
   every price reads `✦ 50`).
4. **Subtract, don't reorganise** — ask of every element: does the player
   need this here, now? Empty lists hide; analysis read-outs move away.
5. **One button language** — dark carved plaques with a gold hairline.
6. **Fit Marc's real screen**: 1536×864 (125% of 1920×1080) with no page
   scroll; never shrink buttons he asked to be bigger.
7. **One cursor** — the plain arrow everywhere, always (no hands, help marks
   or no-entry signs); only text fields show the typing caret.
8. **Studio tools stay out of the player's way** — Edit Layout / Edit in
   Studio hide behind the corner `✎ Studio` switch.

## 8. Cards — Hearthstone-clear anatomy (`heartwood-cards.css`)

1. Art first, big, in a carved arch.
2. Name on a banner across the art's foot.
3. **Cost** — a gold coin in the top-left corner (owned heroes show no price).
4. Tribe chips + the battle **role** (Tank / Healer / DPS / Support / Control).
5. **Attack and health** — one calm row at the foot: ⚔ attack, ♥ health, icon +
   number (no bars - Marc found them unnecessary). Attack is the battle's own
   number (`unitStrength.js` → `attackFromMovePattern`); a hurt hero shows
   what it has left.
6. Everything else folds away and opens on hover.

## 9. Animation — the feel of handling cards

- **Lift & tilt** on hover; shadow grows as the card rises.
- **Sheen** follows the pointer like lamplight on lacquer.
- **Dealing**: offers slide in from the deck, one after another.
- **To your hand**: a bought hero's card flies down into the squad strip and
  the new chip pops in with a glow.
- **"No"**: an unaffordable card shakes its head when pressed.
- **Arrival**: "Your camp arrives at the market" banner, then the deal.
- **Battle** (Hearthstone-style): anticipation strike (rock back, snap in),
  damage splat, sparks, battle-start slam with dust, crumbling death, turn banner.
- Everything stills under reduced motion.

Tunable in Studio → Colors & Theme → **Card feel** and **Market &
Headquarters look** (deal speed, stagger, slide distance, shine, lift, flight
speed; colours, rune & hearth glow, column widths, arrival banner).

## 10. Where it lives

| What | File |
|---|---|
| Card anatomy + feel | `src/components/heartwood/heartwood-cards.css` |
| Market screen | `MarketScreen.jsx` + `heartwood-market-table.css` (shared panels) |
| Headquarters screen | `HeadquartersScreen.jsx` + `headquarters-screen.css` |
| Titles / runes text | `src/data/heartwood/marketUi.js`, `CampTitle.jsx` |
| Battle art direction | `heartwood-graphics.css`, `TacticsFx.jsx` |
| Theme tokens | `.hw-root` in `heartwood.css` |
| Market engine (logic, shared pieces) | `SquadDraft.jsx` |
