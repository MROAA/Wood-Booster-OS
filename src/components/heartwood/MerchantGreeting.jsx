import { CardGlyph } from "./cardArt"
import EditInStudioLink from "./EditInStudioLink"
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
  // MERCHANTS (merchant.js) has no `id` field of its own per entry -
  // like crossroads.js, the numeric object KEY is the id, and
  // merchantForAct's own clamp (Math.min(5, Math.max(1, act||1))) is
  // the only place that math lives - mirrored here rather than adding
  // a second export just to expose it, same call this file already
  // makes to get `m` in the first place.
  const merchantId = String(Math.min(5, Math.max(1, act || 1)))

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
        <EditInStudioLink type="merchants" id={merchantId} label="Edit this merchant" />
      </div>
    </div>
  )
}
