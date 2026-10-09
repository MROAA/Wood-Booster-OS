import { useState } from "react"
import UnitCard from "./UnitCard"
import { UNITS } from "../../data/heartwood/units"
import { levelForXp } from "../../services/heartwood/unitLevels"
import {
  HEARTH_ROOMS, HEARTH_FURNITURE, MAX_VETERANS, OLD_AGE, RECRUIT_COST, ELDER_ESSENCE, MAX_ELDER_BONUS,
} from "../../data/heartwood/hearth"
import {
  rosterCapacity, roomLevel, roomUpgradeCost, recruitOffers, declineSteps, canRetire, unitName,
  startEssenceBonus, travelHp, trainingXp, allHeroes, breedBlocker, breedCost, kinship, kinLabel,
  badMutationChance, bredThisCycle, familyTree, nestLevel, heroByHid,
} from "../../services/heartwood/hearth"
import { RESOURCES } from "../../data/heartwood/resources"

// The Hearth - home camp between runs (services/heartwood/hearth.js).
// Roster of veterans, rooms + furniture bought with Acorns, Elders,
// the memorial, and "Start a run" with up to MAX_VETERANS picked.
export default function HearthScreen({
  hearth, acorns, picked = [], onPick, onUpgradeRoom, onBuyFurniture, onRecruit, onRetire, onRelease,
  onTogglePermadeath, onStartRun, onDismissReport, onBack, onBreed,
}) {
  const [confirmRelease, setConfirmRelease] = useState(null)
  // The Nest: the two heroes picked as parents; whose family tree is open.
  const [pair, setPair] = useState([])
  const [familyOf, setFamilyOf] = useState(null)
  const nestLv = nestLevel(hearth)
  const livePair = pair.filter((hid) => heroByHid(hearth, hid))
  const blocker = livePair.length === 2 ? breedBlocker(hearth, livePair[0], livePair[1], acorns) : "Pick two heroes."
  const togglePair = (hid) =>
    setPair((p) => (p.includes(hid) ? p.filter((x) => x !== hid) : p.length < 2 ? [...p, hid] : [p[1], hid]))
  const cap = rosterCapacity(hearth)
  const offers = recruitOffers(hearth)
  const full = hearth.roster.length >= cap
  const report = hearth.lastReport
  const pickedUnits = picked.map((id) => hearth.roster.find((u) => u.hid === id)).filter(Boolean)
  const togglePick = (hid) =>
    onPick(picked.includes(hid) ? picked.filter((x) => x !== hid) : picked.length < MAX_VETERANS ? [...picked, hid] : picked)

  return (
    <div className="hw-intro hw-hearth hw-screen-frame" data-screen="hearth">
      <button className="hw-exit-link hw-utility-btn" style={{ position: "fixed", top: 14, left: 14, right: "auto" }} onClick={onBack}>
        ← Back
      </button>
      <div className="hw-screen-eyebrow">The Hearth</div>
      <h1 className="hw-screen-title">Home between runs</h1>
      <p className="hw-flavor hw-hearth-flavor">
        Whoever is still standing when a run ends comes home here, with everything they learned. Rest them, train them,
        and bring up to {MAX_VETERANS} along on the next run.
      </p>

      <div className="hw-hearth-balance">
        <span>&#127807; {acorns} Acorns</span>
        <span>
          &#128719; {hearth.roster.length}/{cap} at home
        </span>
        <span>{hearth.runs} runs</span>
        {startEssenceBonus(hearth) > 0 && <span>+{startEssenceBonus(hearth)} starting Essence</span>}
      </div>

      {report && (
        <div className="hw-hearth-report" data-hearth-report>
          <div className="hw-hearth-report-title">{report.won ? "Home from a victory" : "Home from a hard road"}</div>
          {report.home?.length > 0 && <div>Came home: {report.home.join(", ")}.</div>}
          {report.fallen?.length > 0 && <div className="hw-hearth-fallen-line">Fell for good: {report.fallen.join(", ")}.</div>}
          {report.parted?.length > 0 && <div>Left the company (sold or merged): {report.parted.join(", ")}.</div>}
          {report.noRoom?.length > 0 && <div>No room in the Barracks: {report.noRoom.join(", ")} stayed in the forest.</div>}
          {report.aged?.length > 0 && <div>Getting old: {report.aged.join(", ")}.</div>}
          {!report.home?.length && !report.fallen?.length && <div>Nobody came home this time.</div>}
          <button className="hw-hearth-link" onClick={onDismissReport}>
            Got it
          </button>
        </div>
      )}

      <section className="hw-hearth-start">
        <div>
          <div className="hw-hearth-section-label">Next run</div>
          <div className="hw-hearth-start-line" data-hearth-picked={pickedUnits.length}>
            {pickedUnits.length
              ? `Bringing ${pickedUnits.map(unitName).join(" and ")}.`
              : `Pick up to ${MAX_VETERANS} veterans below, or go alone.`}
            {pickedUnits.length > 0 && travelHp(hearth) < 1 && (
              <span className="hw-hearth-muted"> They arrive travel-worn ({Math.round(travelHp(hearth) * 100)}% HP).</span>
            )}
            {pickedUnits.length > 0 && trainingXp(hearth) > 0 && (
              <span className="hw-hearth-muted"> +{trainingXp(hearth)} XP from training.</span>
            )}
          </div>
        </div>
        <button className="hw-end-turn hw-hearth-start-btn" data-hearth-start onClick={() => onStartRun(picked)}>
          Start a run →
        </button>
      </section>

      <section>
        <div className="hw-hearth-section-label">At home</div>
        {hearth.roster.length === 0 ? (
          <p className="hw-hearth-empty">
            Nobody here yet. Heroes that survive a run come home to the Hearth.
          </p>
        ) : (
          <div className="hw-hearth-roster">
            {hearth.roster.map((u) => {
              const def = UNITS[u.defId]
              if (!def) return null
              const decline = declineSteps(u.age)
              const isPicked = picked.includes(u.hid)
              const hurt = u.wounded && roomLevel(hearth, "infirmary") < 1
              return (
                <div key={u.hid} className={`hw-hearth-unit${isPicked ? " is-picked" : ""}`} data-hearth-unit={u.hid}>
                  <UnitCard def={def} entry={hurt ? { ...u, hpPct: 0.25 } : u} onClick={() => togglePick(u.hid)} selected={isPicked} />
                  <div className="hw-hearth-unit-meta">
                    <span className="hw-hearth-badge is-vet" title="Has been on at least one run">
                      Veteran
                    </span>
                    <span title="Runs this hero has been on">Age {u.age}</span>
                    <span>Lv{levelForXp(u.xp)}</span>
                    {decline > 0 && (
                      <span className="hw-hearth-badge is-old" title={`Old age: -${decline * 2} max HP, -${decline} attack in fights`}>
                        Old −{decline}
                      </span>
                    )}
                    {hurt && <span className="hw-hearth-badge is-hurt">Wounded</span>}
                    {u.generation > 0 && (
                      <span className="hw-hearth-badge is-gen" title="Born at the Nest - generation">
                        Gen {u.generation}
                      </span>
                    )}
                    {bredThisCycle(hearth, u) && (
                      <span className="hw-hearth-badge is-bred" title="Already raised a hatchling since the last run">
                        🪺
                      </span>
                    )}
                  </div>
                  {familyOf === u.hid && <FamilyPanel hearth={hearth} unit={u} />}
                  <div className="hw-hearth-unit-actions">
                    <button
                      className={`hw-hearth-pick${isPicked ? " is-on" : ""}`}
                      data-hearth-pick={u.hid}
                      disabled={!isPicked && picked.length >= MAX_VETERANS}
                      onClick={() => togglePick(u.hid)}
                    >
                      {isPicked ? "✓ Coming along" : "Bring on next run"}
                    </button>
                    <button className="hw-hearth-link" data-hearth-family={u.hid} onClick={() => setFamilyOf(familyOf === u.hid ? null : u.hid)}>
                      {familyOf === u.hid ? "Hide family" : "Family"}
                    </button>
                    {canRetire(u) && (
                      <button className="hw-hearth-link" data-hearth-retire={u.hid} onClick={() => onRetire(u.hid)}>
                        Retire
                      </button>
                    )}
                    {confirmRelease === u.hid ? (
                      <button className="hw-hearth-link is-danger" onClick={() => { onRelease(u.hid); setConfirmRelease(null) }}>
                        Really send away?
                      </button>
                    ) : (
                      <button className="hw-hearth-link" onClick={() => setConfirmRelease(u.hid)}>
                        Send away
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="hw-hearth-nest" data-hearth-nest data-level={nestLv}>
        <div className="hw-hearth-section-label">
          &#129722; The Nest{" "}
          {nestLv > 0 && <span className="hw-hearth-muted">· pair two heroes, raise a hatchling · {breedCost(hearth)} &#127807;</span>}
        </div>
        {hearth.lastBirth && (
          <div className="hw-nest-birth" data-nest-birth={hearth.lastBirth.hid}>
            &#128035; {hearth.lastBirth.name} hatched to {hearth.lastBirth.parents.join(" and ")}.
          </div>
        )}
        {nestLv === 0 ? (
          <p className="hw-hearth-empty">
            Build the Nest under Rooms below. Then any two heroes at home (Elders too) can raise a hatchling between runs - a
            brand-new hero that takes after its parents, odd bits included.
          </p>
        ) : (
          <>
            <div className="hw-nest-pick">
              {allHeroes(hearth).map((u) => {
                const on = livePair.includes(u.hid)
                const tired = bredThisCycle(hearth, u)
                return (
                  <button
                    key={u.hid}
                    className={`hw-nest-parent${on ? " is-on" : ""}`}
                    data-nest-parent={u.hid}
                    disabled={tired && !on}
                    title={tired ? "Already raised a hatchling since the last run" : "Pick as a parent"}
                    onClick={() => togglePair(u.hid)}
                  >
                    <span className="hw-nest-parent-name">{unitName(u)}</span>
                    <span className="hw-hearth-muted">
                      Lv{levelForXp(u.xp)}
                      {hearth.elders.some((e) => e.hid === u.hid) ? " · Elder" : ""}
                      {u.generation > 0 ? ` · Gen ${u.generation}` : ""}
                      {u.mutations?.length ? ` · 🧬${u.mutations.length}` : ""}
                    </span>
                  </button>
                )
              })}
            </div>
            {livePair.length === 2 && (
              <div className="hw-nest-preview" data-nest-preview>
                <div>
                  Kinship: <b data-nest-kin={kinship(hearth, livePair[0], livePair[1])}>{kinLabel(kinship(hearth, livePair[0], livePair[1]))}</b>
                  <span className="hw-hearth-muted">
                    {" "}
                    · chance of a bad mutation: <span data-nest-risk>{Math.round(badMutationChance(hearth, livePair[0], livePair[1]) * 100)}%</span>
                  </span>
                </div>
                <div className="hw-hearth-muted">
                  The hatchling takes after one parent (body and class - rarely the other one&apos;s class), learns one trick from
                  each, gets a feel for one parent&apos;s power (Rage, mana...), and may inherit their mutations. It starts at Lv1.
                </div>
              </div>
            )}
            <div className="hw-nest-actions">
              <button
                className="hw-hearth-buy"
                data-nest-breed
                disabled={!!blocker}
                onClick={() => {
                  onBreed?.(livePair[0], livePair[1])
                  setPair([])
                }}
              >
                Pair them · {breedCost(hearth)} &#127807;
              </button>
              {blocker && <span className="hw-hearth-muted" data-nest-blocker>{blocker}</span>}
            </div>
          </>
        )}
      </section>

      <section>
        <div className="hw-hearth-section-label">Rooms</div>
        <div className="hw-hearth-rooms">
          {HEARTH_ROOMS.map((r) => {
            const lv = roomLevel(hearth, r.id)
            const cost = roomUpgradeCost(hearth, r.id)
            const now = lv ? r.levels[lv - 1].text : r.base
            const next = cost != null ? r.levels[lv].text : null
            return (
              <div key={r.id} className="hw-hearth-room" data-hearth-room={r.id} data-level={lv}>
                <div className="hw-hearth-room-head">
                  <span className="hw-hearth-room-icon">{r.icon}</span>
                  <span className="hw-hearth-room-name">{r.name}</span>
                  <span className="hw-hearth-room-level">
                    {lv}/{r.levels.length}
                  </span>
                </div>
                <div className="hw-hearth-room-blurb">{r.blurb}</div>
                <div className="hw-hearth-room-now">{now}</div>
                {next ? (
                  <button
                    className="hw-hearth-buy"
                    data-hearth-upgrade={r.id}
                    disabled={acorns < cost}
                    onClick={() => onUpgradeRoom(r.id)}
                    title={`Next: ${next}`}
                  >
                    Upgrade · {cost} &#127807;
                    <span className="hw-hearth-buy-next">{next}</span>
                  </button>
                ) : (
                  <div className="hw-hearth-muted">Fully built</div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="hw-hearth-section-label">Furniture</div>
        <div className="hw-hearth-furniture">
          {HEARTH_FURNITURE.map((f) => {
            const owned = (hearth.furniture || []).includes(f.id)
            return (
              <button
                key={f.id}
                className={`hw-hearth-furn${owned ? " is-owned" : ""}`}
                data-hearth-furniture={f.id}
                disabled={owned || acorns < f.cost}
                onClick={() => onBuyFurniture(f.id)}
              >
                <span className="hw-hearth-furn-name">
                  {f.icon} {f.name}
                </span>
                <span className="hw-hearth-furn-text">{f.text}</span>
                <span className="hw-hearth-furn-cost">{owned ? "In place" : `${f.cost} \u{1F33F}`}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="hw-hearth-section-label">
          Recruit at the gate <span className="hw-hearth-muted">· one per run · {RECRUIT_COST} &#127807;</span>
        </div>
        {hearth.recruitUsed ? (
          <p className="hw-hearth-empty">Someone already joined since the last run. Come back after your next run.</p>
        ) : (
          <div className="hw-hearth-recruits">
            {offers.map((id) => (
              <div key={id} className="hw-hearth-recruit" data-hearth-recruit={id}>
                <UnitCard def={UNITS[id]} disabled={full || acorns < RECRUIT_COST} />
                <button
                  className="hw-hearth-buy"
                  disabled={full || acorns < RECRUIT_COST}
                  onClick={() => onRecruit(id)}
                >
                  {full ? "Barracks full" : `Recruit · ${RECRUIT_COST} \u{1F33F}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="hw-hearth-two-col">
        <div>
          <div className="hw-hearth-section-label">Elders</div>
          {hearth.elders.length === 0 ? (
            <p className="hw-hearth-empty">
              Heroes on 3+ runs can retire. Each Elder gives +{ELDER_ESSENCE} starting Essence (up to {MAX_ELDER_BONUS}).
            </p>
          ) : (
            <ul className="hw-hearth-list" data-hearth-elders={hearth.elders.length}>
              {hearth.elders.map((u) => (
                <li key={u.hid}>
                  &#127795; {unitName(u)} <span className="hw-hearth-muted">· Lv{levelForXp(u.xp)} · {u.age} runs{u.mutations?.length ? ` · 🧬${u.mutations.length}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="hw-hearth-section-label">Memorial</div>
          {hearth.memorial.length === 0 ? (
            <p className="hw-hearth-empty">No one has fallen for good. Yet.</p>
          ) : (
            <ul className="hw-hearth-list hw-hearth-memorial" data-hearth-memorial={hearth.memorial.length}>
              {hearth.memorial.map((m, i) => (
                <li key={i}>
                  &#10013; {m.name}{" "}
                  <span className="hw-hearth-muted">
                    · Lv{m.level} · fell on run {m.run}
                    {m.commander ? ` with ${m.commander}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="hw-hearth-rules">
        <div className="hw-hearth-section-label">House rules</div>
        <ul>
          <li>Every run a hero goes on makes it 1 older. From age {OLD_AGE}, it gets a little weaker each run (−2 max HP, −1 attack).</li>
          <li>
            {hearth.permadeath
              ? "Permadeath is ON: heroes that fall in the fight that ends a lost run are gone for good."
              : "Permadeath is OFF: fallen heroes come home Wounded instead."}
          </li>
        </ul>
        <label className="hw-hearth-toggle">
          <input type="checkbox" checked={hearth.permadeath} onChange={(e) => onTogglePermadeath(e.target.checked)} data-hearth-permadeath />
          Permadeath
        </label>
      </section>
    </div>
  )
}

// Family tree on a hero card: parents + grandparents, what it inherited.
function FamilyPanel({ hearth, unit }) {
  const tree = familyTree(hearth, unit.hid)
  const res = unit.affinity && RESOURCES[unit.affinity.resource]
  return (
    <div className="hw-family" data-family={unit.hid}>
      {tree.parents.length === 0 ? (
        <div className="hw-hearth-muted">Wild-born - nobody knows where it came from.</div>
      ) : (
        <ul className="hw-family-tree">
          <FamilyNode n={tree} />
        </ul>
      )}
      {unit.traits?.length > 0 && <div className="hw-family-line">Learned from its parents: {unit.traits.map((t) => t.text).join(", ")}</div>}
      {res && (
        <div className="hw-family-line" data-family-affinity={unit.affinity.resource}>
          {res.icon} {res.name} affinity: {unit.affinity.max ? `+${unit.affinity.max} max` : `+${unit.affinity.regen} each turn`} (full on a{" "}
          {res.name} hero, half otherwise)
        </div>
      )}
      {(unit.bias?.hp || unit.bias?.attack) ? (
        <div className="hw-family-line">
          Born {[unit.bias.hp ? `${unit.bias.hp > 0 ? "+" : ""}${unit.bias.hp} HP` : null, unit.bias.attack ? `${unit.bias.attack > 0 ? "+" : ""}${unit.bias.attack} attack` : null].filter(Boolean).join(", ")}
        </div>
      ) : null}
    </div>
  )
}

function FamilyNode({ n }) {
  return (
    <li>
      <span className={`hw-family-name${n.gone ? " is-gone" : ""}`} data-family-node={n.hid}>
        {n.name}
        {n.gone ? " ✝" : ""}
      </span>
      {n.parents.length > 0 && (
        <ul>
          {n.parents.map((p) => (
            <FamilyNode key={p.hid} n={p} />
          ))}
        </ul>
      )}
    </li>
  )
}
