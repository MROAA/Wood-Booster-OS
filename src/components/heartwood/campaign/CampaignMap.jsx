import { useMemo, useState } from "react"
import { CHARACTERS } from "../../../data/heartwood/characters"
import { regionDef } from "../../../data/heartwood/campaign"
import { CAMPAIGN_HELP } from "../../../data/heartwood/help"
import { ITEMS } from "../../../data/heartwood/items"
import { RELICS } from "../../../data/heartwood/relics"
import {
  CAMPAIGN_REGIONS, CAMPAIGN_ROADS, MISSION_TYPES, THREAT_FALLEN, regionState, doomMax, rosterCap, missionRunState,
  difficultyOf, availableHeroes, campaignThreatBonus, regionOpen, storyWinsNeeded, storyBeat, regionMod,
} from "../../../services/heartwood/campaignEngine"
import { FACTIONS, REGION_MODS, storyStanding } from "../../../services/heartwood/campaignStoryEngine"
import { difficultyForRunNode } from "../../../services/heartwood/tacticsRealMatchup"

const STATE_LABEL = { safe: "Safe", threatened: "Threatened", fallen: "Fallen", sunk: "Sunk" }

// Danger of a mission = the DifficultyEngine tier its fight will get.
function dangerOf(campaign, m) {
  const run = missionRunState(campaign, m.id, [])
  const spec = run ? difficultyForRunNode(run) : null
  return spec ? { tier: spec.tier, name: spec.name } : { tier: 0, name: "Unknown" }
}

export function RewardChips({ reward }) {
  if (!reward) return null
  return (
    <span className="hwc-chips">
      {reward.essence > 0 && <span className="hwc-chip is-essence">+{reward.essence} Essence</span>}
      {reward.leyShards > 0 && <span className="hwc-chip is-ley">+{reward.leyShards} ✦ Ley</span>}
      {reward.recruit && <span className="hwc-chip is-hero">+1 hero</span>}
      {reward.item && ITEMS[reward.item] && <span className="hwc-chip is-item">{ITEMS[reward.item].name}</span>}
      {reward.relic && <span className="hwc-chip is-relic">Relic: {RELICS[reward.relic]?.name || reward.relic}</span>}
    </span>
  )
}

export function DoomDial({ doom, max }) {
  const pct = Math.max(0, Math.min(1, doom / max))
  const r = 26
  const len = 2 * Math.PI * r
  return (
    <div className="hwc-doom" data-campaign-doom={doom} title={`Doom ${doom}/${max}. When it fills, the campaign is lost.`}>
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="hwc-doom-track" />
        <circle cx="32" cy="32" r={r} className="hwc-doom-fill" strokeDasharray={`${len * pct} ${len}`} transform="rotate(-90 32 32)" />
        {Array.from({ length: max }, (_, i) => {
          const a = (i / max) * Math.PI * 2 - Math.PI / 2
          return <line key={i} x1={32 + Math.cos(a) * 30} y1={32 + Math.sin(a) * 30} x2={32 + Math.cos(a) * 31.5} y2={32 + Math.sin(a) * 31.5} className="hwc-doom-tick" />
        })}
      </svg>
      <div className="hwc-doom-label">
        <strong>{doom}</strong>
        <span>/{max}</span>
      </div>
      <div className="hwc-doom-caption">Doom</div>
    </div>
  )
}

export function CampaignTopBar({ campaign, children }) {
  const ch = storyBeat(campaign)
  return (
    <div className="hwc-topbar">
      <div className="hwc-topbar-day">
        <span className="hwc-day">Day {campaign.day}</span>
        <span className="hwc-muted">
          Chapter {campaign.chapter} · {ch?.title} · {difficultyOf(campaign).name}
        </span>
      </div>
      <div className="hwc-topbar-res">
        <span title="Essence: recruits and building">🌿 {campaign.essence}</span>
        <span title="Ley Shards: mana. Build the Ley Well, attune heroes.">✦ {campaign.leyShards || 0}</span>
        <span title="Heroes in the roster / Barracks space">
          🛏 {campaign.roster.length}/{rosterCap(campaign)}
        </span>
      </div>
      {children}
    </div>
  )
}

export default function CampaignMap({ campaign, onExit, onHearth, onPassDay, onPickMission }) {
  const [focus, setFocus] = useState(null) // mission id
  const [help, setHelp] = useState(false)
  const standing = storyStanding(campaign)
  const winsLeft = Math.max(0, storyWinsNeeded(campaign) - (campaign.chapterWins || 0))
  const max = doomMax(campaign)
  const dangers = useMemo(() => Object.fromEntries(campaign.missions.map((m) => [m.id, dangerOf(campaign, m)])), [campaign])
  const missions = [...campaign.missions].sort((a, b) => (a.expiresDay ?? 9999) - (b.expiresDay ?? 9999))
  const focused = missions.find((m) => m.id === focus) || null
  const ready = availableHeroes(campaign).length
  const report = campaign.lastDayReport
  const bonus = campaignThreatBonus(campaign)
  const offsetFor = (m) => {
    const same = missions.filter((x) => x.regionId === m.regionId)
    const i = same.indexOf(m)
    return { dx: (i - (same.length - 1) / 2) * 6, dy: -7.5 }
  }
  return (
    <div className="hwc-root hwc-map-screen" data-screen="campaign-map">
      <CampaignTopBar campaign={campaign}>
        <div className="hwc-topbar-actions">
          <button className="hwc-btn hwc-btn-quiet" onClick={onExit}>
            ← Menu
          </button>
          <button className="hwc-btn hwc-btn-quiet" data-campaign-help onClick={() => setHelp((h) => !h)} title="How the campaign works">
            ?
          </button>
          <button className="hwc-btn" data-campaign-hearth onClick={onHearth}>
            🔥 The Hearth
          </button>
          <button className="hwc-btn hwc-btn-gold" data-campaign-pass-day onClick={onPassDay} title="Rest a day: heroes heal, rooms build - and the Rot grows.">
            ☀ Next day
          </button>
        </div>
      </CampaignTopBar>

      {help && (
        <div className="hwc-help" data-campaign-help-panel>
          <div className="hwc-section-label">How the campaign works</div>
          <dl className="hwc-help-list">
            {CAMPAIGN_HELP.map((e) => (
              <div key={e.term} className="hwc-help-row">
                <dt>{e.term}</dt>
                <dd>{e.blurb}</dd>
              </div>
            ))}
          </dl>
          <button className="hwc-btn hwc-btn-quiet" onClick={() => setHelp(false)}>
            Close
          </button>
        </div>
      )}

      <div className="hwc-map-layout">
        <div className="hwc-map-panel">
          <svg className="hwc-map" viewBox="0 0 100 90" data-campaign-world-map role="img" aria-label="World map">
            <defs>
              <radialGradient id="hwc-land" cx="50%" cy="55%" r="65%">
                <stop offset="0%" stopColor="var(--hwc-land-hi)" />
                <stop offset="100%" stopColor="var(--hwc-land-lo)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="90" rx="3" fill="url(#hwc-land)" />
            {CAMPAIGN_ROADS.map(([a, b]) => {
              const ra = regionDef(a)
              const rb = regionDef(b)
              return <line key={`${a}-${b}`} x1={ra.x} y1={ra.y} x2={rb.x} y2={rb.y} className="hwc-road" />
            })}
            {CAMPAIGN_REGIONS.map((def) => {
              const st = campaign.regions.find((r) => r.id === def.id)
              const state = regionOpen(campaign, def.id) ? regionState(campaign, def.id) : "dormant"
              // Story marks (campaignStory.js REGION_MODS): allied / warded / drained / sunk.
              const mod = regionMod(campaign, def.id)
              const faction = mod === "allied" ? Object.values(FACTIONS).find((f) => f.region === def.id) : null
              const pct = Math.min(1, (st?.threat || 0) / THREAT_FALLEN)
              const R = def.home ? 7 : 6
              const ring = 2 * Math.PI * (R + 1.6)
              return (
                <g key={def.id} className="hwc-region" data-state={state} data-mod={mod || undefined} data-region={def.id} data-ley={def.ley || undefined} data-home={def.home || undefined}>
                  <title>
                    {state === "dormant"
                      ? `${def.name} - quiet for now. The road reaches it in Chapter ${def.offset + 1}.`
                      : `${def.name} - ${STATE_LABEL[state]} (threat ${Math.round(st?.threat || 0)}/100). ${mod ? `${REGION_MODS[mod].label}: ${REGION_MODS[mod].text}` : def.blurb}`}
                  </title>
                  {def.ley && mod !== "drained" && mod !== "sunk" && <circle cx={def.x} cy={def.y} r={R + 4} className="hwc-region-ley" />}
                  {mod === "warded" && <circle cx={def.x} cy={def.y} r={R + 5.6} className="hwc-region-ward" />}
                  {mod === "sunk" && <circle cx={def.x} cy={def.y} r={R + 4.5} className="hwc-region-flood" />}
                  <circle cx={def.x} cy={def.y} r={R + 1.6} className="hwc-region-ring-track" />
                  <circle cx={def.x} cy={def.y} r={R + 1.6} className="hwc-region-ring" strokeDasharray={`${ring * pct} ${ring}`} transform={`rotate(-90 ${def.x} ${def.y})`} />
                  <circle cx={def.x} cy={def.y} r={R} className="hwc-region-core" />
                  <text x={def.x} y={def.y + 1.3} className="hwc-region-icon">
                    {def.home ? "🔥" : state === "sunk" ? "◐" : state === "fallen" ? "☠" : mod === "drained" ? "🥀" : def.ley ? "✦" : "🌲"}
                  </text>
                  {faction && (
                    <g className="hwc-region-banner" data-campaign-banner={faction.id}>
                      <circle cx={def.x + R * 0.85} cy={def.y - R * 0.85} r="2.6" />
                      <text x={def.x + R * 0.85} y={def.y - R * 0.85 + 1}>
                        {faction.icon}
                      </text>
                    </g>
                  )}
                  <text x={def.x} y={def.y + R + 5.2} className="hwc-region-name">
                    {def.short}
                  </text>
                  <text x={def.x} y={def.y + R + 8.6} className="hwc-region-threat">
                    {state === "sunk" ? "SUNK" : state === "fallen" ? "FALLEN" : state === "dormant" ? `Chapter ${def.offset + 1}` : `${Math.round(st?.threat || 0)}%${mod && mod !== "sunk" ? ` · ${REGION_MODS[mod].label}` : ""}`}
                  </text>
                </g>
              )
            })}
            {missions.map((m) => {
              const def = regionDef(m.regionId)
              const { dx, dy } = offsetFor(m)
              const t = MISSION_TYPES[m.type]
              const left = m.expiresDay != null ? m.expiresDay - campaign.day : null
              return (
                <g
                  key={m.id}
                  className="hwc-pin"
                  data-type={m.type}
                  data-focus={focus === m.id || undefined}
                  data-urgent={left != null && left <= 1 ? true : undefined}
                  data-campaign-pin={m.id}
                  onClick={() => setFocus(m.id)}
                  transform={`translate(${def.x + dx} ${def.y + dy})`}
                >
                  <title>{m.title}</title>
                  <path d="M0 3.4 L-2.7 -0.6 A3.2 3.2 0 1 1 2.7 -0.6 Z" className="hwc-pin-body" />
                  <text y="-0.4" className="hwc-pin-icon">
                    {t.icon}
                  </text>
                  {left != null && (
                    <text y="-4.6" className="hwc-pin-days">
                      {left}d
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          <div className="hwc-legend">
            <span className="hwc-legend-dot is-safe" /> Safe
            <span className="hwc-legend-dot is-threatened" /> Threatened
            <span className="hwc-legend-dot is-fallen" /> Fallen
            <span className="hwc-legend-dot is-ley" /> Ley region (mana-rich fights)
            <span className="hwc-legend-dot is-dormant" /> Not reached yet
            {standing.length > 0 && (
              <>
                <span className="hwc-legend-dot is-allied" /> Allied / Warded
                <span className="hwc-legend-dot is-sunk" /> Drained / Sunk
              </>
            )}
          </div>
        </div>

        <aside className="hwc-side">
          <div className="hwc-side-top">
            <DoomDial doom={campaign.doom} max={max} />
            <div className="hwc-side-facts">
              <div>
                <strong>{ready}</strong> heroes ready
              </div>
              <div className="hwc-muted">
                Enemies {bonus >= 0 ? "+" : ""}
                {bonus} threat (difficulty, fallen regions, doom)
              </div>
              <div className="hwc-muted">
                {winsLeft > 0 ? `Story mission after ${winsLeft} more win${winsLeft === 1 ? "" : "s"}` : "The story mission is on the map"}
              </div>
              <div className="hwc-muted">Commander: {CHARACTERS[campaign.commanderId]?.name} · {Math.round((campaign.commander?.hpPct ?? 1) * 100)}% HP</div>
            </div>
          </div>

          {standing.length > 0 && (
            <div className="hwc-standing" data-campaign-standing>
              {standing.map((x) => (
                <div key={x.text} className="hwc-standing-row" data-bad={x.bad || undefined}>
                  <span aria-hidden="true">{x.icon}</span> {x.text}
                </div>
              ))}
            </div>
          )}

          {focused && (
            <div className="hwc-mission-card" data-type={focused.type} data-campaign-mission-detail={focused.id}>
              <div className="hwc-mission-head">
                <span className="hwc-mission-icon">{MISSION_TYPES[focused.type].icon}</span>
                <div>
                  <strong>{focused.title}</strong>
                  <div className="hwc-muted">
                    {regionDef(focused.regionId)?.name} · Act {focused.act} · {focused.nodeType}
                  </div>
                </div>
              </div>
              <p className="hwc-mission-line">{focused.line}</p>
              <div className="hwc-mission-facts">
                <span className="hwc-danger" data-tier={dangers[focused.id]?.tier}>
                  Danger: T{dangers[focused.id]?.tier} {dangers[focused.id]?.name}
                </span>
                <span>{focused.expiresDay == null ? "Does not expire" : `Expires in ${focused.expiresDay - campaign.day} day${focused.expiresDay - campaign.day === 1 ? "" : "s"}`}</span>
              </div>
              <RewardChips reward={focused.reward} />
              <div className="hwc-mission-actions">
                <button className="hwc-btn hwc-btn-gold" data-campaign-assemble disabled={ready === 0} onClick={() => onPickMission(focused.id)}>
                  {ready === 0 ? "Nobody is ready" : "Assemble a squad →"}
                </button>
                <button className="hwc-btn hwc-btn-quiet" onClick={() => setFocus(null)}>
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="hwc-section-label">Missions ({missions.length})</div>
          <ul className="hwc-mission-list">
            {missions.map((m) => {
              const left = m.expiresDay != null ? m.expiresDay - campaign.day : null
              return (
                <li key={m.id}>
                  <button className="hwc-mission-row" data-type={m.type} data-focus={focus === m.id || undefined} data-campaign-mission={m.id} onClick={() => setFocus(m.id)}>
                    <span className="hwc-mission-icon">{MISSION_TYPES[m.type].icon}</span>
                    <span className="hwc-mission-row-main">
                      <strong>{m.title}</strong>
                      <span className="hwc-muted">
                        T{dangers[m.id]?.tier} {dangers[m.id]?.name} · {m.reward?.essence ? `+${m.reward.essence}` : ""}
                        {m.reward?.leyShards ? ` · ${m.reward.leyShards}✦` : ""}
                        {m.reward?.recruit ? " · +hero" : ""}
                      </span>
                    </span>
                    <span className="hwc-expiry" data-urgent={left != null && left <= 1 ? true : undefined}>
                      {left == null ? "∞" : `${left}d`}
                    </span>
                  </button>
                </li>
              )
            })}
            {missions.length === 0 && <li className="hwc-muted">No missions right now. Pass a day.</li>}
          </ul>

          {report?.lines?.length > 0 && (
            <div className="hwc-report" data-campaign-day-report>
              <div className="hwc-section-label">Day {report.day}</div>
              {report.lines.slice(-6).map((l, i) => (
                <div key={i} className="hwc-report-line">
                  {l}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
