// The Market - a place your camp arrives at to TRADE, nothing else
// (Marc: "erota kauppa ja käyttöliittymä toisistaan ja tee niistä
// erilliset asiat").
//
// Purpose: heroes and gear for sale, Reroll / Freeze / Gamble /
// Antidote, Market level + Tier, the Ledger, the merchant. Your squad,
// gear, upgrades and setting out all live in Headquarters
// (HeadquartersScreen.jsx), one click back.
// Dependencies: the shared pieces from SquadDraft.jsx via `kit`, so
// buying behaves exactly as before. Look: heartwood-market-table.css.
import { DEPLOY_SLOTS, bankInterestFor, unitHpPct } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
import { marketUiText } from "../../data/heartwood/marketUi"
import UiTitle from "./CampTitle"
import "./heartwood-market-table.css"

export default function MarketScreen({ kit }) {
  const {
    chooseMarketView,
    deployedCount,
    difficultyTier,
    essenceFlash,
    itemOffers,
    marketVisit,
    nextLabel,
    offers,
    piece_antidoteBtn,
    piece_freezeBtn,
    piece_gambleBtn,
    piece_gambleReveal,
    piece_gearShopbar,
    piece_marketLevelWidget,
    piece_marketTierWidget,
    piece_overlays,
    piece_rerollBtn,
    renderCenterSections,
    renderItemOffer,
    renderOwnedRail,
    renderRecruitCard,
    runState,
    setHqOpen,
    tierPreview,
  } = kit

  // HQ status board: is the squad ready to set out?
  const hurtCount = runState.bench.filter((e) => unitHpPct(e) < 1 || e.wounded).length
  const squadReady = deployedCount >= DEPLOY_SLOTS && hurtCount === 0
  return (
    <div className="hwm-root hw-market-stage">
      <div className="hwm-hearth" aria-hidden="true" />
      {piece_overlays()}
      <div className="hwm-arrival" aria-hidden="true" key={`arrive-${marketVisit}`}>
        <span className="hwm-arrival-rune">{marketUiText("arrival").rune}</span>
        <span className="hwm-arrival-text">{marketUiText("arrival").name}</span>
        <span className="hwm-arrival-sub">{marketUiText("arrival").subtitle}</span>
      </div>


      <header className="hwm-top">
        <div className="hwm-title-block">
          <UiTitle as="h1" className="hwm-title" k="screen" plain />
        </div>
        <div className="hwm-top-chips">
          <span className="hwm-top-chip" style={{ "--chip": difficultyTier.color }} title="How far into the run you are">
            <CardGlyph name="moonGlyph" className="hw-intent-glyph" />
            {difficultyTier.name}
          </span>
          {nextLabel && (
            <span className="hwm-top-chip" title="What you'll face right after this shop visit">
              Next: {nextLabel}
            </span>
          )}
          <span
            className="hwm-top-chip"
            data-state={squadReady ? "ready" : "warn"}
            title={`${deployedCount} of ${DEPLOY_SLOTS} fighting slots filled${hurtCount ? ` · ${hurtCount} hurt or wounded (Mend them from their card)` : ""}`}
          >
            Squad {deployedCount}/{DEPLOY_SLOTS}
            {hurtCount > 0 && <b> · {hurtCount} hurt</b>}
          </span>
        </div>
        <button type="button" className="hwm-hq-btn" onClick={() => setHqOpen(true)} title="Back to your camp: commander, the whole squad, relics and the road ahead">
          ← <span className="hwm-hq-btn-rune" aria-hidden="true">{marketUiText("hq").rune}</span>
          {marketUiText("hq").name}
        </button>
        <div className="hwm-essence">
          <span className="hw-essence-display" data-flash={essenceFlash || undefined} title="Essence">
            <span className="hw-essence-orb">
              <CardGlyph name="spark" className="hw-essence-orb-glyph" />
            </span>
            <span className="hw-essence-value">{runState.essence}</span>
          </span>
          {bankInterestFor(runState) > 0 && (
            <span className="hw-essence-interest" title="Interest - Essence you keep grows a little with every victory.">
              ▲ +{bankInterestFor(runState)}
            </span>
          )}
        </div>
      </header>

      <div className="hwm-main" key={`visit-${marketVisit}`}>
        <aside className="hwm-side hwm-side--left" aria-label="Upgrades">
          <section className="hwm-panel">
            <UiTitle className="hwm-panel-title" k="market" />
            {piece_marketLevelWidget()}
            {piece_marketTierWidget()}
            {tierPreview && (
              <p className="hwm-hint">
                Next tier: <b>{tierPreview.name}</b> — {tierPreview.unlocks[0]}
              </p>
            )}
          </section>
          <section className="hwm-panel hwm-panel--rails">
            <UiTitle className="hwm-panel-title" k="ledger" />
            {renderOwnedRail(["ledger", "buyback"])}</section>
        </aside>

        <main className="hwm-center">
          <div className="hwm-notices">{renderCenterSections(["tutorialHint", "evolutionNotice", "equipPrompt", "marketEventBanner"])}</div>

          <section className="hwm-table" data-frozen={!!runState.frozen || undefined}>
            <div className="hwm-table-head">
              <UiTitle className="hwm-table-title" k="heroes" />
              <div className="hwm-actions">
                {piece_rerollBtn()}
                {piece_freezeBtn()}
                {piece_gambleBtn()}
                {piece_antidoteBtn()}
              </div>
            </div>
            <div className="hwm-offers">
              {[0, 1, 2].map((i) => (
                // keyed by the hero on offer (not the slot): a reroll deals
                // fresh cards, while buying one leaves the others resting
                // on the table instead of re-dealing them
                <div key={offers[i] ? `hero-${offers[i].id}-${offers.slice(0, i).filter((o) => o?.id === offers[i].id).length}` : `sold-${i}`} className="hwm-offer-slot" style={{ "--deal-i": i }}>
                  {offers[i] ? renderRecruitCard(offers[i]) : <div className="hwm-offer-empty">Sold</div>}
                </div>
              ))}
            </div>
            {piece_gambleReveal()}
          </section>

          <section className="hwm-table hwm-table--gear">
            <div className="hwm-table-head">
              <UiTitle className="hwm-table-title" k="gear" />
              {piece_gearShopbar()}
            </div>
            <div className="hwm-gear-offers">
              {[0, 1, 2].map((i) => (
                <div key={itemOffers[i] ? `gear-${itemOffers[i].id}-${itemOffers.slice(0, i).filter((o) => o?.id === itemOffers[i].id).length}` : `sold-${i}`} className="hwm-gear-slot" style={{ "--deal-i": i + 3 }}>
                  {renderItemOffer(i)}
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="hwm-side hwm-side--right" aria-label="Run map">
          <section className="hwm-panel hwm-merchant">
            <UiTitle className="hwm-panel-title" k="merchant" />
            {renderCenterSections(["greeting"])}
          </section>
          <div className="hwm-side-spacer" aria-hidden="true" />
          <section className="hwm-panel hwm-way">
            <UiTitle className="hwm-panel-title" k="road" />
            <p className="hwm-hint">
              {nextLabel ? (
                <>
                  Next: <b>{nextLabel}</b>
                </>
              ) : (
                "The road continues deeper into the Hearthwood."
              )}
            </p>
            <button type="button" className="hwq-visit hwm-home" onClick={() => setHqOpen(true)}>
              <span className="hwq-visit-name">← {marketUiText("hq").name}</span>
              <span className="hwq-visit-sub">Your squad, the map, and setting out</span>
            </button>
          </section>
          <button type="button" className="hwm-classic-link" onClick={() => chooseMarketView("classic")} title="Switch to the previous tabbed Market layout">
            Classic layout
          </button>
        </aside>
      </div>

    </div>
  )
}
