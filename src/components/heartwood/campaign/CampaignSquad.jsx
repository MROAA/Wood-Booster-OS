import { useState } from "react"
import UnitCard from "../UnitCard"
import { UNITS } from "../../../data/heartwood/units"
import { MISSION_TYPES, regionDef } from "../../../data/heartwood/campaign"
import { levelForXp } from "../../../services/heartwood/unitLevels"
import { heroBlocker, squadLimits, squadBlocker, heroManaBonus } from "../../../services/heartwood/campaignEngine"
import { CampaignTopBar, RewardChips } from "./CampaignMap"

// Squad select: pick 4-6 rested heroes for one mission. Tired and
// Wounded heroes are greyed out with how many days they still need.
export default function CampaignSquad({ campaign, missionId, onBack, onLaunch }) {
  const mission = campaign.missions.find((m) => m.id === missionId)
  const { min, max } = squadLimits(campaign)
  const [picked, setPicked] = useState([])
  const toggle = (key) => setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length < max ? [...p, key] : p))
  const blocker = squadBlocker(campaign, missionId, picked)
  const roster = [...campaign.roster].sort((a, b) => (heroBlocker(campaign, a) ? 1 : 0) - (heroBlocker(campaign, b) ? 1 : 0))
  return (
    <div className="hwc-root hwc-squad" data-screen="campaign-squad">
      <CampaignTopBar campaign={campaign}>
        <div className="hwc-topbar-actions">
          <button className="hwc-btn hwc-btn-quiet" onClick={onBack}>
            ← World map
          </button>
        </div>
      </CampaignTopBar>
      <div className="hwc-squad-head">
        <div>
          <div className="hwc-eyebrow">
            {MISSION_TYPES[mission?.type]?.icon} {MISSION_TYPES[mission?.type]?.name} · {regionDef(mission?.regionId)?.name}
          </div>
          <h2 className="hwc-title-sm">{mission?.title}</h2>
          <RewardChips reward={mission?.reward} />
        </div>
        <div className="hwc-squad-count" data-campaign-squad-count={picked.length}>
          <strong>
            {picked.length}/{max}
          </strong>
          <span className="hwc-muted">heroes chosen (at least {min})</span>
          <button className="hwc-btn hwc-btn-gold" data-campaign-launch disabled={!!blocker} title={blocker || "Into the fight"} onClick={() => onLaunch(picked)}>
            {blocker ? blocker : "Launch mission ⚔"}
          </button>
        </div>
      </div>
      <p className="hwc-muted hwc-squad-hint">The Commander always comes along. Heroes who fight are Tired for 2 days afterwards - rotate your roster.</p>
      <div className="hwc-roster-grid">
        {roster.map((h) => {
          const why = heroBlocker(campaign, h)
          const on = picked.includes(h.key)
          const def = UNITS[h.defId]
          return (
            <div key={h.key} className="hwc-hero" data-picked={on || undefined} data-blocked={why ? true : undefined} data-campaign-hero={h.key}>
              <div className="hwc-hero-name">
                <strong>{h.name}</strong>
                <span className="hwc-muted">
                  Lv {levelForXp(h.xp || 0)} · {h.missions || 0} missions{heroManaBonus(campaign, h) ? ` · +${heroManaBonus(campaign, h)} mana` : ""}
                </span>
              </div>
              <UnitCard def={def} entry={h} selected={on} disabled={!!why} onClick={() => !why && toggle(h.key)} />
              {why && <span className="hwc-status-chip">{why}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
