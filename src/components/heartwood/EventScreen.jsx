import { useState } from "react"
import { motion } from "framer-motion"

import { DIALOGUES } from "../../data/heartwood/dialogues"
import DialogueScreen from "./DialogueScreen"
import EditInStudioLink from "./EditInStudioLink"
import { useFreeLayout } from "./useFreeLayout.jsx"

// A map event (events.js) - Slay the Spire's "?" node. Marc, more than
// once: "pelaaja kulkee mappia ja vastaan tulee eventtejä" - the player
// walks the map and events come up, and they carry the story.
//
// Two steps in one screen: the vignette + its choices, then the chosen
// option's result line + Continue. `onResolve(choiceIndex)` runs
// runEngine.js's resolveEventChoice, which applies the consequences and
// advances the run. Deliberately quiet and text-first - this is a story
// beat, not another mechanical picker.
//
// A choice with `dialogueId` (dialogues.js) is the one exception to
// "result line + Continue" - it hands off to DialogueScreen instead,
// and THAT screen's own accumulated effects/summary flow back through
// onResolve's optional 2nd/3rd arguments once the conversation ends.
export default function EventScreen({ event, onResolve }) {
  const [chosen, setChosen] = useState(null)
  // Stage B of the free-positioning initiative (the Market screen's
  // own round is fully complete) - re-checked live before assuming the
  // original "MEDIUM risk / fluid .hw-intro template" label still
  // applied: .hw-intro's own CSS is a plain block (padding/max-width/
  // margin, no flex, no grid, no gap) and .hw-event has no CSS rule of
  // its own at all - the STANDARD wrapper-div pattern (same as
  // CommanderSelect/GuildHallScreen) is safe here with no scoped CSS
  // override needed. Called unconditionally (before the early `!event`
  // return below) per React's rules of hooks, same reasoning as every
  // other screen's own top-of-component hook call.
  const layout = useFreeLayout({ screenId: "eventScreen", keys: ["eyebrow", "title", "body", "choiceArea"] })
  if (!event) return null
  const chosenChoice = chosen != null ? event.choices[chosen] : null

  if (chosenChoice?.dialogueId) {
    return (
      <DialogueScreen
        dialogue={DIALOGUES[chosenChoice.dialogueId]}
        dialogueId={chosenChoice.dialogueId}
        onDone={(effects, summary) => onResolve(chosen, effects, summary)}
      />
    )
  }

  return (
    <motion.div
      className="hw-intro hw-event"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
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
          "eyebrow",
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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

            <EditInStudioLink type="events" id={event.id} />
          </div>
        )}
        {layout.renderSection("title", <h1 style={{ fontSize: 24, margin: "0 0 14px" }}>{event.title}</h1>)}
        {layout.renderSection(
          "body",
          <p className="hw-flavor" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 620 }}>
            {event.body}
          </p>
        )}
        {layout.renderSection(
          "choiceArea",
          chosen == null ? (
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
          )
        )}
      </div>
    </motion.div>
  )
}
