import { TOOL_VIEWS } from "./workspaceTabs.js"

// Development workspaces besides the rooms: the Studio's own tools.
// "Media- ja koodistudio" is the separate Dev Studio page (image tools,
// Spacemonkey's code planning); it opens in a new browser tab.
export const STUDIO_TOOLS = [
  { id: "qa", view: "qa", rune: "ᛏ", blurb: "Terveystarkistus, tasapainotesti ja jokaisen muutoksen oma tarkistus." },
  { id: "dashboard", view: "dashboard", rune: "ᛉ", blurb: "Hae mitä tahansa pelin listoista." },
  { id: "history", view: "history", rune: "ᛜ", blurb: "Kaikki muutoksesi – Revert peruu yhden." },
  { id: "storyMap", view: "storyMap", rune: "ᚱ", blurb: "Koko tarina näytös kerrallaan." },
  { id: "media", href: "/hearthwood-dev-studio", label: "Media- ja koodistudio", rune: "ᛗ", blurb: "Kuvatyökalut ja Spacemonkeyn koodisuunnittelu (avautuu uuteen välilehteen)." },
]

export const toolLabel = tool => tool.label || TOOL_VIEWS[tool.view]
