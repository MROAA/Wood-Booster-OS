import { UNITS } from "../../../data/heartwood/units"
import { CLASSES } from "../../../data/heartwood/classes"
import { MISSION_TYPES } from "../../../data/heartwood/campaign"

const OUTCOME = {
  won: { title: "Mission won", line: "The squad comes home." },
  lost: { title: "Mission lost", line: "Nobody walked out of that one." },
  retreat: { title: "Retreat", line: "You pulled out what was left of the squad." },
}

// After a mission: rewards, who came home (and how hurt), and - in its own
// sombre block - who did not. The fallen are now in the Memorial.
export default function CampaignAftermath({ campaign, aftermath, onContinue }) {
  const o = OUTCOME[aftermath.outcome] || OUTCOME.won
  return (
    <div className="hwc-root hwc-aftermath" data-screen="campaign-aftermath" data-outcome={aftermath.outcome}>
      <div className="hwc-eyebrow">
        Day {aftermath.day} · {MISSION_TYPES[aftermath.type]?.icon} {aftermath.title}
      </div>
      <h1 className="hwc-title">{o.title}</h1>
      <p className="hwc-flavor">{aftermath.wipe ? "The whole squad is gone." : o.line}</p>

      {aftermath.rewards?.length > 0 && (
        <div className="hwc-chips hwc-aftermath-rewards">
          {aftermath.rewards.map((r) => (
            <span key={r} className="hwc-chip is-essence">
              {r}
            </span>
          ))}
        </div>
      )}

      {aftermath.deaths?.length > 0 && (
        <div className="hwc-fallen" data-campaign-fallen={aftermath.deaths.length}>
          <div className="hwc-fallen-candle" aria-hidden="true">
            🕯
          </div>
          <div className="hwc-fallen-title">{aftermath.deaths.length === 1 ? "One did not come home" : `${aftermath.deaths.length} did not come home`}</div>
          {aftermath.deaths.map((d) => (
            <div key={d.key} className="hwc-fallen-row">
              <strong>{d.name}</strong>
              <span>
                {UNITS[d.defId]?.name || d.defId}
                {d.classId && CLASSES[d.classId] ? `, ${CLASSES[d.classId].name}` : ""} · Level {d.level}
              </span>
              <span className="hwc-muted">
                Served {d.daysServed} day{d.daysServed === 1 ? "" : "s"} · {d.missions} mission{d.missions === 1 ? "" : "s"} · {d.kills} kill{d.kills === 1 ? "" : "s"}
              </span>
              <em>{d.cause}</em>
            </div>
          ))}
          <div className="hwc-muted">Their names are on the Memorial at the Hearth.</div>
        </div>
      )}

      {aftermath.survivors?.length > 0 && (
        <div className="hwc-survivors">
          <div className="hwc-section-label">Came home</div>
          {aftermath.survivors.map((s) => (
            <div key={s.key} className="hwc-survivor">
              <span>{s.name}</span>
              <span className="hwc-hpbar" title={`${Math.round(s.hpPct * 100)}% HP`}>
                <span style={{ width: `${Math.round(s.hpPct * 100)}%` }} />
              </span>
              <span className="hwc-muted">Tired 2 days</span>
            </div>
          ))}
        </div>
      )}

      {(aftermath.levelUps?.length > 0 || aftermath.lines?.length > 0) && (
        <ul className="hwc-aftermath-lines">
          {aftermath.levelUps?.map((l) => (
            <li key={`lv-${l.name}`}>
              ★ {l.name} reached Level {l.level}!
            </li>
          ))}
          {aftermath.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}

      <button className="hwc-btn hwc-btn-gold" data-campaign-aftermath-continue onClick={onContinue}>
        {campaign.status === "active" ? "Back to the world map" : "Continue"}
      </button>
    </div>
  )
}
