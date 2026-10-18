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
import { DEPLOY_SLOTS, RESERVE_CAP, bankInterestFor, unitHpPct } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
import { UNITS } from "../../data/heartwood/units"
import { marketUiText } from "../../data/heartwood/marketUi"
import UiTitle from "./CampTitle"
import { campStatus } from "./campStatus"
import "./heartwood-market-table.css"
import "./headquarters-screen.css"

export default function MarketScreen({ kit }) {
  const {
    chooseMarketView,
    deployedCount,
    deployedEntries,
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
    reserveCount,
    reserveEntries,
    runState,
    setHqOpen,
    tierPreview,
  } = kit

  // The camp at a glance - the same line Headquarters shows.
  const status = campStatus({ deployedEntries, deployedCount, reserveCount, where: "market" })
  // How many of a hero you already own - the market's offers and your
  // camp strip both show it as fusion pips (3 copies fuse into Tier 2).
  const ownedOf = (defId) => runState.bench.filter((e) => e.defId === defId).length
  const fusePips = (n) => (
    <span className="hwq-fuse" data-count={n} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i key={i} data-on={i < n || undefined} />
      ))}
    </span>
  )
  const hasBelongings = (runState.relics || []).length > 0 || (runState.items || []).length > 0
  // one small tile per owned hero: portrait, name, hurt ring, copies
  const campTile = (e) => {
    const def = UNITS[e.defId]
    const copies = def?.displayTier !== 2 ? ownedOf(e.defId) : 0
    const hurt = unitHpPct(e) < 1 || e.wounded
    return (
      <button
        type="button"
        key={e.key}
        className="hwm-camp-tile"
        data-hurt={hurt || undefined}
        onClick={() => setHqOpen(true)}
        title={`${def?.name}${hurt ? ` - hurt (${Math.round(unitHpPct(e) * 100)}% health)` : ""}${copies > 1 ? ` - you own ${copies} of 3 for a fusion` : ""} · manage in Headquarters`}
      >
        <span className="hwm-camp-portrait">
          {def?.image ? <img src={def.image} alt="" /> : <CardGlyph name={def?.art} className="hwm-camp-glyph" />}
        </span>
        <span className="hwm-camp-name">{def?.name}</span>
        {copies > 1 && fusePips(copies)}
      </button>
    )
  }
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
          {nextLabel && (
            <span className="hwm-top-chip" title="What you'll face right after this shop visit">
              Next: {nextLabel}
            </span>
          )}
        </div>
        <div className="hwq-status" data-state={status.state} role="status" title={status.text}>
          <span className="hwq-status-rune" aria-hidden="true">{status.rune}</span>
          <span className="hwq-status-text">{status.short}</span>
          <span className="hwq-status-squad">
            Squad <b>{deployedCount}/{DEPLOY_SLOTS}</b>
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
                  {/* already in your camp: the same fusion pips as Headquarters */}
                  {offers[i] && offers[i].displayTier !== 2 && ownedOf(offers[i].id) > 0 && (
                    <span
                      className="hwm-offer-owned"
                      data-fuses={ownedOf(offers[i].id) >= 2 || undefined}
                      title={`You own ${ownedOf(offers[i].id)} - 3 copies fuse into a stronger Tier 2 hero`}
                    >
                      {fusePips(ownedOf(offers[i].id))}
                      <span>Own {ownedOf(offers[i].id)}</span>
                    </span>
                  )}
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

          {/* Your camp, in view while you buy: who fights, who rests, who
              is hurt, what is close to a fusion. A tile opens Headquarters. */}
          <section className="hwm-camp" aria-label="Your camp">
            <UiTitle className="hwm-panel-title" k="squad" extra={` ${deployedCount}/${DEPLOY_SLOTS}`} />
            <div className="hwm-camp-row">
              {deployedEntries.map(campTile)}
              {Array.from({ length: Math.max(0, DEPLOY_SLOTS - deployedCount) }, (_, i) => (
                <span key={`empty-${i}`} className="hwm-camp-tile hwm-camp-tile--empty" aria-label="An empty place in the fight">
                  <span className="hwm-camp-portrait">ᛗ</span>
                </span>
              ))}
              <span className="hwm-camp-divider" aria-hidden="true" />
              <span className="hwm-camp-label" title={`Reserve ${reserveCount}/${RESERVE_CAP + (runState.benchCapBonus || 0)}`}>
                Reserve {reserveCount}/{RESERVE_CAP + (runState.benchCapBonus || 0)}
              </span>
              {reserveEntries.map(campTile)}
            </div>
          </section>
        </main>

        <aside className="hwm-side hwm-side--right" aria-label="Run map">
          <section className="hwm-panel hwm-merchant">
            <UiTitle className="hwm-panel-title" k="merchant" />
            {renderCenterSections(["greeting"])}
          </section>
          {/* what you carry - next to the gear for sale, where recipes and
              set pieces are decided */}
          <section className="hwm-panel hwm-panel--rails hwm-bag">
            <UiTitle className="hwm-panel-title" k="hqRelics" />
            {hasBelongings ? (
              renderOwnedRail(["relics", "items"])
            ) : (
              <div className="hwq-sockets" title="Relics are found on the road; gear is bought here">
                <div className="hwq-socket-row">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="hwq-socket" aria-hidden="true">ᛟ</span>
                  ))}
                </div>
                <p className="hwq-sockets-hint">Found on the road · bought here</p>
              </div>
            )}
          </section>
          <div className="hwm-side-spacer" aria-hidden="true" />
          <section className="hwm-panel hwm-way">
            <UiTitle className="hwm-panel-title" k="road" />
            <span className="hwm-top-chip hwm-way-act" style={{ "--chip": difficultyTier.color }} title="How far into the run you are">
              <CardGlyph name="moonGlyph" className="hw-intent-glyph" />
              {difficultyTier.name}
            </span>
            {nextLabel && (
              <p className="hwm-hint">
                Next: <b>{nextLabel}</b>
              </p>
            )}
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
