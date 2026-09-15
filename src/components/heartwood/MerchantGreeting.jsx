import { CardGlyph } from "./cardArt"
import { merchantForAct, merchantLine } from "../../data/heartwood/merchant"
import { actIndexForNode, RUN_PATH } from "../../services/heartwood/runEngine"

// The traveling merchant's greeting, shown at the top of the shop
// screen (SquadDraft.jsx). merchant.js picks the persona by Act and the
// line by Act x forestState x dominant tribe, deterministic in
// nodeIndex. Quiet and minimalist - a portrait, a name, one line - not
// a full-screen cinematic (the shop is entered 40+ times a run).
//
// key={name-nodeIndex} on the wrapper replays hw-section-fade-in every
// time the Act changes or the player reaches the next shop, the same
// "state changed, so re-animate" idiom SquadDraft already uses for the
// difficulty-tier badge.
export default function MerchantGreeting({ runState }) {
  if (!runState) return null
  const act = actIndexForNode(runState.nodeIndex || 0, RUN_PATH.length)
  const m = merchantForAct(act)
  const line = merchantLine(runState)

  return (
    <div
      className="hw-merchant hw-section-fade-in"
      key={`${m.name}-${runState.nodeIndex}`}
      style={{ "--hw-merchant-accent": m.accent }}
      data-act={act}
    >
      <CardGlyph name={m.glyph} className="hw-merchant-portrait" style={{ color: m.accent }} />
      <div className="hw-merchant-body">
        <span className="hw-merchant-name">{m.name}</span>
        <span className="hw-merchant-line">{line}</span>
      </div>
    </div>
  )
}
