// Hearthwood Dev Studio - UI text of the workspace (Sprint 4).
//
// Finnish is the primary language (PRD 2.2); English is kept alongside so
// a later translation only adds a language here. The editors' own texts
// (written before Sprint 4) are not in this table yet.
// Public API: t(key, vars), viewLabel(view), roomTitle(room), STUDIO_LANG

const TEXT = {
  fi: {
    studioName: "Hearthwood Dev Studio",
    safetyNote: "Mikään ei muutu ennen kuin painat “Put it in the game”, ja jokaisen muutoksen voi perua.",
    homeTab: "Studion etusivu",
    openEditors: "Avoimet editorit",
    closeTab: "Sulje välilehti",
    closeNamed: "Sulje {title}",
    unsavedMark: "Keskeneräistä työtä, ei vielä pelissä",
    closeTitle: "Suljetaanko “{title}”?",
    closeText: "Tässä välilehdessä on keskeneräistä työtä, jota ei ole viety peliin: esikatseltu muutos tai täytetty mutta tallentamaton lomake. Sulkeminen hylkää sen. Peliin jo viedyt muutokset eivät muutu.",
    keepOpen: "Pidä välilehti auki",
    closeDiscard: "Sulje ja hylkää keskeneräinen työ",
    tabsFull: "Jokaisessa avoimessa välilehdessä on odottava muutos. Vie yksi peliin tai hylkää se ennen uuden editorin avaamista.",
    ok: "OK",
    moreTools: "Lisää työkaluja",
    nav: "Työtilat",
    navWorkspaces: "Työtilat",
    navTools: "Työkalut",
    toggleNav: "Näytä tai piilota työtilat",
    toggleAssistant: "Näytä tai piilota Spacemonkey",
    resizeAssistant: "Muuta Spacemonkey-paneelin leveyttä",
    continueTitle: "Jatka kehitystä",
    continueKicker: "Viimeksi avoinna ollut editori",
    continueOpen: "avaa välilehdessään ›",
    continueNone: "Yhtään editoria ei ole vielä auki. Valitse työtila – se avautuu omaan välilehteensä ja palaa seuraavalla kerralla.",
    overviewTitle: "Projektin tilanne",
    suggestionsTitle: "Spacemonkeyn ehdotukset",
    suggestionsNote: "Ehdotukset perustuvat Studion omiin havaintoihin (ei AI-arvausta). Ne eivät ole hyväksyttyjä tehtäviä.",
    suggestionsNone: "Ei ehdotuksia juuri nyt: tarkistukset ovat kunnossa eikä keskeneräisiä esikatseluja ole.",
    suggestionWhy: "Miksi",
    suggestionBasis: "Havainto",
    suggestionBenefit: "Hyöty",
    suggestionApproval: "Hyväksyntä",
    workspacesTitle: "Kehitystyötilat",
    step1: "Valitse työtila – se avautuu omaan välilehteensä",
    step2: "Tee muutos ja katso esikatselu",
    step3: "Paina “Put it in the game”. Muutitko mielesi?",
    undoLink: "↩ Peru muutos",
    reading: "Luetaan…",
    unavailable: "Ei saatavilla juuri nyt",
    from: "lähde: {source}",
  },
  en: {
    studioName: "Hearthwood Dev Studio",
    safetyNote: "Nothing changes until you press “Put it in the game”, and every change can be undone.",
    homeTab: "Studio Home",
    openEditors: "Open editors",
    closeTab: "Close tab",
    closeNamed: "Close {title}",
    unsavedMark: "Unsaved work, not in the game yet",
    closeTitle: "Close “{title}”?",
    closeText: "This tab has work that is not in the game yet: a previewed change or a filled-in form that was not saved. Closing the tab throws it away. Nothing already in the game is affected.",
    keepOpen: "Keep the tab open",
    closeDiscard: "Close and discard the work",
    tabsFull: "Every open tab has a change waiting. Put one in the game or discard it before opening another editor.",
    ok: "OK",
    moreTools: "More tools",
    nav: "Workspaces",
    navWorkspaces: "Workspaces",
    navTools: "Tools",
    toggleNav: "Show or hide workspaces",
    toggleAssistant: "Show or hide Spacemonkey",
    resizeAssistant: "Resize the Spacemonkey panel",
    continueTitle: "Continue developing",
    continueKicker: "Last open editor",
    continueOpen: "open in its tab ›",
    continueNone: "No editor open yet. Pick a workspace - it opens in its own tab and comes back next time.",
    overviewTitle: "Project overview",
    suggestionsTitle: "Spacemonkey suggestions",
    suggestionsNote: "Based on the Studio's own observations (not an AI guess). They are not approved tasks.",
    suggestionsNone: "No suggestions right now: checks are fine and no previews are waiting.",
    suggestionWhy: "Why",
    suggestionBasis: "Observation",
    suggestionBenefit: "Benefit",
    suggestionApproval: "Approval",
    workspacesTitle: "Development workspaces",
    step1: "Pick a workspace - it opens in its own tab",
    step2: "Make your change and look at the preview",
    step3: "Press “Put it in the game”. Changed your mind?",
    undoLink: "↩ Undo a change",
    reading: "Reading…",
    unavailable: "Not available right now",
    from: "from {source}",
  },
}

const VIEW_LABELS = {
  fi: {
    single: "Editori", sheet: "Taulukko", dashboard: "Etsi mitä tahansa", history: "Peru muutos",
    qa: "Testaus ja QA", skills: "Taitopaja", storyMap: "Tarinakartta", theme: "Värit ja teema",
    resources: "Sankarien resurssit", mutations: "Mutaatiot", traits: "Piirteet", promotions: "Ylennykset",
    identity: "Sankarin identiteetti", gear: "Varusteet",
  },
  en: {
    single: "Editor", sheet: "Sheet", dashboard: "Find anything", history: "Undo a change",
    qa: "Testing & QA", skills: "Skill workshop", storyMap: "Story map", theme: "Colours & Theme",
    resources: "Hero resources", mutations: "Mutations", traits: "Traits", promotions: "Promotions",
    identity: "Hero identity", gear: "Gear",
  },
}

const ROOM_TITLES = {
  fi: {
    heroes: "Sankarit", skills: "Taidot ja mana", enemies: "Viholliset", battlefield: "Taistelukenttä",
    story: "Tarina", lore: "Maailma ja lore", market: "Kauppa ja talous", look: "Ulkoasu ja värit",
    guidance: "Ohjeet ja opastus",
  },
}

export const STUDIO_LANG = "fi"

export function t(key, vars = {}) {
  const text = TEXT[STUDIO_LANG][key] ?? TEXT.en[key] ?? key
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""))
}

export function viewLabel(view) {
  return VIEW_LABELS[STUDIO_LANG][view] || VIEW_LABELS.en[view] || view
}

export function roomTitle(room) {
  return ROOM_TITLES[STUDIO_LANG]?.[room?.id] || room?.title || ""
}

export const VIEW_IDS = Object.keys(VIEW_LABELS.en)
