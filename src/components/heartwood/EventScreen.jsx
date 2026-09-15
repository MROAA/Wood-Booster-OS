import { useState } from "react"
import { motion } from "framer-motion"

// A map event (events.js) - Slay the Spire's "?" node. Marc, more than
// once: "pelaaja kulkee mappia ja vastaan tulee eventtejä" - the player
// walks the map and events come up, and they carry the story.
//
// Two steps in one screen: the vignette + its choices, then the chosen
// option's result line + Continue. `onResolve(choiceIndex)` runs
// runEngine.js's resolveEventChoice, which applies the consequences and
// advances the run. Deliberately quiet and text-first - this is a story
// beat, not another mechanical picker.
export default function EventScreen({ event, onResolve }) {
  const [chosen, setChosen] = useState(null)
  if (!event) return null
  const chosenChoice = chosen != null ? event.choices[chosen] : null

  return (
    <motion.div
      className="hw-intro hw-event"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "var(--hw-rune)",
          marginBottom: 6,
        }}
      >
        An Event
      </div>
      <h1 style={{ fontSize: 24, margin: "0 0 14px" }}>{event.title}</h1>
      <p className="hw-flavor" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 620 }}>
        {event.body}
      </p>

      {chosen == null ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, maxWidth: 620 }}>
          {event.choices.map((c, i) => (
            <button
              key={i}
              className="hw-move-btn"
              style={{ textAlign: "left", padding: "12px 16px", lineHeight: 1.4 }}
              onClick={() => setChosen(i)}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          style={{ marginTop: 20, maxWidth: 620 }}
        >
          <p
            className="hw-flavor"
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              fontStyle: "italic",
              borderLeft: "2px solid var(--hw-rune)",
              paddingLeft: 14,
            }}
          >
            {chosenChoice.result}
          </p>
          <button
            className="hw-move-btn"
            style={{ marginTop: 18 }}
            onClick={() => onResolve(chosen)}
          >
            Continue
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
