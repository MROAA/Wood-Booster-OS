// A game data file changed (a Hearthwood Studio save, or an edit on disk) -
// vite.config.js's hearthwoodDataHmr sends "hw-data-changed" instead of a
// full page reload. The Studio refreshes what it shows (window event
// "hw-data-changed", HearthwoodStudio.jsx); every other page reloads so the
// game runs the new data, exactly as before.
if (import.meta.hot) {
  import.meta.hot.on("hw-data-changed", detail => {
    if (window.location.pathname.startsWith("/hearthwood-studio")) {
      window.dispatchEvent(new CustomEvent("hw-data-changed", { detail }))
    } else {
      window.location.reload()
    }
  })
}
