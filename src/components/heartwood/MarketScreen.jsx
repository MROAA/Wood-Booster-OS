// The Market - the place your camp arrives at to trade (graphics round 5).
//
// Purpose: buy heroes and gear, roll the offers, invest in the Ledger,
// with the squad strip in view. Headquarters (HeadquartersScreen.jsx) is
// the default stance at a market stop; you come here from there.
// Dependencies: every piece it draws comes from SquadDraft.jsx through
// `kit` (the same pieces the classic layout uses), so buying, selling
// and equipping behave exactly as before. Look: heartwood-market-table.css.
import { UNITS } from "../../data/heartwood/units"
import { RESERVE_CAP, DEPLOY_SLOTS, bankInterestFor, unitHpPct } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
import { marketUiText } from "../../data/heartwood/marketUi"
import UiTitle from "./CampTitle"
import "./heartwood-market-table.css"

export default function MarketScreen({ kit }) {
  const {
    chooseMarketView,
    deployedCount,
    deployedEntries,
    difficultyTier,
    essenceFlash,
    inspectKey,
    itemOffers,
    justPurchasedKey,
    marketVisit,
    nextLabel,
    offers,
    onContinue,
    piece_antidoteBtn,
    piece_freezeBtn,
    piece_gambleBtn,
    piece_gambleReveal,
    piece_gearShopbar,
    piece_marketLevelWidget,
    piece_marketTierWidget,
    piece_overlays,
    piece_rerollBtn,
    renderBenchCard,
    renderCenterSections,
    renderItemOffer,
    renderOwnedRail,
    renderRecruitCard,
    reserveCount,
    reserveEntries,
    runState,
    selectedItemKey,
    setHqOpen,
    setInspectKey,
    tierPreview,
  } = kit

// Market pieces, shared by the classic layout below and the new
// Market table (renderMarketTable). Each returns exactly what the
// classic layout used to inline at that spot.
// ===== The Market table (graphics round 4) =====
// One screen, three zones, nothing hidden behind tabs:
//   top    - title, merchant line, run chips, Essence
//   left   - every upgrade (Market, Tier, Commander, Ledger, relics, bag)
//   centre - the merchant's table: heroes for sale + their actions,
//            then gear for sale
//   right  - the run map and the Continue plaque
//   bottom - the whole squad as a compact strip; click a hero to open
//            its full card with Upgrade / Mend / Reforge / Sell / Gear
// Every piece is the same one the classic layout renders (piece_*,
// renderRecruitCard, renderBenchCard...), so all buying, selling and
// equipping behaves exactly as before - only the arrangement changed.
function renderSquadChip(entry, deployed) {
  const def = UNITS[entry.defId]
  if (!def) return null
  const hp = Math.round(unitHpPct(entry) * 100)
  const lv = (entry.upgrades || []).length
  const equipped = runState.items.filter((it) => it.equippedTo === entry.key).length
  return (
    <button
      key={entry.key}
      type="button"
      className="hwm-chip"
      data-deployed={deployed || undefined}
      data-open={inspectKey === entry.key || undefined}
      data-tier2={def.displayTier === 2 || undefined}
      data-hurt={hp < 100 || entry.wounded || undefined}
      data-equip-ready={selectedItemKey !== null || undefined}
      data-landed={justPurchasedKey === entry.key || undefined}
      data-role={def.role}
      onClick={() => setInspectKey((cur) => (cur === entry.key ? null : entry.key))}
      title={`${def.name} - click for upgrades, gear, mend and sell`}
    >
      <span className="hwm-chip-art">
        {def.image ? <img src={def.image} alt="" /> : <CardGlyph name={def.art} className="hwm-chip-glyph" />}
      </span>
      <span className="hwm-chip-text">
        <span className="hwm-chip-name">{def.name}</span>
        <span className="hwm-chip-meta">
          {def.role}
          {lv > 0 && <b> · Lv {lv}</b>}
          {equipped > 0 && <span> · {equipped}⚙</span>}
          {entry.wounded && <span className="hwm-chip-wound"> · Wounded</span>}
        </span>
        <span className="hwm-chip-hp" aria-hidden="true">
          <span style={{ width: `${hp}%` }} />
        </span>
      </span>
    </button>
  )
}

  const inspected = inspectKey != null ? runState.bench.find((e) => e.key === inspectKey) : null
  // HQ status board: is the squad ready to set out?
  const hurtCount = runState.bench.filter((e) => unitHpPct(e) < 1 || e.wounded).length
  const squadReady = deployedCount >= DEPLOY_SLOTS && hurtCount === 0
  const reserveCap = RESERVE_CAP + (runState.benchCapBonus || 0)
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
            <button type="button" className="hwm-way-map" onClick={() => setHqOpen(true)}>
              See the map at {marketUiText("hq").name}
            </button>
          </section>
          <div className="hwm-launch">
            <button className="hw-end-turn hw-shop-confirm-btn hwm-continue" onClick={onContinue}>
              Continue
            </button>
            {nextLabel && <span className="hwm-launch-next">Next: {nextLabel}</span>}
          </div>
          <button type="button" className="hwm-classic-link" onClick={() => chooseMarketView("classic")} title="Switch to the previous tabbed Market layout">
            Classic layout
          </button>
        </aside>
      </div>

      <footer className="hwm-squad" aria-label="Your squad">
        <div className="hwm-squad-label">
          <UiTitle as="b" k="squad" />
          <span>
            In the fight {deployedCount}/{DEPLOY_SLOTS} · Reserve {reserveCount}/{reserveCap}
          </span>
        </div>
        <div className="hwm-squad-row">
          {deployedEntries.map((e) => renderSquadChip(e, true))}
          {Array.from({ length: Math.max(0, DEPLOY_SLOTS - deployedEntries.length) }, (_, i) => (
            <span key={`empty${i}`} className="hwm-chip hwm-chip--empty">
              Empty slot
            </span>
          ))}
          {reserveEntries.length > 0 && <span className="hwm-squad-divider" aria-hidden="true" />}
          {reserveEntries.map((e) => renderSquadChip(e, false))}
        </div>
        {inspected && (
          <div className="hwm-inspector" role="dialog" aria-label={`${UNITS[inspected.defId]?.name} details`}>
            <button type="button" className="hwm-inspector-close" onClick={() => setInspectKey(null)} aria-label="Close">
              ×
            </button>
            {renderBenchCard(inspected)}
          </div>
        )}
      </footer>
    </div>
  )
}
