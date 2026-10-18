// Headquarters ("Päämaja") - the player's camp, the DEFAULT stance at a
// market stop (graphics round 5; Marc: "toimii default stancena").
//
// Purpose: steer the run from one calm screen - the commander, the whole
// squad at full size with every action, relics and bag, your build, the
// road ahead and Continue. The market nearby is one click away.
// Dependencies: pieces + state from SquadDraft.jsx through `kit`.
// Look: heartwood-market-table.css (shared panels) + headquarters-screen.css.
import { RESERVE_CAP, DEPLOY_SLOTS, unitHpPct } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
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
    deployedCount,
    deployedEntries,
    difficultyTier,
    essenceFlash,
    mapSlot,
    nextLabel,
    onContinue,
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
    selectedItemKey,
  } = kit

  return (
    <div className="hwq-root hw-market-stage" aria-label={marketUiText("hq").name} data-equipping={selectedItemKey != null || undefined}>
      {piece_overlays()}
      <header className="hwq-top">
        <UiTitle as="h1" className="hwm-title" k="hq" runeInline />
        <div className="hwm-top-chips">
          <span className="hwm-top-chip" style={{ "--chip": difficultyTier.color }}>
            <CardGlyph name="moonGlyph" className="hw-intent-glyph" />
            {difficultyTier.name}
          </span>
          {nextLabel && <span className="hwm-top-chip">Next: {nextLabel}</span>}
          <span
            className="hwm-top-chip"
            data-state={deployedCount >= DEPLOY_SLOTS && !runState.bench.some((e) => unitHpPct(e) < 1 || e.wounded) ? "ready" : "warn"}
          >
            Squad {deployedCount}/{DEPLOY_SLOTS}
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
          <section className="hwm-panel">
            <UiTitle className="hwm-panel-title" k="hqCommander" />
            {piece_commanderCluster()}
            {showRetrain && piece_retrain()}
          </section>
          <section className="hwm-panel hwm-panel--rails">
            <UiTitle className="hwm-panel-title" k="hqRelics" />
            {renderOwnedRail(["relics", "items"])}
            {(runState.relics || []).length === 0 && (runState.items || []).length === 0 && (
              <p className="hwm-hint">No relics or items yet - find them on the road or buy gear at a market.</p>
            )}
          </section>
          <section className="hwm-panel">
            <UiTitle className="hwm-panel-title" k="hqBuild" />
            {piece_buildScore()}
          </section>
        </aside>
        <main className="hwq-squad" aria-label="Your squad">
          <DevDesk heroDefIds={runState.bench.map((e) => e.defId)} />
          <section className="hwm-panel">
            <UiTitle className="hwm-panel-title" k="hqFight" extra={` ${deployedCount}/${DEPLOY_SLOTS}`} />
            <div className="hwq-cards">{deployedEntries.map((e) => renderBenchCard(e, { place: "camp" }))}</div>
          </section>
          {reserveEntries.length > 0 && (
            <section className="hwm-panel">
              <UiTitle className="hwm-panel-title" k="hqReserve" extra={` ${reserveCount}/${RESERVE_CAP + (runState.benchCapBonus || 0)}`} />
              <div className="hwq-cards">{reserveEntries.map((e) => renderBenchCard(e, { place: "camp" }))}</div>
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
