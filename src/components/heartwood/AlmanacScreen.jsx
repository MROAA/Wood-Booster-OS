import { useState } from "react"
import { CardGlyph } from "./cardArt"
import {
  ALMANAC_CATEGORIES,
  almanacIds,
  almanacEntry,
  almanacCounts,
} from "../../data/heartwood/almanac"

// The Almanac (almanac.js) - a lifetime discovery collection reached
// from commander-select, next to the Grove. Reads meta.almanac only;
// no engine calls. A tile is locked (silhouette + "?") until its id is
// in meta.almanac[category], then it shows its name and, on click, its
// lore in the detail column.
export default function AlmanacScreen({ meta, onBack }) {
  const [tab, setTab] = useState(ALMANAC_CATEGORIES[0].key)
  const [selectedId, setSelectedId] = useState(null)

  const counts = almanacCounts(meta)
  const seenSet = new Set(meta?.almanac?.[tab] || [])
  const ids = almanacIds(tab)
  const selected = selectedId && seenSet.has(selectedId) ? almanacEntry(tab, selectedId) : null

  return (
    <div className="hw-intro hw-almanac-screen">
      <button className="hw-exit-link hw-utility-btn" style={{ position: "absolute", top: 16, left: 16 }} onClick={onBack}>
        ← Back
      </button>

      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--hw-moss)", marginBottom: 4 }}>
        The Almanac
      </div>
      <h1 style={{ fontSize: 26, margin: "0 0 4px" }}>What the wood has shown you</h1>
      <p className="hw-flavor" style={{ maxWidth: 560 }}>
        Every unit, foe, relic and waypoint you meet is written down here - and stays written, run after run.
        <strong> {counts.overall.seen} / {counts.overall.total}</strong> discovered.
      </p>

      <div className="hw-almanac-tabs">
        {ALMANAC_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className="hw-almanac-tab"
            data-active={tab === c.key}
            onClick={() => {
              setTab(c.key)
              setSelectedId(null)
            }}
          >
            {c.label} <span className="hw-almanac-tab-count">{counts[c.key].seen}/{counts[c.key].total}</span>
          </button>
        ))}
      </div>

      <div className="hw-almanac-body">
        <div className="hw-almanac-grid">
          {ids.map((id) => {
            const seen = seenSet.has(id)
            const entry = seen ? almanacEntry(tab, id) : null
            return (
              <button
                key={id}
                className="hw-almanac-tile"
                data-locked={!seen || undefined}
                data-selected={selectedId === id || undefined}
                disabled={!seen}
                onClick={() => setSelectedId(id)}
                title={seen ? entry.name : "Not yet discovered"}
              >
                {seen ? (
                  entry.image ? (
                    <img src={entry.image} alt="" className="hw-almanac-tile-art" />
                  ) : (
                    <CardGlyph name={entry.art} className="hw-almanac-tile-art" />
                  )
                ) : (
                  <span className="hw-almanac-tile-lock">?</span>
                )}
                <span className="hw-almanac-tile-name">{seen ? entry.name : "???"}</span>
              </button>
            )
          })}
        </div>

        <div className="hw-almanac-detail">
          {selected ? (
            <>
              {selected.image ? (
                <img src={selected.image} alt="" className="hw-almanac-detail-art" />
              ) : (
                <CardGlyph name={selected.art} className="hw-almanac-detail-art" />
              )}
              <div className="hw-almanac-detail-name">{selected.name}</div>
              {selected.sub && <div className="hw-almanac-detail-sub">{selected.sub}</div>}
              <p className="hw-almanac-detail-lore">{selected.lore}</p>
            </>
          ) : (
            <p className="hw-almanac-detail-empty">Pick a discovered entry to read its record.</p>
          )}
        </div>
      </div>
    </div>
  )
}
