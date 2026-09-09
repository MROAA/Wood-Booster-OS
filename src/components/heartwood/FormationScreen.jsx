import { useEffect } from "react"
import { UNITS } from "../../data/heartwood/units"
import { ENEMIES } from "../../data/heartwood/enemies"
import { CHARACTERS } from "../../data/heartwood/characters"
import { resolveFormation } from "../../data/heartwood/formations"
import {
  TRIBES,
  tribesOf,
  resolveSynergies,
  nextSynergyThreshold,
  synergyTierLabel,
  COMBO_SYNERGIES,
  resolveComboSynergies,
  resolvePositionSynergies,
  activePositionSlots,
} from "../../data/heartwood/synergies"
import { effectiveRole } from "../../data/heartwood/items"
import { unitProfile, positionFitForSlot } from "../../data/heartwood/roles"
import { deployedTribeCounts, difficultyTierForNode, essenceForWin, previewBattleEnemies, arenaForRun, RUN_PATH } from "../../services/heartwood/runEngine"
import { nodeNarrative } from "../../services/heartwood/runNarrative"
import UnitCard from "./UnitCard"
import EnemyPieceCard from "./EnemyPieceCard"
import BuildScore from "./BuildScore"
import ThreatPreview from "./ThreatPreview"
import { evaluateMatchup, THREATS, THREAT_ANSWER } from "../../data/heartwood/counterplay"
import { CardGlyph } from "./cardArt"

// Same 4 positions autoBattleEngine.js deploys units to - kept in sync
// by hand since the engine doesn't export it, but both only ever
// change together.
const SLOT_POSITIONS = [
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 1, col: 1 },
]

// The Commander's own fixed slot - autoBattleEngine.js's own
// COMMANDER_POSITION, duplicated here for the same reason
// SLOT_POSITIONS already is (no shared export between the engine and
// this preview).
const COMMANDER_POSITION = { row: 1, col: 0 }

function slotIndexAt(row, col) {
  return SLOT_POSITIONS.findIndex((p) => p.row === row && p.col === col)
}

// The battlefield preview: the same checkerboard grid the fight itself
// resolves on, with the real upcoming enemy formation ghosted in at its
// real positions and empty/filled deploy slots where the squad goes -
// placement now happens on an actual board, not a generic card list.
// How long the player has to arrange their squad before the fight
// starts on its own. Marc, direct: "start battle nappia ei tarvi, se
// voi alkaa automaattisesti" (no Start Battle button needed, it can
// start automatically) - same "no click needed" philosophy the battle
// itself already follows (AutoBattleView.jsx's own comment), extended
// one screen earlier. Long enough for a real look at the upcoming
// formation and a rearrange or two; short enough that it doesn't feel
// like the screen is just sitting there waiting for no reason.
const AUTO_START_DELAY_MS = 5000

// Elite gimmick one-liners (feat/hearthwood-elites) - the "how do I play
// this one differently" cue, shown on the formation screen. The enemy's
// own introLine carries the detail; this is the glanceable tag.
const ELITE_GIMMICK = {
  "the-gorging-maw": "Lifelink — it heals from every hit it lands.",
  "the-iron-sentinel": "Compounding armour — it hardens every round it stands.",
  "the-bramble-lash": "Thorns — it strikes back at whoever strikes it.",
  "the-ashfall-herald": "Escalating flame — its squad-wide fire grows every round.",
}

export default function FormationScreen({ runState, node, onAssign, onClear, onStartBattle }) {
  const isBoss = node.type === "boss"
  const isMiniboss = node.type === "miniboss"
  const isElite = node.type === "elite"
  const formation = resolveFormation(node.formationId || node.enemyId)
  // A Trial (trials.js) is a named narrative wrapper around this exact
  // encounter - real story identity (title, its own intro/victory lines)
  // without touching the underlying enemy's already-tuned combat stats.
  // Resolved (along with the tier and this stop's beat/intro) via
  // nodeNarrative below - see `narrative`.
  // Auto-start (see AUTO_START_DELAY_MS above). Keyed on the node
  // itself, not deployedCount/runState - re-arranging the squad
  // shouldn't reset the clock (the same fixed-delay shape
  // AutoBattleView.jsx's own round-advance timer already uses), and a
  // new node (the NEXT fight's formation screen) needs its own fresh
  // timer rather than inheriting whatever time was left on this one.
  useEffect(() => {
    const timer = setTimeout(onStartBattle, AUTO_START_DELAY_MS)
    return () => clearTimeout(timer)
  }, [node, onStartBattle])

  const deployedCount = runState.deployed.filter((k) => k !== null).length
  // Tribe synergies (synergies.js) - counted from DEPLOYED units only,
  // same scope autoBattleEngine.js's own tribe loop uses for the real
  // effect, so this tracker can never show something the battle won't
  // actually grant. This screen (pre-battle planning) is where the
  // "easy to play, hard to master" depth is supposed to live, per the
  // game's own design rule - a squad-composition decision belongs here.
  const tribeCounts = deployedTribeCounts(runState)
  const activeSynergies = resolveSynergies(tribeCounts)
  // Cross-tribe combos + formation/positional synergies (synergies.js).
  // slotTribes: slot index -> that deployed unit's tribe tags, the same
  // shape the engine builds from recruitedUnits so the preview and the
  // real battle never disagree.
  const slotTribes = {}
  runState.deployed.forEach((benchKey, i) => {
    if (benchKey === null) return
    const entry = runState.bench.find((e) => e.key === benchKey)
    const def = entry && UNITS[entry.defId]
    if (def) slotTribes[i] = tribesOf(def.id, def)
  })
  const activeCombos = resolveComboSynergies(tribeCounts)
  const positionHits = resolvePositionSynergies(slotTribes)
  const formationBonusSlots = new Set(activePositionSlots(slotTribes))
  const commander = CHARACTERS[runState.characterId]
  const primedPower = (runState.pendingActiveEffects || []).length > 0 ? commander?.activePower : null
  // Arena hazard for this fight (arenas.js) - null most fights. Same
  // arenaForNode the real battle uses, so the preview never lies.
  const arena = arenaForRun(runState)
  // Same progressive-difficulty readout as SquadDraft.jsx's shop
  // header - this pre-battle screen is the other place a run's
  // progress is visible, and the fight about to start is exactly what
  // that ramp is scaling. Resolved through nodeNarrative (runNarrative.js)
  // now rather than a local ternary chain: one pure call yields the
  // tier plus this stop's title/beat/intro, so the flavor line below
  // and the difficulty badge can never disagree about which Act this is.
  const narrative = nodeNarrative(node, runState.nodeIndex, RUN_PATH.length)
  const difficultyTier = narrative.tier
  // Act intro (Marc: "make a progressive story") - shown exactly once,
  // the first FormationScreen visit reached after the run crosses into
  // a new difficulty tier. Comparing against nodeIndex-1 directly isn't
  // enough - the tier boundary can (and often does) land on a shop or
  // relic node, which this screen never renders for, so the crossing
  // would be silently absorbed before the next real fight ever shows
  // up here (caught via a real UI walkthrough, not assumed - the
  // "Deepening Woods" crossing in the actual RUN_PATH lands on a shop
  // node, index 43, with the next FormationScreen visit not until index
  // 44). Instead, walk backward to the PREVIOUS node this screen itself
  // would have rendered for (same "formation" phase runEngine.js's own
  // phaseForNode resolves to - anything that isn't shop/relic) and
  // compare tiers against that one. Stateless by design - derived
  // purely from run position, so it survives a reload without a
  // separate "have I seen this" flag the way HeartwoodBattle.jsx's own
  // tutorial banner needs one.
  let previousFormationTier = null
  for (let i = runState.nodeIndex - 1; i >= 0; i--) {
    const prevNode = runState.path[i]
    if (prevNode?.type !== "shop" && prevNode?.type !== "relic") {
      previousFormationTier = difficultyTierForNode(i, RUN_PATH.length).name
      break
    }
  }
  const isNewAct = previousFormationTier != null && previousFormationTier !== difficultyTier.name
  // Essence-on-win preview - the reward for this exact fight (relic
  // bonuses, miniboss/formation bonuses, all already folded in by
  // essenceForWin) used to only ever appear AFTER the fight
  // (ResultOverlay.jsx), so a player committed their formation with no
  // idea what was actually at stake. Boss fights end the run in
  // victory instead of paying Essence (see HeartwoodBattle.jsx's own
  // identical `isBoss ? null : ...` branch), so there's nothing to
  // preview there either.
  const essenceOnWin = isBoss ? null : essenceForWin(runState, node)
  // The enemy preview below used to always show ENEMIES[defId]'s raw,
  // unscaled maxHp - both the difficulty ramp and (now) the DPS-
  // adaptive scaling (autoBattleEngine.js's scaleEnemyHpToSquadDps)
  // only ever applied once the real fight started, so this screen
  // could promise one HP number and the actual battle show a very
  // different (often much higher) one the instant it began - reads as
  // a bug, not the intended "the game is taking your build seriously."
  // A real dry-run of the same battle-setup startFormationBattle
  // itself uses (runEngine.js's previewBattleEnemies), keyed by
  // position so it lines up with formation.pieces below regardless of
  // formation shape.
  const previewEnemies = previewBattleEnemies(runState)
  const scaledEnemiesByPos = {}
  for (const e of previewEnemies) scaledEnemiesByPos[`${e.pos.row}-${e.pos.col}`] = e
  // Counterplay (counterplay.js): which threats the next fight presents,
  // and whether the deployed squad + relics + boons answer them.
  const matchup = evaluateMatchup(previewEnemies, runState)

  function handleBenchClick(benchKey) {
    const slotIndex = runState.deployed.indexOf(benchKey)
    if (slotIndex !== -1) {
      onClear(slotIndex)
      return
    }
    const emptySlot = runState.deployed.indexOf(null)
    if (emptySlot !== -1) onAssign(emptySlot, benchKey)
  }

  const rows = []
  for (let row = 0; row < 3; row++) {
    const cells = []
    for (let col = 0; col < 3; col++) {
      const enemyPiece = formation.pieces.find((p) => p.pos.row === row && p.pos.col === col)
      const slotIndex = slotIndexAt(row, col)
      let content = null
      let positionFit = null

      const isCommanderSlot = row === COMMANDER_POSITION.row && col === COMMANDER_POSITION.col

      if (enemyPiece) {
        const def = ENEMIES[enemyPiece.defId]
        const scaled = scaledEnemiesByPos[`${row}-${col}`]
        const hp = scaled?.maxHp ?? def.maxHp
        const previewEnemy = { id: `preview-${row}-${col}`, name: def.name, hp, maxHp: hp, block: 0, intent: null, powers: {} }
        content = <EnemyPieceCard enemy={previewEnemy} art={def.art} />
      } else if (isCommanderSlot) {
        // The Commander always deploys here - not something the player
        // assigns/reorders, so it's shown but never clickable.
        const commander = CHARACTERS[runState.characterId]
        const previewCommander = { id: "commander-preview", name: commander?.name, hp: commander?.maxHp, maxHp: commander?.maxHp, block: 0, intent: null, powers: {} }
        content = <EnemyPieceCard enemy={previewCommander} art={commander?.art} side="player" />
      } else if (slotIndex !== -1) {
        const benchKey = runState.deployed[slotIndex]
        const entry = benchKey !== null ? runState.bench.find((e) => e.key === benchKey) : null
        if (entry) {
          const def = UNITS[entry.defId]
          // Positioning as a role mechanic (roles.js) - does this slot
          // suit the unit's preferred position? Drives the cell cue.
          const equipIds = runState.items.filter((it) => it.equippedTo === entry.key).map((it) => it.defId)
          const bentPos = effectiveRole(def.role, equipIds)
          positionFit = positionFitForSlot(
            unitProfile(def, bentPos && bentPos !== def.role ? bentPos : undefined).position,
            slotIndex,
          )
          const previewUnit = { id: `slot-${slotIndex}`, name: def.name, hp: def.maxHp, maxHp: def.maxHp, block: 0, intent: null, powers: {} }
          // Same column-1 forward/back pair as autoBattleEngine.js's
          // real isShielded check, computed by hand here since there's
          // no battle state yet to ask - slot 1 (row 2, col 1) is
          // shielded exactly when slot 3 (row 1, col 1) is filled.
          const shielded = slotIndex === 1 && runState.deployed[3] !== null
          content = (
            <EnemyPieceCard
              enemy={previewUnit}
              art={def.art}
              side="player"
              shielded={shielded}
              onClick={() => handleBenchClick(entry.key)}
            />
          )
        }
      }

      cells.push(
        <div
          key={`${row}-${col}`}
          className="hw-grid-cell"
          data-tile={(row + col) % 2 === 0 ? "a" : "b"}
          data-empty={!content}
          data-move-target={slotIndex !== -1 && !content}
          data-formation-bonus={slotIndex !== -1 && !!content && formationBonusSlots.has(slotIndex)}
          data-position-fit={positionFit || undefined}
        >
          {content}
        </div>,
      )
    }
    rows.push(
      <div className="hw-grid-row" key={row}>
        {cells}
      </div>,
    )
  }

  return (
    <div className="hw-intro">
      {/* paddingRight keeps the difficulty badge clear of the fixed
          .hw-exit-link corner button - see SquadDraft.jsx's header row
          for the same fix and why it's needed. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6, flexWrap: "wrap", paddingRight: 130 }}>
        {/* A Trial (trials.js) is a named story fight - show its name as
            the heading (Rootkeeper / The Hollow King), not the generic
            "Take the field", so a miniboss/boss reads as the story beat
            it is. Regular battles keep the plain heading. */}
        <h1
          className="hw-screen-title"
          style={{ fontSize: "var(--hw-fs-xl)", marginBottom: 0 }}
          data-trial={narrative.isTrial || isElite || undefined}
        >
          {narrative.isTrial ? narrative.title : isElite ? narrative.title : "Take the field"}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {essenceOnWin != null && (
            <span className="hw-badge hw-section-fade-in" title="Essence earned if you win this fight">
              <CardGlyph name="spark" className="hw-intent-glyph" />+{essenceOnWin}
            </span>
          )}
          {/* key={difficultyTier.name} - see SquadDraft.jsx's identical
              badge for why: forces a real remount (and so a real replay
              of hw-section-fade-in) the moment the tier itself changes,
              not just whenever this screen happens to re-render. */}
          <span
            key={difficultyTier.name}
            className="hw-badge hw-section-fade-in"
            style={{ color: difficultyTier.color, borderColor: difficultyTier.color }}
            title="How far into the run you are - the Hearthwood grows more dangerous the deeper you go"
          >
            <CardGlyph name="moonGlyph" className="hw-intent-glyph" />
            {difficultyTier.name}
          </span>
        </div>
      </div>
      {isNewAct && (
        <div
          className="hw-section-fade-in"
          style={{
            border: `1px solid ${difficultyTier.color}`,
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 14,
            background: `color-mix(in srgb, ${difficultyTier.color} 10%, var(--hw-panel))`,
          }}
        >
          <div className="hw-screen-eyebrow" style={{ color: difficultyTier.color, marginBottom: 4 }}>
            {difficultyTier.name}
          </div>
          <div className="hw-screen-sub" style={{ marginBottom: 6 }}>{difficultyTier.tagline}</div>
          <div style={{ fontSize: "var(--hw-fs-md)", lineHeight: 1.5 }}>{difficultyTier.lore}</div>
        </div>
      )}

      <p className="hw-flavor">
        {/* nodeNarrative resolves the same trial.introLine -> enemy
            introLine -> formation/enemy description chain this used to
            spell out inline; the isBoss/isMiniboss strings stay as the
            last-resort fallback for a battle node with nothing authored
            (every current Trial supplies an introLine, so this is
            byte-identical for today's RUN_PATH). */}
        {narrative.intro ||
          narrative.beat ||
          (isBoss ? "The final fight." : isMiniboss ? "A greater foe." : isElite ? "An elite stands in the way." : null)}
      </p>

      {isElite && ELITE_GIMMICK[node.enemyId] && (
        <p className="hw-elite-gimmick hw-section-fade-in">
          <CardGlyph name="sword" className="hw-intent-glyph" /> {ELITE_GIMMICK[node.enemyId]}
        </p>
      )}

      {narrative.isTrial && narrative.trial?.beat && (
        <p className="hw-flavor" style={{ fontStyle: "italic", color: "var(--hw-muted)", marginTop: -4 }}>
          {narrative.trial.beat}
        </p>
      )}

      {primedPower && (
        <div className="hw-badge hw-badge--active" style={{ marginBottom: 10 }} title={primedPower.description}>
          {primedPower.name} primed - applies at the start of this battle
        </div>
      )}

      {formation.synergy && (formation.pieces?.length || 0) >= 2 && (
        <div className="hw-badge" style={{ marginBottom: 10, color: "var(--hw-hp)", borderColor: "var(--hw-hp)" }}
          title="This formation fights as a unit - every enemy piece shares a bonus">
          Enemy formation: {formation.synergy.label}
        </div>
      )}

      {/* Swarm hint (formations.js the-brood / the-teeming): 4+ pieces =
          the Swarm archetype (Enemy Ecosystem PRD 6-7). Says how to beat
          it - the same "AoE / chain / splash" counter the PRD names. */}
      {(formation.pieces?.length || 0) >= 4 && (
        <p className="hw-swarm-hint">
          A swarm — AoE, chain and pattern attackers clear these fast. Single-target wastes overkill while the rest pile up.
        </p>
      )}

      {/* Fortress hint (formations.js the-bulwark / the-bastion): the
          "The wall holds firm" synergy = the Fortress archetype (Enemy
          Ecosystem PRD 8). Names the counter — armour-break, a DoT, or
          steady pressure; racing the clock loses to its healer. */}
      {formation.synergy?.label === "The wall holds firm" && (
        <p className="hw-fortress-hint">
          A fortress — armour-breakers (Shatter / Sunder), a damage-over-time, or steady pressure grind it down. Racing the clock loses; its healer out-mends a slow poke.
        </p>
      )}

      {/* Hunters hint (formations.js the-pack / the-run-down): the
          "They hunt the weak one" synergy = the Hunters archetype (Enemy
          Ecosystem PRD). The pack skips your front line and piles onto
          your softest unit — a taunt / decoy pulls it off, a bodyguard
          steps in front, even HP leaves no target. */}
      {formation.synergy?.label === "They hunt the weak one" && (
        <p className="hw-hunters-hint">
          A hunting pack — it skips your front line and piles onto your softest unit. A taunt or a decoy pulls it off; a bodyguard beside your carry, or just even HP across the squad, blunts it.
        </p>
      )}

      {/* Enemy threat preview (threatPreview.js) - "here is the problem":
          a danger rating, the dominant threat, the mechanics to expect.
          Sits directly above the counterplay checkrow ("do you have the
          answer"). */}
      <ThreatPreview runState={runState} node={node} previewEnemies={previewEnemies} />

      {/* Counterplay (counterplay.js) - the threats THIS enemy presents
          and whether your kit has an answer. A ✓ chip = covered, a ✗
          chip = a gap. The answers are real existing interactions; this
          just makes them legible before the fight. */}
      {matchup.threats.length > 0 && (
        <div className="hw-matchup hw-section-fade-in">
          <div className="hw-section-label">Next fight</div>
          <div className="hw-matchup-chips">
            {THREATS.filter((t) => matchup.threats.includes(t.id)).map((t) => {
              const covered = matchup.covered.includes(t.id)
              return (
                <span
                  key={t.id}
                  className="hw-matchup-chip"
                  data-covered={covered}
                  title={covered ? `Answered by ${THREAT_ANSWER[t.id]}` : `No answer — wants ${THREAT_ANSWER[t.id]}`}
                >
                  <CardGlyph name={t.icon} className="hw-intent-glyph" />
                  {covered ? "✓" : "✗"} {t.label}
                </span>
              )
            })}
          </div>
          {matchup.gaps.length > 0 && (
            <p className="hw-matchup-note">
              No answer to {matchup.gaps.map((g) => THREATS.find((t) => t.id === g).label.toLowerCase()).join(", ")}.
            </p>
          )}
        </div>
      )}

      {arena && (
        <div
          className="hw-arena-banner hw-section-fade-in"
          style={{
            borderColor: arena.scope === "enemy" ? "var(--hw-hp)" : arena.scope === "player" ? "var(--hw-moss)" : "var(--hw-rune)",
          }}
        >
          <div className="hw-arena-banner-name">
            Arena — {arena.name}
            <span className="hw-arena-banner-scope">
              {arena.scope === "both" ? "affects everyone" : arena.scope === "player" ? "affects your squad" : "affects the enemy"}
            </span>
          </div>
          <div className="hw-arena-banner-desc">{arena.description}</div>
        </div>
      )}

      {Object.keys(tribeCounts).length > 0 && (
        <div className="hw-section-fade-in">
          <div className="hw-section-label">Synergies</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(tribeCounts).map(([tribeId, count]) => {
              const tribe = TRIBES[tribeId]
              const active = activeSynergies.find((s) => s.tribeId === tribeId)
              // "how far from the next payoff" - shown whenever there's
              // still a higher tier to reach, active or not (2/2 active
              // still has a 4-count tier worth knowing about).
              const next = nextSynergyThreshold(tribeId, count)
              // The badge text itself stays a compact "Warden 2 ✓" -
              // Marc: "UI needs to be clear and minimalistic while also
              // giving enough info" - the real numeric effect only
              // shows on hover, not forced onto the always-visible row.
              const tierLabel = synergyTierLabel(tribeId, count)
              return (
                <span
                  key={tribeId}
                  className={`hw-badge${active ? " hw-badge--active" : ""}`}
                  style={!active ? { color: tribe?.color, borderColor: tribe?.color } : undefined}
                  title={tierLabel ? `${tribe?.description} ${tierLabel}` : tribe?.description}
                >
                  <CardGlyph name={tribe?.icon} className="hw-intent-glyph" />
                  {tribe?.name} {count}
                  {active ? " ✓" : ""}
                  {next ? ` (${next} for more)` : ""}
                </span>
              )
            })}
          </div>

          {/* Cross-tribe combos - a payoff for splitting the squad
              across two tribes. Active ones filled; the rest shown
              greyed with what's still missing, the same "here's what
              you're building toward" cue the tribe row uses. */}
          <div className="hw-section-label">Combos</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {COMBO_SYNERGIES.map((combo) => {
              const on = activeCombos.some((c) => c.id === combo.id)
              const need = Object.entries(combo.tribes)
                .filter(([t, n]) => (tribeCounts[t] || 0) < n)
                .map(([t, n]) => `${TRIBES[t]?.name} ${n}`)
                .join(" + ")
              return (
                <span
                  key={combo.id}
                  className={`hw-badge${on ? " hw-badge--active" : ""}`}
                  style={!on ? { opacity: 0.5 } : undefined}
                  title={combo.label}
                >
                  {combo.label.split(":")[0]}
                  {on ? " ✓" : need ? ` (need ${need})` : ""}
                </span>
              )
            })}
          </div>

          {positionHits.length > 0 && (
            <>
              <div className="hw-section-label">Formation bonuses</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {[...new Map(positionHits.map((h) => [h.synergy.id, h.synergy])).values()].map((ps) => (
                  <span key={ps.id} className="hw-badge hw-badge--active" title={ps.label}>
                    {ps.label.split(":")[0]} ✓
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Build evaluation (buildScore.js) - what kind of squad is this?
          Sits below the tribe/combo synergies since it reads them plus
          the deployed units' roles. */}
      <BuildScore runState={runState} />

      <div className="hw-section-label">Battlefield</div>
      <div className="hw-grid" style={{ marginBottom: 16 }}>
        {rows}
      </div>
      <p className="hw-flavor" style={{ marginTop: -10, marginBottom: 10 }}>
        The front-center slot shields whoever you place directly behind it. A glowing tile
        means that placement is feeding a formation bonus. A unit in its preferred slot
        (tanks forward, DPS / healers / support in the back row) starts the fight with a small edge.
      </p>

      <p style={{ fontSize: 12, color: "var(--hw-muted)" }}>
        Bench ({deployedCount} / {runState.deployed.length} fighting) + Reserve ({runState.bench.length - deployedCount}) -
        click to place, click again to pull back. Three of the same unit fuse automatically.
      </p>
      <div className="hw-select-grid hw-deck-preview">
        {runState.bench.map((entry) => {
          const def = UNITS[entry.defId]
          const equippedItemIds = runState.items.filter((it) => it.equippedTo === entry.key).map((it) => it.defId)
          const bentRole = def ? effectiveRole(def.role, equippedItemIds) : def?.role
          const isDeployed = runState.deployed.includes(entry.key)
          return (
            <UnitCard
              key={entry.key}
              def={def}
              selected={isDeployed}
              onClick={() => handleBenchClick(entry.key)}
              role={bentRole}
              bent={bentRole !== def?.role}
              // Light a tribe badge only on a unit that's actually
              // deployed - an active synergy is about the fighting five.
              activeTribeIds={isDeployed ? activeSynergies.map((s) => s.tribeId) : undefined}
            />
          )
        })}
      </div>

      {/* No longer gated on deployedCount > 0 - the Commander is
          always a 5th deployed unit now (Marc: "peli alkaa siitä että
          commander on yksin" - the game starts with the Commander
          alone), so a squad of zero recruited units is a real, valid
          state, not an empty one.

          Text kept as "Start Battle" (not renamed to something like
          "Skip Wait") deliberately - it's the exact string dozens of
          existing .scratch/*.mjs verification scripts locate this
          screen/button by; the fight now starts on its own regardless
          (AUTO_START_DELAY_MS above) so a player never NEEDS to click
          it, same "no click required" outcome Marc asked for, just
          without a disruptive rename for zero functional benefit. */}
      <button className="hw-end-turn" onClick={onStartBattle} style={{ marginTop: 16 }}>
        Start Battle
      </button>
    </div>
  )
}
