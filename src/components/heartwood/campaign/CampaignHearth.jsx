import { useState } from "react"
import UnitCard from "../UnitCard"
import { UNITS } from "../../../data/heartwood/units"
import { ITEMS } from "../../../data/heartwood/items"
import { CLASSES } from "../../../data/heartwood/classes"
import { CAMPAIGN_ROOMS, ATTUNE_MAX, ATTUNE_MANA, ATTUNE_COST } from "../../../data/heartwood/campaign"
import { levelForXp } from "../../../services/heartwood/unitLevels"
import { effectiveItemSlots } from "../../../services/heartwood/runEngine"
import { gearRow } from "../../../services/heartwood/gear"
import {
  roomLevel, roomInfo, buildCost, buildBlocker, recruitBlocker, rosterCap, heroBlocker, attuneBlocker, heroManaBonus,
  healPerDay, trainingXpPerDay, leyWellMana, campaignRunView,
} from "../../../services/heartwood/campaignEngine"
import { CampaignTopBar } from "./CampaignMap"
import { Stakes } from "./CampaignStoryScene"
import { chronicleEntries, storyStanding, endingsInReach, ENDINGS, UNIQUE_HEROES } from "../../../services/heartwood/campaignStoryEngine"

// The Hearth in the campaign: rooms that take days to build, recruits,
// the roster (with Ley attunement), a small armoury and the Memorial.
export default function CampaignHearth({ campaign, onBack, onBuild, onRecruit, onAttune, onEquip, onUnequip, onPassDay }) {
  const [tab, setTab] = useState("rooms")
  const building = campaign.hearth?.building
  const view = campaignRunView(campaign)
  const slots = effectiveItemSlots(view)
  const freeSlot = (owner) => gearRow(campaign.items, owner, slots).findIndex((x) => !x)
  const bag = campaign.items.filter((it) => it.equippedTo == null)
  const tabs = [
    ["rooms", "Rooms"],
    ["recruit", `Recruits (${campaign.recruitOffers.length})`],
    ["roster", `Roster (${campaign.roster.length})`],
    ["armoury", `Armoury (${bag.length})`],
    ["memorial", `Memorial (${campaign.memorial.length})`],
    ["chronicle", `Chronicle (${campaign.story?.chronicle?.length || 0})`],
  ]
  return (
    <div className="hwc-root hwc-hearth" data-screen="campaign-hearth">
      <CampaignTopBar campaign={campaign}>
        <div className="hwc-topbar-actions">
          <button className="hwc-btn hwc-btn-quiet" onClick={onBack} data-campaign-back-to-map>
            ← World map
          </button>
          <button className="hwc-btn hwc-btn-gold" onClick={onPassDay} data-campaign-pass-day>
            ☀ Next day
          </button>
        </div>
      </CampaignTopBar>
      <div className="hwc-eyebrow">The Hearth</div>
      <p className="hwc-flavor">
        Home. Heroes heal {Math.round(healPerDay(campaign) * 100)}% a day here
        {trainingXpPerDay(campaign) ? `, and train ${trainingXpPerDay(campaign)} XP a day` : ""}
        {leyWellMana(campaign) ? `; the Ley Well gives everyone +${leyWellMana(campaign)} max mana` : ""}.
      </p>
      <div className="hwc-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" className="hwc-tab" data-active={tab === id || undefined} data-campaign-tab={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "rooms" && (
        <div className="hwc-rooms" data-campaign-rooms>
          {CAMPAIGN_ROOMS.map((r) => {
            const info = roomInfo(r.id)
            const lv = roomLevel(campaign, r.id)
            const cost = buildCost(campaign, r.id)
            const why = buildBlocker(campaign, r.id)
            const isBuilding = building?.roomId === r.id
            return (
              <div key={r.id} className="hwc-room" data-room={r.id} data-level={lv} data-building={isBuilding || undefined}>
                <div className="hwc-room-head">
                  <span className="hwc-room-icon">{info.icon}</span>
                  <strong>{info.name}</strong>
                  <span className="hwc-pips">
                    {r.levels.map((_, i) => (
                      <span key={i} className="hwc-pip" data-on={i < lv || undefined} />
                    ))}
                  </span>
                </div>
                <div className="hwc-muted">{r.blurb}</div>
                <div className="hwc-room-now">Now: {lv ? r.levels[lv - 1].text : r.base}</div>
                {isBuilding ? (
                  <div className="hwc-room-progress">
                    🔨 Building Level {building.level} - ready on day {building.doneDay} ({building.doneDay - campaign.day} day{building.doneDay - campaign.day === 1 ? "" : "s"})
                  </div>
                ) : cost ? (
                  <>
                    <div className="hwc-room-next">Next: {cost.text}</div>
                    <button className="hwc-btn" data-campaign-build={r.id} disabled={!!why} title={why || ""} onClick={() => onBuild(r.id)}>
                      {why && why !== "The builders are busy." ? why : `Build · ${cost.essence} 🌿${cost.shards ? ` + ${cost.shards} ✦` : ""} · ${cost.days} days`}
                    </button>
                  </>
                ) : (
                  <div className="hwc-room-next">Fully built.</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === "recruit" && (
        <div className="hwc-recruits" data-campaign-recruits>
          <p className="hwc-muted">
            {campaign.roster.length}/{rosterCap(campaign)} in the Barracks. New faces come by on day {campaign.nextRecruitDay}.
          </p>
          <div className="hwc-roster-grid">
            {campaign.recruitOffers.map((o) => {
              const why = recruitBlocker(campaign, o.id)
              return (
                <div key={o.id} className="hwc-hero" data-rookie={o.rookie || undefined}>
                  <UnitCard def={UNITS[o.defId]} entry={{ heroTraits: o.traits }} disabled={!!why} />
                  <button className="hwc-btn" data-campaign-recruit={o.id} disabled={!!why} onClick={() => onRecruit(o.id)}>
                    {why || (o.cost ? `Recruit · ${o.cost} 🌿` : "Take them in · free")}
                  </button>
                </div>
              )
            })}
            {campaign.recruitOffers.length === 0 && <p className="hwc-muted">Nobody is waiting right now.</p>}
          </div>
        </div>
      )}

      {tab === "roster" && (
        <div className="hwc-roster-grid" data-campaign-roster>
          <div className="hwc-hero hwc-commander-tile">
            <strong>Commander</strong>
            <span className="hwc-muted">Always leads the squad. {Math.round((campaign.commander?.hpPct ?? 1) * 100)}% HP</span>
          </div>
          {campaign.roster.map((h) => {
            const why = heroBlocker(campaign, h)
            const attuneWhy = attuneBlocker(campaign, h.key)
            return (
              <div key={h.key} className="hwc-hero" data-blocked={why ? true : undefined}>
                <div className="hwc-hero-name">
                  <strong>{h.name}</strong>
                  {h.uniqueId && UNIQUE_HEROES[h.uniqueId] && <span className="hwc-unique-title">{UNIQUE_HEROES[h.uniqueId].title}</span>}
                  <span className="hwc-muted">
                    Lv {levelForXp(h.xp || 0)} · joined day {h.joinedDay} · {h.missions || 0} missions
                  </span>
                </div>
                <UnitCard def={UNITS[h.defId]} entry={h} />
                <span className="hwc-status-chip" data-ok={!why || undefined}>
                  {why || "Ready"}
                </span>
                <button className="hwc-btn hwc-btn-ley" data-campaign-attune={h.key} disabled={!!attuneWhy} onClick={() => onAttune(h.key)} title={`Spend ${ATTUNE_COST} Ley Shard: +${ATTUNE_MANA} max mana for good (max ${ATTUNE_MAX}).`}>
                  ✦ Attune {h.attune || 0}/{ATTUNE_MAX} · mana +{heroManaBonus(campaign, h)}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === "armoury" && (
        <div className="hwc-armoury" data-campaign-armoury>
          {campaign.items.length === 0 && <p className="hwc-muted">No gear yet. Elite hunts and supply caches bring some home.</p>}
          {campaign.items.map((it) => {
            const def = ITEMS[it.defId]
            const owner = it.equippedTo === "commander" ? "Commander" : campaign.roster.find((h) => h.key === it.equippedTo)?.name
            return (
              <div key={it.key} className="hwc-gear-row">
                <span className="hwc-gear-name">
                  <strong>{def?.name}</strong> <span className="hwc-muted">{def?.text || def?.description || ""}</span>
                </span>
                {it.equippedTo != null ? (
                  <span className="hwc-gear-owner">
                    on {owner || "someone"}
                    <button className="hwc-btn hwc-btn-quiet" onClick={() => onUnequip(it.key)}>
                      Take off
                    </button>
                  </span>
                ) : (
                  <select
                    className="hwc-select"
                    value=""
                    onChange={(e) => {
                      const raw = e.target.value
                      if (!raw) return
                      const ownerKey = raw === "commander" ? "commander" : Number(raw)
                      const slot = freeSlot(ownerKey)
                      if (slot >= 0) onEquip(it.key, ownerKey, slot)
                    }}
                  >
                    <option value="">Give to...</option>
                    <option value="commander">Commander</option>
                    {campaign.roster.map((h) => (
                      <option key={h.key} value={h.key} disabled={freeSlot(h.key) < 0}>
                        {h.name} ({UNITS[h.defId]?.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === "chronicle" && <Chronicle campaign={campaign} />}

      {tab === "memorial" && (
        <div className="hwc-memorial-wall" data-campaign-memorial>
          {campaign.memorial.length === 0 && <p className="hwc-muted">No names here yet. Keep it that way as long as you can.</p>}
          {campaign.memorial.map((m) => (
            <div key={`${m.key}-${m.diedDay}`} className="hwc-memorial-stone">
              <span className="hwc-memorial-candle">🕯</span>
              <strong>{m.name}</strong>
              <span>
                {UNITS[m.defId]?.name}
                {m.classId && CLASSES[m.classId] ? `, ${CLASSES[m.classId].name}` : ""} · Lv {m.level}
              </span>
              <span className="hwc-muted">
                Day {m.joinedDay}–{m.diedDay} · served {m.daysServed} days · {m.missions} missions · {m.kills} kills
              </span>
              {m.scars?.length > 0 && <span className="hwc-muted">{m.scars.length} scar{m.scars.length > 1 ? "s" : ""} and honours</span>}
              <em>{m.cause}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// The Chronicle: every story choice so far, what it did, and where the
// story stands now (allies, nemeses, the ley, which endings are in reach).
function Chronicle({ campaign }) {
  const entries = chronicleEntries(campaign)
  const standing = storyStanding(campaign)
  const reach = endingsInReach(campaign.story?.flags || {})
  return (
    <div className="hwc-chronicle" data-campaign-chronicle>
      {entries.length === 0 && <p className="hwc-muted">Nothing written yet. Every chapter's story mission ends in a choice - this is where they're kept.</p>}
      <ol className="hwc-chronicle-list">
        {entries.map((e) => (
          <li key={`${e.chapter}-${e.sceneId}`} className="hwc-chronicle-entry" data-campaign-chronicle-entry={e.sceneId}>
            <div className="hwc-chronicle-head">
              <span className="hwc-chronicle-chapter">Chapter {e.chapter}</span>
              <span className="hwc-muted">Day {e.day}</span>
            </div>
            <strong>
              {e.icon} {e.title} - {e.label}
            </strong>
            {e.result && <p className="hwc-chronicle-result">{e.result}</p>}
            <Stakes stakes={e.stakes} />
          </li>
        ))}
      </ol>
      {standing.length > 0 && (
        <>
          <div className="hwc-section-label">Where the story stands</div>
          <div className="hwc-standing">
            {standing.map((x) => (
              <div key={x.text} className="hwc-standing-row" data-bad={x.bad || undefined}>
                <span aria-hidden="true">{x.icon}</span> {x.text}
              </div>
            ))}
          </div>
        </>
      )}
      {entries.length > 0 && (
        <>
          <div className="hwc-section-label">Endings still within reach</div>
          <div className="hwc-chips" data-campaign-reach={reach.length}>
            {reach.map((id) => (
              <span key={id} className="hwc-chip" style={{ borderColor: ENDINGS[id].color, color: ENDINGS[id].color }}>
                {ENDINGS[id].title}
              </span>
            ))}
          </div>
          <p className="hwc-muted">Your choices open some endings and close others. A second campaign can take a very different road.</p>
        </>
      )}
    </div>
  )
}
