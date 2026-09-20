import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { apiGet, apiPut, apiDelete } from "../../api/client"
import { startPointerDrag } from "./pointerDrag"

// Reusable free-layout system (Stage A of Marc's "WordPress-style"
// visual-editing ask) - generalized from SquadDraft.jsx's own
// RAILS/savedFreePositions/startEditingLayout/renderPositionedSection
// (the Market screen's left/right rail drag mechanism), collapsed from
// two rails down to ONE container per screen, and backed by the new
// hearthwood-layout DB API instead of Market's usePatchPreview/
// patchbay source-text-patching flow - this is per-viewer preference
// data, not game source code, so a plain PUT/DELETE is the right tool,
// not a preview/diff/git-snapshot/lint-gate pipeline.
//
// `keys`: the fixed list of named blocks this screen exposes (analogous
// to RAILS.left.keys) - order here is NOT a display order (unlike
// Market's separate leftRailOrder), each screen's own JSX still decides
// flow/DOM order; this is purely the set of positionable/hideable keys.
//
// Each key's saved value is either `{x, y}` (visible, positioned) or
// `{hidden: true}` (hidden, no position needed - Marc: "nykyisessä
// pelin UI:ssa on liikaa asiaa ja haluan poistaa siitä turhia").
// Free positioning activates once every NON-hidden key has a complete
// {x, y} - a hidden key never blocks that check, since it isn't being
// placed.
export function useFreeLayout({ screenId, keys, deps = [] }) {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState({})
  const [editingLayout, setEditingLayout] = useState(false)
  const [layoutDraft, setLayoutDraft] = useState(null)
  const [height, setHeight] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const containerRef = useRef(null)
  const sectionRefs = useRef({})

  useEffect(() => {
    let cancelled = false

    apiGet(`/hearthwood-layout/${screenId}`)
      .then((data) => {
        if (!cancelled) setSaved(data.positions || {})
      })
      .catch((error) => {
        if (!cancelled) setErrorMessage(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [screenId])

  function savedFreePositions() {
    const visibleKeys = keys.filter((key) => !(saved[key]?.hidden === true))
    const complete = visibleKeys.every(
      (key) => saved[key] && typeof saved[key].x === "number" && typeof saved[key].y === "number"
    )
    return complete ? saved : null
  }

  const freeActive = editingLayout || Boolean(savedFreePositions())

  function isHidden(key) {
    const source = layoutDraft || saved
    return source[key]?.hidden === true
  }

  function startEditing() {
    const existing = savedFreePositions()
    if (existing) {
      setLayoutDraft({ ...existing })
      setEditingLayout(true)
      return
    }

    const containerRect = containerRef.current?.getBoundingClientRect()
    const captured = {}
    for (const key of keys) {
      if (saved[key]?.hidden === true) {
        captured[key] = { hidden: true }
        continue
      }
      const el = sectionRefs.current[key]
      const rect = el?.getBoundingClientRect()
      captured[key] =
        rect && containerRect
          ? {
              x: Math.round(rect.left - containerRect.left),
              y: Math.round(rect.top - containerRect.top),
              // Capture the section's current flow-mode WIDTH too, not
              // just its position - an absolutely-positioned element
              // shrinks to fit its content instead of stretching to
              // its old parent's width, which would otherwise reflow
              // (and visibly shrink) every section the instant Edit
              // Layout is entered, breaking the "zero visual jump"
              // guarantee.
              width: Math.round(rect.width),
            }
          : { x: 0, y: 0, width: 0 }
    }
    setLayoutDraft(captured)
    setEditingLayout(true)
  }

  function cancelEditing() {
    setEditingLayout(false)
    setLayoutDraft(null)
    setErrorMessage("")
  }

  function handleSectionDragStart(e, key) {
    e.preventDefault()
    // Needed for screens whose root treats any click as "advance"
    // (StoryCinematic.jsx) - harmless no-op everywhere else. Mirrors
    // the same fix already shipped in EditInStudioLink.jsx.
    e.stopPropagation()
    const origin = layoutDraft[key]
    if (!origin || origin.hidden) return
    startPointerDrag(e, (dx, dy) => {
      setLayoutDraft((previous) => ({
        ...previous,
        [key]: { x: origin.x + dx, y: origin.y + dy, width: origin.width },
      }))
    })
  }

  function toggleHidden(key) {
    setLayoutDraft((previous) => {
      const current = previous[key]
      if (current?.hidden) {
        // Restoring: no natural flow position/width exists once free
        // mode is already active, so default back into view at the
        // container's origin with an auto width - Marc can drag it
        // wherever from there.
        return { ...previous, [key]: { x: 0, y: 0, width: 0 } }
      }
      return { ...previous, [key]: { hidden: true } }
    })
  }

  async function saveLayout() {
    setSaving(true)
    setErrorMessage("")
    try {
      const positions = Object.fromEntries(keys.map((key) => [key, layoutDraft[key]]))
      const data = await apiPut(`/hearthwood-layout/${screenId}`, { positions })
      setSaved(data.positions)
      setEditingLayout(false)
      setLayoutDraft(null)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function resetLayout() {
    setSaving(true)
    setErrorMessage("")
    try {
      await apiDelete(`/hearthwood-layout/${screenId}`)
      setSaved({})
      setEditingLayout(false)
      setLayoutDraft(null)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  // Absolutely-positioned children contribute zero height to their
  // parent - same collapse problem Market's rails have, still true on
  // these single-column screens. Hidden sections don't count toward it.
  useLayoutEffect(() => {
    if (!freeActive) {
      setHeight(null)
      return
    }
    const source = layoutDraft || saved
    const heights = keys.map((key) => {
      if (source[key]?.hidden) return 0
      const el = sectionRefs.current[key]
      const pos = source[key]
      return el && pos ? pos.y + el.offsetHeight : 0
    })
    setHeight(Math.max(0, ...heights))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeActive, layoutDraft, saved, ...deps])

  const containerStyle = freeActive ? { position: "relative", height: height ?? undefined } : undefined

  // Always wraps every section in a ref-bearing div, in BOTH flow and
  // free mode - this is the exact chicken-and-egg bug already found in
  // Market Phase 1 (the ref only existed inside the free-mode branch,
  // so there was no frame where both the flow position AND the ref
  // existed together, and startEditing() always captured {x:0,y:0}).
  function renderSection(key, content) {
    const source = layoutDraft || saved
    const hidden = source[key]?.hidden === true
    const pos = freeActive && !hidden ? source[key] : null

    if (hidden && !editingLayout) return null

    return (
      <div
        key={key}
        ref={(el) => {
          sectionRefs.current[key] = el
        }}
        className={
          pos
            ? "hw-free-layout-section"
            : hidden
              ? "hw-free-layout-section hw-free-layout-section--hidden"
              : undefined
        }
        style={
          pos
            ? { position: "absolute", left: pos.x, top: pos.y, width: pos.width || undefined }
            : undefined
        }
      >
        {editingLayout && (pos || hidden) && (
          <div className="hw-free-layout-controls">
            {!hidden && (
              <div
                className="hw-free-layout-drag-handle"
                onMouseDown={(e) => handleSectionDragStart(e, key)}
                title="Drag to reposition"
              >
                ⠿
              </div>
            )}
            <button
              type="button"
              className="hw-free-layout-hide-btn"
              onClick={(e) => {
                e.stopPropagation()
                toggleHidden(key)
              }}
              title={hidden ? "Show this section" : "Hide this section"}
            >
              {hidden ? "Show" : "Hide"}
            </button>
          </div>
        )}
        {hidden ? <div className="hw-free-layout-hidden-label">Hidden</div> : content}
      </div>
    )
  }

  return {
    loading,
    editingLayout,
    freeActive,
    saving,
    errorMessage,
    containerRef,
    containerStyle,
    startEditing,
    cancelEditing,
    saveLayout,
    resetLayout,
    toggleHidden,
    isHidden,
    renderSection,
  }
}
