// Hearthwood Dev Studio - workspace tabs (pure logic, no React).
//
// Purpose: the Studio keeps several editors open at once, like a code
// editor's tabs. Studio Home is a pinned first tab; every other tab is a
// "location" - which editor, which room, which list, which entry.
//
// Responsibilities:
// - open / activate / close tabs, re-using the tab of an editor that is
//   already open instead of opening a duplicate
// - turn Studio Home's room actions and wishes into locations
// - validate anything restored from storage before it is used
//
// Dependencies: entityTypes.js, studioRooms.js (pure data).
// Public API: HOME_TAB_ID, MAX_TABS, TOOL_VIEWS, tabKey, sanitizeLocation,
//   createWorkspace, openTab, activateTab, closeTab, updateTab,
//   restoreWorkspace, serializeWorkspace, locationForAction,
//   locationForWish, locationForEntity, locationFromUrl, urlForLocation
// Tests: workspaceTabs.test.mjs (node --test)

import { ALL_TYPES } from "./entityTypes.js"
import { STUDIO_ROOMS, roomById, roomForType } from "./studioRooms.js"
import { VIEW_IDS, t, viewLabel } from "./studioText.js"

export const HOME_TAB_ID = "home"
export const MAX_TABS = 12
export const STORAGE_KEY = "hws.workspace.v1"

// Views a tab can show (id -> label in the Studio's language).
// "single" and "sheet" also carry a list type.
export const TOOL_VIEWS = Object.freeze(Object.fromEntries(VIEW_IDS.map(view => [view, viewLabel(view)])))

const VALID_TYPES = new Set([...ALL_TYPES.map(entry => entry.type), "storyTimeline"])
const MAX_ID_LENGTH = 200
const MAX_TITLE_LENGTH = 80

// Only these fields survive a restart; one-shot intents (open the "new"
// form, pre-fill the AI box, clone the first entry) never replay.
function persistable(location) {
  const { view, roomId, type, id } = location
  return { view, ...(roomId ? { roomId } : {}), ...(type ? { type } : {}), ...(id ? { id } : {}) }
}

/** The identity of an editor: re-opening the same one re-uses its tab. */
export function tabKey(location) {
  const { view, type = "", id = "" } = location || {}
  if (view === "single") return `single:${type}:${id}`
  if (view === "sheet") return `sheet:${type}`
  return view
}

/** A location from an untrusted source (storage, URL), or null if unusable. */
export function sanitizeLocation(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const view = typeof raw.view === "string" && Object.hasOwn(TOOL_VIEWS, raw.view) ? raw.view : null
  if (!view) return null
  const needsType = view === "single" || view === "sheet"
  const type = typeof raw.type === "string" && VALID_TYPES.has(raw.type) ? raw.type : null
  if (needsType && !type) return null
  const id = view === "single" && typeof raw.id === "string" && raw.id.length > 0 &&
    raw.id.length <= MAX_ID_LENGTH && ![...raw.id].some(char => char.charCodeAt(0) < 32) ? raw.id : null
  const roomId = typeof raw.roomId === "string" && roomById(raw.roomId) ? raw.roomId : null
  return {
    view,
    ...(roomId ? { roomId } : {}),
    ...(needsType ? { type } : {}),
    ...(id ? { id } : {}),
    ...(typeof raw.hint === "string" ? { hint: raw.hint.slice(0, 300) } : {}),
    ...(needsType && typeof raw.composeType === "string" && VALID_TYPES.has(raw.composeType) ? { composeType: raw.composeType } : {}),
    ...(view === "single" && typeof raw.wishText === "string" ? { wishText: raw.wishText.slice(0, 2000) } : {}),
    ...(view === "single" && raw.cloneFirst === true ? { cloneFirst: true } : {}),
  }
}

function cleanTitle(title, location) {
  const text = typeof title === "string" ? title.trim().slice(0, MAX_TITLE_LENGTH) : ""
  return text || TOOL_VIEWS[location.view]
}

export function createWorkspace() {
  return {
    tabs: [{ id: HOME_TAB_ID, pinned: true, title: t("homeTab") }],
    activeId: HOME_TAB_ID,
    // Most recently active first; used to pick the next tab after closing.
    history: [HOME_TAB_ID],
    nextSerial: 1,
  }
}

function touch(history, id) {
  return [id, ...history.filter(entry => entry !== id)]
}

/**
 * Open an editor. An editor that is already open is activated (and given
 * any one-shot intent of the new request); otherwise a new tab is added.
 * When MAX_TABS is reached the least recently used tab WITHOUT unsaved work
 * is closed; if every tab has unsaved work, nothing opens ({ refused }).
 */
export function openTab(workspace, rawLocation, { title, dirtyIds = new Set() } = {}) {
  const location = sanitizeLocation(rawLocation)
  if (!location) return { workspace, refused: "invalid-location" }

  const key = tabKey(location)
  const existing = workspace.tabs.find(tab => !tab.pinned && tabKey(tab.location) === key)
  if (existing) {
    const tabs = workspace.tabs.map(tab => tab.id === existing.id
      ? { ...tab, location: { ...tab.location, ...location }, intent: (tab.intent || 0) + 1 }
      : tab)
    return { workspace: { ...workspace, tabs, activeId: existing.id, history: touch(workspace.history, existing.id) }, tabId: existing.id, reused: true }
  }

  let tabs = workspace.tabs
  let history = workspace.history
  if (tabs.length >= MAX_TABS) {
    const victim = [...history].reverse().find(id => id !== HOME_TAB_ID && !dirtyIds.has(id))
    if (!victim) return { workspace, refused: "all-tabs-have-unsaved-work" }
    tabs = tabs.filter(tab => tab.id !== victim)
    history = history.filter(id => id !== victim)
  }

  const id = `tab-${workspace.nextSerial}`
  const tab = { id, location, title: cleanTitle(title, location), intent: 1 }
  return {
    workspace: { ...workspace, tabs: [...tabs, tab], activeId: id, history: touch(history, id), nextSerial: workspace.nextSerial + 1 },
    tabId: id,
    reused: false,
  }
}

export function activateTab(workspace, id) {
  if (!workspace.tabs.some(tab => tab.id === id)) return workspace
  return { ...workspace, activeId: id, history: touch(workspace.history, id) }
}

/** Close a tab (Home cannot be closed). The caller asks about unsaved work first. */
export function closeTab(workspace, id) {
  if (id === HOME_TAB_ID || !workspace.tabs.some(tab => tab.id === id)) return workspace
  const tabs = workspace.tabs.filter(tab => tab.id !== id)
  const history = workspace.history.filter(entry => entry !== id)
  const activeId = workspace.activeId === id ? (history.find(entry => tabs.some(tab => tab.id === entry)) || HOME_TAB_ID) : workspace.activeId
  return { ...workspace, tabs, history, activeId }
}

/** An editor moved inside its own tab (picked another entry, etc.). */
export function updateTab(workspace, id, rawLocation, title) {
  const location = sanitizeLocation(rawLocation)
  if (!location) return workspace
  let changed = false
  const tabs = workspace.tabs.map(tab => {
    if (tab.id !== id || tab.pinned) return tab
    const nextTitle = cleanTitle(title, location)
    const same = JSON.stringify(persistable(tab.location)) === JSON.stringify(persistable(location)) && tab.title === nextTitle
    if (same) return tab
    changed = true
    return { ...tab, location: { ...persistable(location) }, title: nextTitle }
  })
  return changed ? { ...workspace, tabs } : workspace
}

export function serializeWorkspace(workspace) {
  return JSON.stringify({
    v: 1,
    tabs: workspace.tabs.filter(tab => !tab.pinned).map(tab => ({ location: persistable(tab.location), title: tab.title })),
    active: workspace.activeId === HOME_TAB_ID ? -1 : workspace.tabs.filter(tab => !tab.pinned).findIndex(tab => tab.id === workspace.activeId),
  })
}

/** Rebuild a workspace from storage; anything invalid is dropped, never trusted. */
export function restoreWorkspace(text) {
  let workspace = createWorkspace()
  let data
  try {
    data = typeof text === "string" ? JSON.parse(text) : null
  } catch {
    return workspace
  }
  if (!data || data.v !== 1 || !Array.isArray(data.tabs)) return workspace

  const restoredIds = []
  for (const saved of data.tabs.slice(0, MAX_TABS - 1)) {
    const location = sanitizeLocation(saved?.location)
    if (!location) {
      restoredIds.push(null)
      continue
    }
    const before = workspace.tabs.length
    const result = openTab(workspace, persistable(location), { title: saved?.title })
    workspace = result.workspace
    restoredIds.push(workspace.tabs.length > before ? result.tabId : null)
  }
  const activeId = Number.isInteger(data.active) ? restoredIds[data.active] : null
  return activeId ? activateTab(workspace, activeId) : activateTab(workspace, HOME_TAB_ID)
}

// --- Studio Home actions -> locations ---------------------------------

/** A room's action (studioRooms.js kinds: type / add / view / link). */
export function locationForAction(room, action) {
  if (!action || action.kind === "link") return null
  const roomId = room?.id
  if (action.kind === "view") return sanitizeLocation({ view: action.view, roomId, hint: action.hint })
  if (action.kind === "add") return sanitizeLocation({ view: "single", roomId, type: action.type, composeType: action.type, hint: action.hint })
  return sanitizeLocation({ view: "single", roomId, type: action.type, hint: action.hint })
}

/** Entering a room opens its first list (or its first action). */
export function locationForRoom(room) {
  const first = room.actions.find(action => action.kind === "type") || room.actions[0]
  return locationForAction(room, first)
}

export function locationForEntity(type, id) {
  return sanitizeLocation({ view: "single", type, id, roomId: roomForType(type)?.id })
}

/** StudioWishBox answer (wishRouter.js) -> where it should land. */
export function locationForWish(answer, text) {
  if (!answer) return null
  const type = answer.entity?.type || answer.type
  const hint = answer.why || ""
  if (answer.kind === "view") return sanitizeLocation({ view: answer.view, roomId: "look", hint })
  const roomId = roomForType(type)?.id
  if (answer.kind === "add") return sanitizeLocation({ view: "single", type, roomId, composeType: type, hint })
  if (answer.kind === "clone") return sanitizeLocation({ view: "single", type, roomId, cloneFirst: true, hint })
  return sanitizeLocation({
    view: "single", type, roomId, id: answer.entity?.id, hint,
    wishText: answer.kind === "change" ? text : "",
  })
}

// --- address bar ------------------------------------------------------

/** The page's query string (old deep links keep working). */
export function locationFromUrl(search) {
  const params = new URLSearchParams(search)
  const type = params.get("type")
  const view = params.get("view") || (type ? "single" : null)
  if (!view) return null
  return sanitizeLocation({ view, type, id: params.get("id"), roomId: params.get("room") || roomForType(type)?.id })
}

export function urlForLocation(location) {
  if (!location) return ""
  const params = new URLSearchParams()
  if (location.view !== "single") params.set("view", location.view)
  if ((location.view === "single" || location.view === "sheet") && location.type) params.set("type", location.type)
  if (location.view === "single" && location.id) params.set("id", location.id)
  if (location.roomId) params.set("room", location.roomId)
  const text = params.toString()
  return text ? `?${text}` : ""
}

export const ROOM_IDS = STUDIO_ROOMS.map(room => room.id)
