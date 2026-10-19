import { useState } from "react"
import "./heartwood-creatures.css"
import { motion, AnimatePresence } from "framer-motion"
import { buildJournal } from "../../data/heartwood/storyLog"
import { tellingsWithEvidence, beliefOf } from "../../services/heartwood/myths"
import { BELIEF_BORNE_OUT } from "../../data/heartwood/myths"

// The Story Journal - the run's accumulating narrative in one place.
// Marc: "ei koukkua eteneä". Boons, crossroads picks, the events you
// walked through and the milestones you set are all real story now;
// this is where the player reads them back. Collapsed by default, opened
// from a toggle on the run map (RunMap.jsx).
export default function StoryJournal({ runState, onBelieve }) {
  const [open, setOpen] = useState(false)
  const journal = buildJournal(runState)
  // The Four Tellings (myths.js): conflicting stories of how the forest began.
  const tellings = tellingsWithEvidence(runState)
  const heard = tellings.filter((t) => t.evidence.length > 0)
  const belief = beliefOf(runState)
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

              {heard.length > 0 && (
                <div className="hw-journal-section hw-tellings" data-tellings>
                  <span className="hw-journal-section-label">How the forest began - four tellings</span>
                  <p className="hw-tellings-lede">Every people tells it differently. Weigh what you have seen, and choose what you believe.</p>
                  {tellings.map((t) => (
                    <div key={t.id} className="hw-telling" data-telling={t.id} data-believed={belief?.id === t.id || undefined} data-unheard={!t.evidence.length || undefined} style={{ "--hw-telling": t.color }}>
                      <div className="hw-telling-head">
                        <span className="hw-telling-icon" aria-hidden="true">{t.icon}</span>
                        <strong>{t.name}</strong>
                        <span className="hw-telling-teller">- {t.teller}</span>
                        <span className="hw-telling-count" title="Evidence you have seen">{t.evidence.length} evidence</span>
                      </div>
                      {t.evidence.length > 0 ? (
                        <>
                          <p className="hw-telling-text">{t.telling}</p>
                          <ul className="hw-telling-evidence">
                            {t.evidence.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                          {onBelieve && (
                            <button type="button" className="hw-telling-believe" data-believe={t.id} onClick={() => onBelieve(t.id)}>
                              {belief?.id === t.id ? "✓ You believe this (click to doubt)" : "Believe this telling"}
                            </button>
                          )}
                          {belief?.id === t.id && t.evidence.length < BELIEF_BORNE_OUT && <span className="hw-telling-thin"> - on thin evidence so far</span>}
                        </>
                      ) : (
                        <p className="hw-telling-text hw-telling-unheard">You have not heard this telling yet.</p>
                      )}
                    </div>
                  ))}
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
