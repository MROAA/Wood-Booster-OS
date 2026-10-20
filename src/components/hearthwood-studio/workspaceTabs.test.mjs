// node --test src/components/hearthwood-studio/workspaceTabs.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import {
  HOME_TAB_ID, MAX_TABS, createWorkspace, openTab, activateTab, closeTab, updateTab,
  restoreWorkspace, serializeWorkspace, sanitizeLocation, tabKey,
  locationForAction, locationForRoom, locationForWish, locationFromUrl, urlForLocation,
} from "./workspaceTabs.js"
import { roomById } from "./studioRooms.js"
import { t } from "./studioText.js"

const heroes = { view: "single", type: "units" }
const hero = id => ({ view: "single", type: "units", id })

test("Studio Home is the pinned first tab and cannot be closed", () => {
  const ws = createWorkspace()
  assert.equal(ws.tabs[0].id, HOME_TAB_ID)
  assert.equal(ws.tabs[0].pinned, true)
  assert.equal(closeTab(ws, HOME_TAB_ID), ws)
})

test("several editors stay open; re-opening one activates its tab", () => {
  let ws = createWorkspace()
  ws = openTab(ws, heroes).workspace
  const heroesId = ws.activeId
  ws = openTab(ws, { view: "skills" }).workspace
  assert.equal(ws.tabs.length, 3)
  const again = openTab(ws, { ...heroes, hint: "pick a hero" })
  assert.equal(again.reused, true)
  assert.equal(again.workspace.tabs.length, 3)
  assert.equal(again.workspace.activeId, heroesId)
  assert.equal(again.workspace.tabs.find(t => t.id === heroesId).location.hint, "pick a hero")
})

test("different entries of the same list are different editors", () => {
  assert.notEqual(tabKey(hero("a")), tabKey(hero("b")))
  assert.notEqual(tabKey(hero("a")), tabKey(heroes))
  assert.equal(tabKey({ view: "dashboard", type: "units" }), "dashboard")
})

test("closing the active tab returns to the previously used one", () => {
  let ws = createWorkspace()
  ws = openTab(ws, heroes).workspace
  const first = ws.activeId
  ws = openTab(ws, { view: "qa" }).workspace
  ws = activateTab(ws, first)
  ws = openTab(ws, { view: "history" }).workspace
  ws = closeTab(ws, ws.activeId)
  assert.equal(ws.activeId, first)
  ws = closeTab(ws, first)
  assert.notEqual(ws.activeId, first)
  assert.ok(ws.tabs.some(t => t.id === ws.activeId))
})

test("at the tab limit the least recently used tab without unsaved work is closed", () => {
  let ws = createWorkspace()
  const ids = []
  for (let i = 0; i < MAX_TABS - 1; i += 1) {
    ws = openTab(ws, hero(`h${i}`)).workspace
    ids.push(ws.activeId)
  }
  const result = openTab(ws, { view: "qa" }, { dirtyIds: new Set([ids[0]]) })
  assert.equal(result.workspace.tabs.length, MAX_TABS)
  assert.ok(result.workspace.tabs.some(t => t.id === ids[0]), "tab with unsaved work is kept")
  assert.ok(!result.workspace.tabs.some(t => t.id === ids[1]), "oldest clean tab closed")
  const refused = openTab(ws, { view: "qa" }, { dirtyIds: new Set(ids) })
  assert.equal(refused.refused, "all-tabs-have-unsaved-work")
  assert.equal(refused.workspace, ws)
})

test("restore: valid tabs and the active one come back; one-shot intents do not replay", () => {
  let ws = createWorkspace()
  ws = openTab(ws, { view: "single", type: "events", composeType: "events", wishText: "x" }, { title: "Events" }).workspace
  ws = openTab(ws, hero("thistlemaw"), { title: "Thistlemaw" }).workspace
  const restored = restoreWorkspace(serializeWorkspace(ws))
  assert.deepEqual(restored.tabs.map(tab => tab.title), [t("homeTab"), "Events", "Thistlemaw"])
  assert.equal(restored.tabs.find(tab => tab.id === restored.activeId).title, "Thistlemaw")
  const events = restored.tabs[1].location
  assert.equal(events.composeType, undefined)
  assert.equal(events.wishText, undefined)
})

test("restore never trusts storage: junk, unknown views/types and oversized ids are dropped", () => {
  for (const junk of [null, "", "{", "[]", JSON.stringify({ v: 2, tabs: [] }), JSON.stringify({ v: 1, tabs: "x" })]) {
    const ws = restoreWorkspace(junk)
    assert.deepEqual(ws.tabs.map(t => t.id), [HOME_TAB_ID])
    assert.equal(ws.activeId, HOME_TAB_ID)
  }
  const ws = restoreWorkspace(JSON.stringify({
    v: 1,
    active: 0,
    tabs: [
      { location: { view: "deleteEverything" } },
      { location: { view: "single", type: "../../etc" } },
      { location: { view: "single", type: "units", id: "x".repeat(500) }, title: "y".repeat(500) },
      { location: { view: "single", type: "units", id: "ok\u0000bad" } },
      { location: { view: "qa", roomId: "no-such-room" } },
      { location: { view: "qa" } },
    ],
  }))
  // index 0 was invalid, so Home is active; duplicate "units" list collapses into one tab
  assert.equal(ws.activeId, HOME_TAB_ID)
  assert.deepEqual(ws.tabs.map(t => t.location && tabKey(t.location)).slice(1), ["single:units:", "qa"])
  assert.ok(ws.tabs[1].title.length <= 80)
  assert.equal(ws.tabs[2].location.roomId, undefined)
})

test("restore caps the number of tabs", () => {
  const tabs = Array.from({ length: 40 }, (_, i) => ({ location: hero(`h${i}`) }))
  assert.ok(restoreWorkspace(JSON.stringify({ v: 1, tabs, active: 39 })).tabs.length <= MAX_TABS)
})

test("an editor that moves inside its tab updates the tab, and keeps unsafe data out", () => {
  let ws = createWorkspace()
  ws = openTab(ws, heroes).workspace
  const id = ws.activeId
  ws = updateTab(ws, id, hero("ashenhorn"), "Ashenhorn")
  assert.equal(ws.tabs[1].title, "Ashenhorn")
  assert.equal(ws.tabs[1].location.id, "ashenhorn")
  assert.equal(updateTab(ws, id, { view: "nope" }, "x"), ws)
  assert.equal(updateTab(ws, id, hero("ashenhorn"), "Ashenhorn"), ws, "no change -> same object")
})

test("Studio Home actions become the right locations", () => {
  const heroesRoom = roomById("heroes")
  assert.deepEqual(locationForRoom(heroesRoom), { view: "single", roomId: "heroes", type: "units", hint: "Pick a hero on the left - the picture is the first thing on the right." })
  assert.equal(locationForAction(roomById("battlefield"), { kind: "link", href: "/x" }), null)
  assert.equal(locationForAction(roomById("battlefield"), { kind: "add", type: "battleObjects" }).composeType, "battleObjects")
  assert.equal(locationForAction(heroesRoom, { kind: "view", view: "traits" }).view, "traits")
  const change = locationForWish({ kind: "change", entity: { type: "units", id: "thistlemaw" }, why: "found it" }, "make it stronger")
  assert.equal(change.id, "thistlemaw")
  assert.equal(change.wishText, "make it stronger")
  assert.equal(locationForWish({ kind: "clone", type: "units" }).cloneFirst, true)
  assert.equal(sanitizeLocation({ view: "single" }), null, "an editor needs a list type")
})

test("old deep links keep working and round-trip through the address bar", () => {
  const loc = locationFromUrl("?type=units&id=thistlemaw")
  assert.deepEqual(loc, { view: "single", roomId: "heroes", type: "units", id: "thistlemaw" })
  assert.deepEqual(locationFromUrl(urlForLocation(loc)), loc)
  assert.equal(locationFromUrl("?view=skills").view, "skills")
  assert.equal(locationFromUrl(""), null)
  assert.equal(locationFromUrl("?view=evil"), null)
})
