// The Long Campaign - content sprint UI. Everything the new content shows:
//   - MissionBriefing: the briefing card for a mission (goal, rules, the
//     chapter's foes and their kits, the battlefield, a Named Foe's intro);
//   - EventMarkers (inside the world-map SVG) + WorldEventCard (side panel):
//     a chapter / world event waiting on the map, its choices, and what the
//     choice did;
//   - LastingEffects: the event effects still running;
//   - CampaignOpsPanel: the campaign fight's own panel (objective, enemy
//     kits, the storm's colour, the field, the Named Foe's words).
// Reads: campaignContentEngine.js / tacticsCampaignOps.js (pure).
import { regionDef, MISSION_TYPES } from "../../../data/heartwood/campaign"
import { MISSION_BRIEFS, CHAPTER_FEATURES } from "../../../data/heartwood/campaignContent"
import { CAMPAIGN_BOSS_FIGHTS } from "../../../data/heartwood/campaignBosses"
import { FORMATIONS } from "../../../data/heartwood/formations"
import { ENEMIES } from "../../../data/heartwood/enemies"
import { MANA_COLOURS } from "../../../data/heartwood/manaColours"
import { contentOf, eventDef, eventOptions, lastingList } from "../../../services/heartwood/campaignContentEngine"
import { campaignOpsView } from "../../../services/heartwood/tacticsCampaignOps"
import { CardGlyph } from "../cardArt"
import { Stakes } from "./CampaignStoryScene"
import "./campaign-content.css"

function FoeRow({ defId }) {
  const def = ENEMIES[defId]
  if (!def) return null
  const kit = def.campKit
  return (
    <li className="hwc-foe" data-campaign-foe={defId} data-colour={kit?.colour || undefined} title={kit ? `${kit.label}: ${kit.text}` : def.description}>
      <span className="hwc-foe-glyph" aria-hidden="true">
        <CardGlyph name={def.art} />
      </span>
      <span className="hwc-foe-name">{def.name}</span>
      {kit && (
        <span className="hwc-foe-kit">
          {kit.icon} {kit.label}
        </span>
      )}
    </li>
  )
}

export function MissionBriefing({ mission }) {
  if (!mission) return null
  const brief = MISSION_BRIEFS[mission.type]
  const formation = mission.bossId || mission.roster ? FORMATIONS[mission.bossId || mission.roster] : null
  const feature = mission.feature ? CHAPTER_FEATURES[mission.feature] : null
  const boss = mission.bossId ? CAMPAIGN_BOSS_FIGHTS[mission.bossId] : null
  if (!brief && !formation && !feature) return null
  const foes = formation ? [...new Set(formation.pieces.map((p) => p.defId))] : []
  return (
    <div className="hwc-briefing" data-campaign-briefing={mission.type}>
      {brief && (
        <>
          <div className="hwc-briefing-goal">
            <span aria-hidden="true">{MISSION_TYPES[mission.type]?.icon}</span> {brief.goal}
          </div>
          <ul className="hwc-briefing-rules">
            {brief.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}
      {boss && (
        <div className="hwc-briefing-boss" data-campaign-briefing-boss={mission.bossId}>
          <strong>
            {boss.name}, {boss.title}
          </strong>
          {ENEMIES[mission.bossId]?.introLine && <em className="hwc-briefing-intro">{ENEMIES[mission.bossId].introLine}</em>}
          <ol className="hwc-briefing-phases">
            {boss.phases.map((ph) => (
              <li key={ph.name}>
                <strong>{ph.name}</strong> - {ph.text}
              </li>
            ))}
          </ol>
        </div>
      )}
      {foes.length > 0 && (
        <>
          <div className="hwc-briefing-label">{formation.name}</div>
          <ul className="hwc-foes">
            {foes.map((id) => (
              <FoeRow key={id} defId={id} />
            ))}
          </ul>
        </>
      )}
      {feature && (
        <div className="hwc-briefing-feature" data-campaign-feature={feature.id}>
          <span aria-hidden="true">{feature.icon}</span> <strong>{feature.name}</strong> - {feature.text}
        </div>
      )}
    </div>
  )
}

// Event markers on the world map (inside its <svg>).
export function EventMarkers({ campaign, onOpen }) {
  const events = contentOf(campaign).events
  return (
    <g className="hwc-event-markers">
      {events.map((ev) => {
        const def = eventDef(ev.id)
        const r = regionDef(ev.regionId)
        if (!def || !r) return null
        return (
          <g key={ev.uid} className="hwc-event-marker" data-campaign-event-marker={ev.id} transform={`translate(${r.x - 7.5} ${r.y - 6})`} onClick={() => onOpen?.(ev.uid)}>
            <title>{`${def.title} - ${ev.expiresDay - campaign.day + 1} day(s) left`}</title>
            <circle r="3.4" className="hwc-event-ring" />
            <circle r="2.7" className="hwc-event-core" />
            <text y="1" className="hwc-event-icon">
              {def.icon}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// The waiting event (or what the last choice did) - side panel card.
export function WorldEventCard({ campaign, onChoose, onDismiss }) {
  const content = contentOf(campaign)
  const last = content.lastEvent
  if (last) {
    return (
      <div className="hwc-event-card is-result" data-campaign-event-result={last.id}>
        <div className="hwc-event-head">
          <span className="hwc-event-big" aria-hidden="true">
            {last.icon}
          </span>
          <div>
            <div className="hwc-eyebrow">{last.title}</div>
            <strong>{last.label}</strong>
          </div>
        </div>
        <p className="hwc-event-result">{last.result}</p>
        {last.lines?.length > 0 && (
          <ul className="hwc-event-effects">
            {last.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        <button className="hwc-btn hwc-btn-quiet" data-campaign-event-dismiss onClick={onDismiss}>
          Continue
        </button>
      </div>
    )
  }
  const ev = content.events[0]
  const def = ev ? eventDef(ev.id) : null
  if (!def) return null
  const left = ev.expiresDay - campaign.day + 1
  const options = eventOptions(campaign, ev.uid)
  return (
    <div className="hwc-event-card" data-campaign-event={def.id}>
      <div className="hwc-event-head">
        <span className="hwc-event-big" aria-hidden="true">
          {def.icon}
        </span>
        <div>
          <div className="hwc-eyebrow">
            {regionDef(ev.regionId)?.name} · {left} day{left === 1 ? "" : "s"} left
          </div>
          <strong className="hwc-event-title">{def.title}</strong>
        </div>
      </div>
      <div className="hwc-event-lines">
        {def.lines.map(([speaker, text], i) => (
          <p key={i} data-narration={!speaker || undefined}>
            {speaker && <span className="hwc-story-speaker">{speaker}</span>} {text}
          </p>
        ))}
      </div>
      <div className="hwc-event-options">
        {options.map((o) => (
          <button key={o.id} className="hwc-event-option" data-campaign-event-option={o.id} disabled={!!o.blocked} data-blocked={o.blocked ? true : undefined} onClick={() => onChoose(ev.uid, o.id)}>
            <strong>{o.label}</strong>
            {o.say && <em className="hwc-choice-say">{o.say}</em>}
            {o.blocked ? <span className="hwc-choice-locked">🔒 {o.blocked}</span> : <Stakes stakes={o.stakes} />}
          </button>
        ))}
      </div>
    </div>
  )
}

export function LastingEffects({ campaign }) {
  const list = lastingList(campaign)
  if (!list.length) return null
  return (
    <div className="hwc-lasting" data-campaign-lasting={list.length}>
      {list.map((e) => (
        <span key={e.uid} className="hwc-lasting-chip" data-kind={e.kind} title={e.label}>
          {e.icon} {e.text}
          {e.kind !== "ally" && e.kind !== "rival" && <span className="hwc-muted"> · {e.daysLeft}d</span>}
        </span>
      ))}
    </div>
  )
}

// The campaign fight's own panel (a TacticsBoard child).
export function CampaignOpsPanel({ battle }) {
  const view = campaignOpsView(battle)
  if (!view || (!view.kind && !view.kits.length && !view.feature)) return null
  const now = view.storm?.now ? MANA_COLOURS[view.storm.now] : null
  const next = view.storm?.next ? MANA_COLOURS[view.storm.next] : null
  return (
    <div className="hwc-ops" data-campaign-ops={view.kind || "fight"} style={now ? { "--hwc-storm": now.color } : undefined}>
      {view.objective && (
        <div className="hwc-ops-objective">
          <strong>{view.objective.title}</strong> <span>{view.objective.detail}</span>
        </div>
      )}
      {now && (
        <div className="hwc-ops-storm" data-campaign-storm={view.storm.now}>
          <span className="hwc-ops-storm-now">
            {now.icon} Storm: {now.name}
          </span>
          {next && (
            <span className="hwc-muted">
              next {next.icon} {next.name}
            </span>
          )}
        </div>
      )}
      {view.intro && <em className="hwc-ops-intro">{view.intro}</em>}
      {view.kits.length > 0 && (
        <ul className="hwc-ops-kits">
          {view.kits.map((k) => (
            <li key={k.defId} data-campaign-kit={k.defId} data-colour={k.colour || undefined} title={k.text}>
              <span aria-hidden="true">{k.icon}</span> <strong>{k.name}</strong> · {k.label}
              {k.status && <span className="hwc-ops-kit-status"> ({k.status})</span>}
            </li>
          ))}
        </ul>
      )}
      {view.feature && (
        <div className="hwc-ops-feature" title={view.feature.text}>
          {view.feature.icon} {view.feature.name}
        </div>
      )}
      {view.leySevered > 0 && <div className="hwc-ops-warn">✂ A ley line here will be cut after this fight.</div>}
    </div>
  )
}
