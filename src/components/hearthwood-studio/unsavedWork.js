// Hearthwood Dev Studio - unsaved work per workspace tab.
//
// Purpose: a tab must not be closed (nor the page left) silently while it
// holds work that is not in the game: a previewed change not yet applied
// or discarded, or a filled-in form not yet saved.
// How: usePatchPreview reports a pending preview; each editor reports its
// own "N changed" count (the same number it shows the user) and each
// compose form reports filled-in fields. Every tab (StudioPane) provides
// its own tracker, so the workspace knows per tab whether closing loses work.
// Not reported: StoryWriter drafts - it keeps them itself (localStorage,
// per entry) and gives them back after a restart.
//
// Public API: UnsavedWorkProvider, useReportUnsaved(dirty),
//   createUnsavedTracker(onChange)
import { createContext, useContext, useEffect, useId } from "react"

const UnsavedWorkContext = createContext(null)

export const UnsavedWorkProvider = UnsavedWorkContext.Provider

/** Report whether this component currently holds unsaved work. */
export function useReportUnsaved(dirty) {
  const report = useContext(UnsavedWorkContext)
  const key = useId()
  useEffect(() => {
    if (!report) return undefined
    report(key, Boolean(dirty))
    return () => report(key, false)
  }, [report, key, dirty])
}

/** Collects reports; calls onChange(true/false) only when the answer flips. */
export function createUnsavedTracker(onChange) {
  const holders = new Set()
  return (key, dirty) => {
    const before = holders.size > 0
    if (dirty) holders.add(key)
    else holders.delete(key)
    const after = holders.size > 0
    if (before !== after) onChange(after)
  }
}
