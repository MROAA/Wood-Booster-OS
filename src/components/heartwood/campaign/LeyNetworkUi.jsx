// Hearthwood - the ley network on the campaign map (mana sprint 3):
// coloured ley LINES drawn between regions (glowing when part of your
// network, faint when an end isn't held, broken + dashed when cut) and a
// side panel with the network's size, strength and fight bonuses.
// Engine: services/heartwood/campaignLey.js.
import { regionDef, LEY } from "../../../data/heartwood/campaign"
import { MANA_COLOURS } from "../../../data/heartwood/manaColours"
import { leyNetwork, lineName, drainSurgeOn } from "../../../services/heartwood/campaignLey"
import { regionLive } from "../../../services/heartwood/campaignEngine"
import "./ley-network.css"

// <g> for inside the world-map <svg> (drawn under the regions).
export function LeyLines({ campaign }) {
  const net = leyNetwork(campaign, regionLive)
  return (
    <g className="hwc-ley-lines" data-campaign-ley-lines={net.size}>
      {net.lines.map((l) => {
        const a = regionDef(l.a)
        const b = regionDef(l.b)
        const state = l.cut ? "cut" : l.connected ? "connected" : l.live ? "live" : "dormant"
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        return (
          <g key={l.id} className="hwc-ley-line" data-ley-line={l.id} data-state={state} data-colour={l.colour} data-warded={l.warded || undefined} style={{ "--ley": MANA_COLOURS[l.colour]?.color }}>
            <title>
              {`${lineName(l)} ley line (${MANA_COLOURS[l.colour]?.name}) - ${
                l.cut ? "CUT. A Ley Site win next to it can mend it." : l.connected ? `in your network${l.warded ? " (Warded: counts double, can't be breached)" : ""}.` : l.live ? "held, but not linked to the Hearthstead." : "an end isn't held (fallen, sunk or not reached)."
              }`}
            </title>
            {l.cut ? (
              <>
                <line x1={a.x} y1={a.y} x2={mx - (b.x - a.x) * 0.06} y2={my - (b.y - a.y) * 0.06} className="hwc-ley-stroke" />
                <line x1={mx + (b.x - a.x) * 0.06} y1={my + (b.y - a.y) * 0.06} x2={b.x} y2={b.y} className="hwc-ley-stroke" />
                <text x={mx} y={my + 1.2} className="hwc-ley-break">
                  ✕
                </text>
              </>
            ) : (
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="hwc-ley-stroke" />
            )}
          </g>
        )
      })}
    </g>
  )
}

// Side panel: size, strength, the bonus every fight gets, line colours.
export function LeyNetworkPanel({ campaign }) {
  const net = leyNetwork(campaign, regionLive)
  const cut = net.lines.filter((l) => l.cut)
  const surge = drainSurgeOn(campaign)
  return (
    <div className="hwc-ley-panel" data-campaign-ley-panel data-size={net.size} data-strength={net.strength}>
      <div className="hwc-ley-head">
        <span className="hwc-section-label">✦ Ley network</span>
        <span className="hwc-ley-size">
          {net.size} line{net.size === 1 ? "" : "s"} · strength {net.strength}
        </span>
      </div>
      {net.size > 0 ? (
        <div className="hwc-ley-bonus" title={`Hold the regions at both ends of a line (not fallen) and keep it linked to the Hearthstead. +${LEY.startPerStrength} start mana per strength (max ${LEY.startMax}), +1 regen per ${LEY.regenEvery} strength (max ${LEY.regenMax}).`}>
          Every fight: <b>+{net.startMana}</b> start mana · <b>+{net.regen}</b> regen a turn
          {net.colours.length > 0 && (
            <span className="hwc-ley-colours">
              {" "}
              · cheaper:{" "}
              {net.colours.map((c) => (
                <span key={c} className="hwc-ley-colour" data-colour={c} style={{ "--ley": MANA_COLOURS[c].color }} title={`${MANA_COLOURS[c].name} skills cost 15% less`}>
                  {MANA_COLOURS[c].icon}
                </span>
              ))}
            </span>
          )}
        </div>
      ) : (
        <div className="hwc-muted">No lines linked to the Hearthstead - your fights get no ley bonus. Retake fallen regions or mend cut lines.</div>
      )}
      {surge && <div className="hwc-ley-note" data-ley-surge>🥀 Drained ley SURGES (+{LEY.drainSurge} strength) - then the drained lines wither.</div>}
      {cut.length > 0 && (
        <div className="hwc-ley-note" data-ley-cut={cut.map((l) => l.id).join(" ")}>
          ✕ Cut: {cut.map((l) => lineName(l)).join(", ")}
        </div>
      )}
      <div className="hwc-muted hwc-ley-tip">⚡ Ley Breach missions try to cut a line - win before they expire.</div>
    </div>
  )
}
