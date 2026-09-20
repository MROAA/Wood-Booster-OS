import { useState } from "react"

import QuickEditOverlay from "./QuickEditOverlay"

/*
 * Marc: "haluan jotenkin livenä muokata peliä sitä pelatessani... että
 * pelaan peliä ja muokkaan sitä pelatessa... se olisi minulle helpoin
 * tapa tehdä tarinaa" - then, after trying the first (new-tab) version:
 * "haluan kehittää tätä lisää. tykkään ideasta pystyä pelaamaan peliä
 * ja muokkaamaan sitä lennossa" (I want to develop this further - I
 * like the idea of playing the game and editing it on the fly).
 *
 * A small, deliberately quiet trigger on a story screen (EventScreen,
 * DialogueScreen) - opens QuickEditOverlay right on top of the current
 * screen (no new tab, no losing your place). `import.meta.env.DEV`
 * (true only under `vite`/`npm run dev`, false in a production build)
 * keeps this invisible to anyone playing a real shipped build.
 */
export default function EditInStudioLink({ type, id, label }) {
  const [open, setOpen] = useState(false)

  if (!import.meta.env.DEV || !id) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={event => {
          // Some screens (StoryCinematic's click-to-advance) read a
          // click anywhere on the root as "next line" - stop it here so
          // opening the editor doesn't also advance the scene under it.
          event.stopPropagation()
          setOpen(true)
        }}
        style={{
          display: "inline-block",
          fontSize: 11,
          color: "var(--hw-muted)",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          opacity: 0.7,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        ✏️ {label || "Edit in Studio"}
      </button>

      {open && <QuickEditOverlay type={type} id={id} onClose={() => setOpen(false)} />}
    </>
  )
}
