import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { buildJournal } from "../../data/heartwood/storyLog"

// The Story Journal - the run's accumulating narrative in one place.
// Marc: "ei koukkua eteneä". Boons, crossroads picks, the events you
// walked through and the milestones you set are all real story now;
// this is where the player reads them back. Collapsed by default, opened
// from a toggle on the run map (RunMap.jsx).
export default function StoryJournal({ runState }) {
  const [open, setOpen] = useState(false)
  const journal = buildJournal(runState)
  const count = journal.events.length + journal.crossroads.length + journal.milestones.length

  return (
    <div className="hw-journal">
      <button
        className="hw-journal-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Story so far</span>
        {count > 0 && <span className="hw-journal-count">{count}</span>}
        <span className="hw-journal-caret" data-open={open || undefined}>▸</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="hw-journal-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="hw-journal-inner">
              {journal.forest && (
                <div className="hw-journal-forest" data-forest={journal.forest.state}>
                  <span className="hw-journal-section-label">The forest</span>
                  <p>{journal.forest.label}</p>
                </div>
              )}

              {journal.crossroads.length > 0 && (
                <div className="hw-journal-section">
                  <span className="hw-journal-section-label">Crossroads</span>
                  {journal.crossroads.map((c) => (
                    <div key={c.act} className="hw-journal-entry">
                      <div className="hw-journal-entry-head">
                        Act {c.act} — {c.kicker}: <em>{c.label}</em>
                      </div>
                      <p className="hw-journal-entry-body">{c.result}</p>
                      {c.grant && (
                        <p className="hw-journal-grant">
                          <strong>{c.grant.name}</strong> — {c.grant.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {journal.events.length > 0 && (
                <div className="hw-journal-section">
                  <span className="hw-journal-section-label">Along the road</span>
                  {journal.events.map((e, i) => (
                    <div key={i} className="hw-journal-entry">
                      <div className="hw-journal-entry-head">
                        {e.act ? `Act ${e.act} — ` : ""}{e.title}: <em>{e.choice}</em>
                      </div>
                      <p className="hw-journal-entry-body">{e.result}</p>
                    </div>
                  ))}
                </div>
              )}

              {journal.milestones.length > 0 && (
                <div className="hw-journal-section">
                  <span className="hw-journal-section-label">What you carry</span>
                  <ul className="hw-journal-milestones">
                    {journal.milestones.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {count === 0 && (
                <p className="hw-journal-empty">The road is still young. Your story starts at the first fork.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
