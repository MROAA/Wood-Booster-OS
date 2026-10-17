// Headquarters ("Päämaja") - the player's camp, the DEFAULT stance at a
// market stop (graphics round 5; Marc: "toimii default stancena").
//
// Purpose: steer the run from one calm screen - the commander, the whole
// squad at full size with every action, relics and bag, your build, the
// road ahead and Continue. The market nearby is one click away.
// Dependencies: pieces + state from SquadDraft.jsx through `kit`.
// Look: heartwood-market-table.css (shared panels) + headquarters-screen.css.
import { RESERVE_CAP, DEPLOY_SLOTS, unitHpPct, assignToSlot } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
import { UNITS } from "../../data/heartwood/units"
import { marketUiText } from "../../data/heartwood/marketUi"
import UiTitle from "./CampTitle"
import DevDesk from "./DevDesk"
import "./heartwood-market-table.css"
import "./headquarters-screen.css"

// `onClose` set = opened between fights (from the page's Headquarters
// button): no market here, and the Continue spot becomes "Back to the road"
// - the same place, the same look, so where to go next is always obvious.
export default function HeadquartersScreen({ kit, onClose = null }) {
  const {
    commander,
    commanderRank,
    deployedCount,
    deployedEntries,
    difficultyTier,
    essenceFlash,
    mapSlot,
    nextLabel,
    onContinue,
    onRunAction,
    piece_buildScore,
    piece_commanderCluster,
    piece_overlays,
    piece_retrain,
    renderBenchCard,
    renderCenterSections,
    renderOwnedRail,
    reserveCount,
    reserveEntries,
    runState,
    showRetrain,
    visitMarket,
  } = kit

  // Places in the fight that stand empty: the war table shows them, and
  // a reserve hero can step into the first one right here (the same
  // assignToSlot the Formation screen uses).
  const firstEmptySlot = (rs) => Array.from({ length: DEPLOY_SLOTS }, (_, i) => i).find((i) => rs.deployed[i] == null) ?? -1
  const emptyCount = Math.max(0, DEPLOY_SLOTS - deployedCount)
  const joinFor = (entry) =>
    onRunAction && firstEmptySlot(runState) >= 0
      ? () => onRunAction((rs) => (firstEmptySlot(rs) >= 0 ? assignToSlot(rs, firstEmptySlot(rs), entry.key) : rs))
      : null
  // The camp at a glance: the one thing to know before setting out -
  // an empty place in the fight, who is hurt, or that all is ready.
  const hurt = deployedEntries.filter((e) => unitHpPct(e) < 1 || e.wounded)
  const hurtNames = hurt.map((e) => UNITS[e.defId]?.name).filter(Boolean)
  const status =
    deployedCount < DEPLOY_SLOTS
      ? {
            state: "warn",
            text: `${emptyCount === 1 ? "A place" : `${emptyCount} places`} in the fight ${emptyCount === 1 ? "stands" : "stand"} empty${reserveEntries.length > 0 ? " - call a hero from the reserve" : ""}`,
          }
      : hurtNames.length > 0
        ? {
            state: "hurt",
            text: `${hurtNames.length === 1 ? `${hurtNames[0]} is` : hurtNames.length === 2 ? `${hurtNames[0]} and ${hurtNames[1]} are` : `${hurtNames.length} heroes are`} hurt - mend at the workbench`,
          }
        : { state: "ready", text: "The camp is ready to set out" }
  const hasBelongings = (runState.relics || []).length > 0 || (runState.items || []).length > 0

  return (
    <div className="hwq-root hw-market-stage" aria-label={marketUiText("hq").name}>
      {piece_overlays()}
      <header className="hwq-top">
        <UiTitle as="h1" className="hwm-title" k="hq" runeInline />
        <div className="hwm-top-chips">
          <span className="hwm-top-chip" style={{ "--chip": difficultyTier.color }}>
            <CardGlyph name="moonGlyph" className="hw-intent-glyph" />
            {difficultyTier.name}
          </span>
          {nextLabel && <span className="hwm-top-chip">Next: {nextLabel}</span>}
        </div>
        <div className="hwq-status" data-state={status.state} role="status">
          <span className="hwq-status-rune" aria-hidden="true">{status.state === "ready" ? "ᛞ" : status.state === "hurt" ? "ᚢ" : "ᛗ"}</span>
          <span className="hwq-status-text">{status.text}</span>
          <span className="hwq-status-squad">
            Squad <b>{deployedCount}/{DEPLOY_SLOTS}</b>
          </span>
        </div>
        <div className="hwm-essence">
          <span className="hw-essence-display" data-flash={essenceFlash || undefined} title="Essence">
            <span className="hw-essence-orb">
              <CardGlyph name="spark" className="hw-essence-orb-glyph" />
            </span>
            <span className="hw-essence-value">{runState.essence}</span>
          </span>
        </div>
      </header>
      <div className="hwq-main">
        <aside className="hwm-side" aria-label="Commander and belongings">
          <section className="hwm-panel hwq-commander">
            <UiTitle className="hwm-panel-title" k="hqCommander" />
            {/* the commander's crest - who leads this camp, before what they can do */}
            {commander && (
              <div className="hwq-crest" title={commander.description}>
                <span className="hwq-crest-medallion">
                  <CardGlyph name={commander.art} className="hwq-crest-glyph" />
                </span>
                <span className="hwq-crest-text">
                  <span className="hwq-crest-name">{commander.name}</span>
                  <span className="hwq-crest-rank">Rank {commanderRank}</span>
                  {commander.tagline && <span className="hwq-crest-tagline">{commander.tagline}</span>}
                </span>
              </div>
            )}
            {piece_commanderCluster()}
            {showRetrain && piece_retrain()}
          </section>
          <section className="hwm-panel hwm-panel--rails">
            <UiTitle className="hwm-panel-title" k="hqRelics" />
            {hasBelongings ? (
              renderOwnedRail(["relics", "items"])
            ) : (
              /* empty sockets waiting to be filled - the place shows what it is for */
              <div className="hwq-sockets" title="Relics are found on the road; gear is bought at a market">
                <div className="hwq-socket-row">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="hwq-socket" aria-hidden="true">ᛟ</span>
                  ))}
                </div>
                <p className="hwq-sockets-hint">Found on the road · bought at a market</p>
              </div>
            )}
          </section>
          <section className="hwm-panel">
            <UiTitle className="hwm-panel-title" k="hqBuild" />
            {piece_buildScore()}
          </section>
        </aside>
        <main className="hwq-squad" aria-label="Your squad">
          <DevDesk heroDefIds={runState.bench.map((e) => e.defId)} />
          <section className="hwm-panel hwq-table">
            <UiTitle className="hwm-panel-title" k="hqFight" extra={` ${deployedCount}/${DEPLOY_SLOTS}`} />
            <div className="hwq-cards">
              {deployedEntries.map((e) => renderBenchCard(e, { tray: true }))}
              {Array.from({ length: emptyCount }, (_, i) => (
                <div key={`empty-${i}`} className="hwq-empty-place">
                  <span className="hwq-empty-rune" aria-hidden="true">ᛗ</span>
                  <span className="hwq-empty-name">An empty place</span>
                  <span className="hwq-empty-hint">{reserveEntries.length > 0 ? "Call a hero from the reserve below" : "Recruit a hero at the market"}</span>
                </div>
              ))}
            </div>
          </section>
          {reserveEntries.length > 0 && (
            <section className="hwm-panel hwq-reserve">
              <UiTitle className="hwm-panel-title" k="hqReserve" extra={` ${reserveCount}/${RESERVE_CAP + (runState.benchCapBonus || 0)}`} />
              <div className="hwq-cards">{reserveEntries.map((e) => renderBenchCard(e, { tray: true, onJoin: joinFor(e) }))}</div>
            </section>
          )}
        </main>
        <aside className="hwm-side" aria-label="The market and the road ahead">
          {!onClose && (
            <section className="hwm-panel hwq-market-entry">
              <UiTitle className="hwm-panel-title" k="hqMarket" />
              {renderCenterSections(["greeting"])}
              <button type="button" className="hwq-visit" onClick={visitMarket}>
                <span className="hwq-visit-name">{marketUiText("visitMarket").name} →</span>
                {marketUiText("visitMarket").subtitle && <span className="hwq-visit-sub">{marketUiText("visitMarket").subtitle}</span>}
              </button>
            </section>
          )}
          <section className="hwm-panel hwq-road">
            <UiTitle className="hwm-panel-title" k="hqRoad" />
            <div className="hwm-map">{mapSlot}</div>
          </section>
          {onClose ? (
            <button type="button" className="hwq-visit hwq-return" onClick={onClose}>
              <span className="hwq-visit-name">← {marketUiText("backToRoad").name}</span>
              {marketUiText("backToRoad").subtitle && <span className="hwq-visit-sub">{marketUiText("backToRoad").subtitle}</span>}
            </button>
          ) : (
            <div className="hwm-launch">
              <button className="hw-end-turn hw-shop-confirm-btn hwm-continue" onClick={onContinue}>
                Continue
              </button>
              {nextLabel && <span className="hwm-launch-next">Next: {nextLabel}</span>}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
