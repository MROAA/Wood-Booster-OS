import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/*
 * Hearthwood's first branching NPC conversation (dialogues.js).
 * Triggered from an event choice with a `dialogueId` (EventScreen.jsx) -
 * instead of that choice's own result+Continue screen, this takes over:
 * greeting -> pick a question -> see the answer (+ that node's own
 * follow-up questions, if any) -> repeat, however deep the data goes -
 * until a node with no followUps, or the player leaves early. Every
 * visited node's own `effects` accumulate into one flat list, and the
 * LAST answer reached becomes the summary line the Story Journal shows
 * for this event choice (a plain choice already has its own `result`
 * text for that; a dialogue-triggering choice doesn't, so this supplies
 * one) - both handed back via onDone(effects, summary).
 */
export default function DialogueScreen({ dialogue, onDone }) {
  // `path` is the stack of exchange nodes visited so far, each already
  // "answered" (shown oldest-first, like a conversation scrolling
  // down). `current` (below) is whichever question list is choosable
  // RIGHT NOW - the top-level exchanges, or the last visited node's own
  // followUps.
  const [path, setPath] = useState([])
  const [effects, setEffects] = useState([])

  if (!dialogue) return null

  const current = path.length === 0 ? (dialogue.exchanges || []) : (path[path.length - 1].followUps || [])
  const lastAnswer = path.length > 0 ? path[path.length - 1].answer : null
  const hasMore = current.length > 0

  function pick(node) {
    setEffects((prev) => [...prev, ...(node.effects || [])])
    setPath((prev) => [...prev, node])
  }

  function leave() {
    onDone?.(effects, lastAnswer || `You spoke with ${dialogue.npc}.`)
  }

  return (
    <motion.div
      className="hw-intro hw-event hw-dialogue"
      data-screen="dialogue"
      data-dialogue={dialogue.npc}
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
        {dialogue.npc}
      </div>

      <div className="hw-dialogue-lines">
        <AnimatePresence initial={false}>
          <motion.p
            key="greeting"
            className="hw-flavor"
            style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 620 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: path.length === 0 ? 1 : 0.55, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {dialogue.greeting}
          </motion.p>

          {path.map((node, idx) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: idx === path.length - 1 ? 1 : 0.55, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{ marginTop: 14, maxWidth: 620 }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{node.question}</p>
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
                {node.answer}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, maxWidth: 620 }}
      >
        {current.map((node) => (
          <button
            key={node.id}
            className="hw-move-btn"
            style={{ textAlign: "left", padding: "12px 16px", lineHeight: 1.4 }}
            onClick={() => pick(node)}
          >
            {node.question}
          </button>
        ))}

        <button
          className="hw-move-btn"
          style={{ marginTop: hasMore ? 4 : 18 }}
          onClick={leave}
        >
          {hasMore ? "(Leave.)" : "Continue"}
        </button>
      </motion.div>
    </motion.div>
  )
}
