import { TRIBES, synergyTiersSummary } from "../../data/heartwood/synergies"
import { CardGlyph } from "./cardArt"
import { useFreeLayout } from "./useFreeLayout.jsx"

// The Guild Hall (Marc's PRD v2.0, Phase 4, sections 5-6/39-41): the
// player's first real "place" in Hearthwood, not just a screen. Sits
// between CommanderSelect and the very first shop visit - a one-time
// arrival beat for THIS run, armed by HeartwoodBattle.jsx's own
// showGuildHall state (see that file's comment for why it's a local
// presentation flag, same shape as the existing showMapAfterShop
// interstitial, rather than a new runEngine.js phase). Nothing here
// reads or writes runState beyond the Commander's own static data -
// this screen exists entirely in the moment BEFORE the run's first
// shop roll matters to the player.
//
// Scope deliberately kept small on this pass, per Marc's direct
// steer: an earlier draft of this screen had 4 clickable "doors"
// (Training Grounds/Library/Forge/Forest Gate), 3 of them inert
// "not yet open" placeholders. Marc's own standing rule - "yksinker-
// tainen mutta selkeä" (simple but clear) - and his read on it
// directly: inert doors read as unfinished promises, which is the
// opposite of that rule. Cut down to exactly what this pass can back
// for real: the arrival scene, a synergy REFERENCE legend (not a live
// tracker - the squad is genuinely empty here, so this teaches "what
// to build toward" using the exact same TRIBES/synergyTiersSummary
// data UnitCard.jsx already surfaces elsewhere, rather than faking
// activity that hasn't happened yet), and one single, unambiguous CTA
// forward. Chronicle/Forge/Training-Grounds doors come back in a later
// pass once each has a real system behind it.
//
// Proportions follow CommanderSelect.jsx's own precedent exactly: the
// existing --hw-fib-* custom properties (heartwood.css, defined once on
// .hw-root) rather than new hardcoded numbers.

// Every recruitable tribe, in a fixed, deliberate order (Warden - Fang
// - Root - Grove - Spirit - Thorn) matching TRIBES' own declaration
// order in synergies.js, so this reference reads the same way every
// single visit rather than reshuffling with object-key iteration order
// quirks.
// 6 mechanical tribes, then the elemental tribes (parallel second axis).
const TRIBE_ORDER = [
  "warden", "fang", "root", "grove", "spirit", "thorn",
  "tide", "gale", "stone", "shadow", "wood", "ember", "cosmic",
]

export default function GuildHallScreen({ character, pendingMemory, bannerSrc, bannerAlt, onEnterMarket }) {
  // Free Layout foundation (Stage A, PR 2) - see useFreeLayout.jsx and
  // SettingsScreen.jsx's own pilot wiring for the full mechanism. The
  // CTA button is wrapped in its own div below purely so it has a
  // section to belong to - renderSection needs one element to attach
  // its ref/positioning to, and a bare <button> can't hold that AND
  // the hw-free-layout-drag-handle's own absolute-positioned corner.
  const layout = useFreeLayout({
    screenId: "guildHall",
    keys: ["header", "commanderStrip", "section", "cta"],
  })

  return (
    <div className="hw-guildhall">
      {import.meta.env.DEV && (
        <div className="hw-free-layout-toolbar">
          {!layout.editingLayout ? (
            <button className="hw-move-btn" onClick={layout.startEditing} disabled={layout.loading}>
              Edit Layout
            </button>
          ) : (
            <>
              <button className="hw-move-btn" onClick={layout.saveLayout} disabled={layout.saving}>
                Save Layout
              </button>
              <button className="hw-move-btn" onClick={layout.cancelEditing} disabled={layout.saving}>
                Cancel
              </button>
            </>
          )}
          <button className="hw-move-btn" onClick={layout.resetLayout} disabled={layout.saving}>
            Reset Layout
          </button>
          {layout.errorMessage && <span className="hw-free-layout-error">{layout.errorMessage}</span>}
        </div>
      )}
      <div
        ref={layout.containerRef}
        className="hw-free-layout-container"
        style={layout.containerStyle}
        data-free-active={layout.freeActive || undefined}
        data-editing-layout={layout.editingLayout || undefined}
      >
        {layout.renderSection(
          "header",
          <div className="hw-guildhall-header">
            <div className="hw-crew-banner">
              <img src={bannerSrc} alt={bannerAlt} />
            </div>
            <h1 className="hw-guildhall-title">The Guild Hall</h1>
            <p className="hw-flavor">
              {character?.name || "Your Commander"} has arrived at the edge of the Hearthwood. Before the road
              opens, the guild gathers here - an empty roster, waiting to be filled. What you build starts now.
            </p>
          </div>
        )}

        {layout.renderSection(
          "commanderStrip",
          <div className="hw-guildhall-commander-strip">
            <span className="hw-commander-portrait hw-guildhall-commander-portrait">
              <CardGlyph name={character?.art} className="hw-commander-glyph" />
            </span>
            <div>
              <strong className="hw-commander-name">{character?.name}</strong>
              <p className="hw-commander-tagline" style={{ margin: "2px 0 0" }}>
                {character?.tagline}
              </p>
            </div>
            {pendingMemory && (
              <span
                className="hw-badge hw-guildhall-memory-badge"
                title="A small Essence boon, carried forward once in their memory"
              >
                In memory of {pendingMemory.heroName}
              </span>
            )}
          </div>
        )}

        {layout.renderSection(
          "section",
          <div className="hw-guildhall-section">
            <div className="hw-section-label">What your guild could become</div>
            <p className="hw-flavor" style={{ maxWidth: 610, marginTop: 0 }}>
              No one's recruited yet - but every tribe below is a squad identity worth chasing once the shop
              opens.
            </p>
            <div className="hw-guildhall-tribe-grid">
              {TRIBE_ORDER.map((tribeId) => {
                const tribe = TRIBES[tribeId]
                return (
                  <span
                    key={tribeId}
                    className="hw-badge hw-guildhall-tribe-badge"
                    style={{ color: tribe.color, borderColor: tribe.color }}
                    title={synergyTiersSummary(tribeId)}
                  >
                    <CardGlyph name={tribe.icon} className="hw-intent-glyph" />
                    {tribe.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {layout.renderSection(
          "cta",
          <div>
            <button className="hw-end-turn hw-guildhall-cta" onClick={onEnterMarket}>
              Step through the Forest Gate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
