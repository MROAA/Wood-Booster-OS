import { talentTreeOf, levelForXp } from "../../services/heartwood/unitLevels"
import { NEUTRAL_ITEMS, NEUTRAL_TIERS } from "../../data/heartwood/neutrals"
import { ENEMY_TALENTS } from "../../data/heartwood/itemBuilds"
import { enemyTalentRead } from "../../services/heartwood/tacticsTalents"
import { talentById } from "../../data/heartwood/talents"

// Dota depth 2 - the UI for talents, neutral items and enemy talents.
//  - TalentTree: the Dota-style tree (rows Lv2 / Lv4, left vs right, the
//    level in the middle): chosen / passed-over / offered / open / locked.
//  - TalentOfferCard: one talent as a level-up card (LevelUpChoice).
//  - NeutralSlot: a hero's ONE neutral slot + the stash (Gear screen).
//  - NeutralDropBanner: "Neutral drop!" after a won fight.
//  - TalentBadges: small token marks (hero talents ✦ / neutral ◈ / enemy talents ✧).
//  - EnemyTalentsLine: the board's Threat panel list of enemy talents.

export function TalentTree({ subject, offeredTier = null, compact = false }) {
  const tree = talentTreeOf(subject)
  if (!tree.length) return null
  const level = levelForXp(subject.xp || 0)
  const cell = (row, side) => {
    const t = row[side]
    const state = row.chosen === side ? "chosen" : row.chosen ? "passed" : offeredTier === row.tier ? "offered" : level >= row.level ? "open" : "locked"
    return (
      <span key={side} className="hw-talent-cell" data-talent-id={t.id} data-state={state} data-side={side} title={`${t.name}: ${t.text}${state === "locked" ? ` (opens at Level ${row.level})` : ""}`}>
        <span className="hw-talent-icon" aria-hidden="true">
          {state === "chosen" ? "★" : t.icon}
        </span>
        <span className="hw-talent-name">{t.name}</span>
        {!compact && <span className="hw-talent-text">{t.text}</span>}
      </span>
    )
  }
  return (
    <div className="hw-talent-tree" data-talent-tree={subject.key} data-compact={compact || undefined}>
      <div className="hw-talent-title">Talents</div>
      {[...tree].reverse().map((row) => (
        <div key={row.tier} className="hw-talent-row" data-tier={row.tier} data-chosen={row.chosen || undefined}>
          {cell(row, "L")}
          <span className="hw-talent-level" data-reached={level >= row.level || undefined}>
            {row.level}
          </span>
          {cell(row, "R")}
        </div>
      ))}
    </div>
  )
}

export function TalentOfferCard({ offer, subject, onChoose }) {
  const row = talentTreeOf(subject).find((r) => r.tier === offer.tier)
  const t = row?.[offer.side]
  if (!t) return null
  return (
    <button className="hw-levelup-card hw-levelup-card--talent" data-perk={`talent:${offer.tier}:${offer.side}`} data-talent-offer={t.id} onClick={() => onChoose(subject.key, `talent:${offer.tier}:${offer.side}`)}>
      <span className="hw-levelup-branch" aria-hidden="true">
        {offer.side === "L" ? "◀" : "▶"}
      </span>
      <span className="hw-levelup-icon" aria-hidden="true">
        {t.icon}
      </span>
      <span className="hw-levelup-name">{t.name}</span>
      <span className="hw-levelup-text">{t.text}</span>
      {t.twist && <span className="hw-talent-twist">class talent</span>}
    </button>
  )
}

function NeutralChip({ id, children, className = "" }) {
  const n = NEUTRAL_ITEMS[id]
  if (!n) return null
  return (
    <span className={`hw-neutral-chip ${className}`} data-neutral={id} data-tier={n.tier} style={{ "--hw-neutral": NEUTRAL_TIERS[n.tier]?.color }} title={`${n.name} (${NEUTRAL_TIERS[n.tier]?.name}): ${n.text}`}>
      <span className="hw-neutral-icon">{n.icon}</span>
      <span className="hw-neutral-name">{n.name}</span>
      {children}
    </span>
  )
}

// One hero's neutral slot + what the stash holds. `worn` = the worn id.
export function NeutralSlot({ ownerKey, worn, stash = [], onEquip, onUnequip }) {
  const n = worn ? NEUTRAL_ITEMS[worn] : null
  return (
    <div className="hw-neutral-slot-wrap" data-neutral-slot-of={ownerKey}>
      <div className="hw-hearth-section-label">Neutral slot</div>
      <div className="hw-neutral-slot" data-neutral-slot={worn || "empty"}>
        {n ? (
          <>
            <NeutralChip id={worn} />
            <span className="hw-neutral-text">{n.text}</span>
            {onUnequip && (
              <button className="hw-move-btn" data-neutral-off onClick={() => onUnequip(ownerKey)} title="Back to the stash">
                Off
              </button>
            )}
          </>
        ) : (
          <span className="hw-neutral-empty">Empty - won fights (elites, bosses) drop neutral items.</span>
        )}
      </div>
      {stash.length > 0 && (
        <div className="hw-neutral-stash" data-neutral-stash={stash.length}>
          <span className="hw-neutral-stash-label">Stash:</span>
          {stash.map((id, i) => (
            <span key={`${id}-${i}`} className="hw-neutral-stash-item">
              <NeutralChip id={id} />
              {onEquip && (
                <button className="hw-move-btn" data-neutral-equip={id} onClick={() => onEquip(ownerKey, id)} title={`Put it in the neutral slot${worn ? " (the worn one goes to the stash)" : ""}`}>
                  {worn ? "Swap" : "Equip"}
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function NeutralDropBanner({ drop, onDismiss }) {
  const n = drop ? NEUTRAL_ITEMS[drop.id] : null
  if (!n) return null
  return (
    <div className="hw-neutral-drop" data-neutral-drop={n.id} style={{ "--hw-neutral": NEUTRAL_TIERS[n.tier]?.color }}>
      <span className="hw-neutral-drop-glow" aria-hidden="true">
        {n.icon}
      </span>
      <span className="hw-neutral-drop-body">
        <span className="hw-neutral-drop-eyebrow">Neutral drop · {NEUTRAL_TIERS[n.tier]?.name}</span>
        <b>{n.name}</b>
        <span className="hw-neutral-drop-text">{n.text} Give it to a hero's neutral slot on the Gear screen.</span>
      </span>
      {onDismiss && (
        <button className="hw-move-btn" data-neutral-drop-ok onClick={onDismiss}>
          Nice
        </button>
      )}
    </div>
  )
}

// Token marks on the board (rendered inside KitBadges).
export function TalentBadges({ unit }) {
  const out = []
  if (unit.side === "player" && unit.talents?.length) {
    const names = unit.talents.map((id) => talentById(id)).filter(Boolean)
    out.push(
      <span key="t" className="hwt-talent-badge" data-talents={unit.talents.length} data-dormant={unit.talentDormant || undefined} title={`Talents${unit.talentDormant ? " (skill talents asleep: fighting as another class)" : ""}:\n${names.map((t) => `${t.icon} ${t.name}: ${t.text}`).join("\n")}`}>
        ✦{unit.talents.length}
      </span>,
    )
  }
  if (unit.side === "player" && unit.neutral && NEUTRAL_ITEMS[unit.neutral]) {
    const n = NEUTRAL_ITEMS[unit.neutral]
    out.push(
      <span key="n" className="hwt-neutral-badge" data-neutral-badge={n.id} style={{ "--hw-neutral": NEUTRAL_TIERS[n.tier]?.color }} title={`Neutral: ${n.name} - ${n.text}`}>
        {n.icon}
      </span>,
    )
  }
  if (unit.side === "enemy" && unit.enemyTalents?.length) {
    out.push(
      <span key="e" className="hwt-etalent-badge" data-enemy-talents={unit.enemyTalents.join(" ")} title={`Enemy talents:\n${unit.enemyTalents.map((id) => ENEMY_TALENTS[id]).filter(Boolean).map((t) => `${t.icon} ${t.name}: ${t.text}`).join("\n")}`}>
        ✧{unit.enemyTalents.length}
      </span>,
    )
  }
  if (unit.burrowed > 0)
    out.push(
      <span key="b" className="hwt-kit-badge" data-status="burrowed" title={`Underground${unit.revealed > 0 ? " - but revealed" : " - can't be targeted or hurt until it surfaces (or is revealed)"}`}>
        ⛰
      </span>,
    )
  return out.length ? <>{out}</> : null
}

export function EnemyTalentsLine({ battle }) {
  const read = enemyTalentRead(battle)
  if (!read.length) return null
  return (
    <div className="hwt-threat-etalents" data-threat-enemy-talents={read.reduce((a, r) => a + r.talents.length, 0)}>
      Enemy talents:{" "}
      {read.map((r) => (
        <span key={r.unitId} className="hwt-threat-etalent-unit">
          {r.name}{" "}
          {r.talents.map((t) => (
            <span key={t.id} className="hwt-threat-etalent" data-enemy-talent={t.id} title={t.text}>
              {t.icon} {t.name}
            </span>
          ))}
        </span>
      ))}
    </div>
  )
}
