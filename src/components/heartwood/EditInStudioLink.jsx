/*
 * Marc: "haluan jotenkin livenä muokata peliä sitä pelatessani" / "että
 * pelaan peliä ja muokkaan sitä pelatessa" / "se olisi minulle helpoin
 * tapa tehdä tarinaa" (I want to somehow edit the game live while
 * playing it - that I play the game and edit it as I play - that would
 * be the easiest way for me to make the story).
 *
 * A small, deliberately quiet link on a story screen (EventScreen,
 * DialogueScreen) - opens Hearthwood Studio in a new tab, already
 * pointed at the exact entity currently on screen (via
 * HearthwoodStudio.jsx's own `?type=&id=` deep-link support). Playing
 * stays uninterrupted in the original tab; editing happens in the new
 * one. `import.meta.env.DEV` (true only under `vite`/`npm run dev`,
 * false in a production build) keeps this invisible to anyone playing
 * a real shipped build - it only ever appears for Marc's own dev-server
 * play sessions.
 */
export default function EditInStudioLink({ type, id, label }) {
  if (!import.meta.env.DEV || !id) {
    return null
  }

  return (
    <a
      href={`/hearthwood-studio?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`}
      target="_blank"
      rel="noreferrer"
      onClick={event => event.stopPropagation()}
      style={{
        display: "inline-block",
        fontSize: 11,
        color: "var(--hw-muted)",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        opacity: 0.7,
      }}
    >
      ✏️ {label || "Edit in Studio"}
    </a>
  )
}
