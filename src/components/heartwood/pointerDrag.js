// Marc: "haluan tämän raahaa mihin tahansa tasolle" (I want this at
// the drag-it-anywhere level). Same proven, dependency-free pointer-
// drag pattern already used in this monorepo for the Boosterverse
// Desktop's window dragging (src/components/desktop/WindowFrame.jsx's
// own private `startDrag`) - kept as its own small copy here rather
// than importing across the Desktop/Hearthwood boundary, since that
// function isn't exported and the two features have no reason to
// otherwise depend on each other.
//
// mousedown on a drag handle calls this with the pointer event and a
// callback; every mousemove until the next mouseup reports the (dx,
// dy) delta from the drag's start point, for live visual feedback
// while dragging - the caller decides what a delta actually means
// (move an element, resize one, etc).
export function startPointerDrag(e, onDelta) {
  const startX = e.clientX
  const startY = e.clientY

  function handleMouseMove(moveEvent) {
    onDelta(moveEvent.clientX - startX, moveEvent.clientY - startY)
  }

  function handleMouseUp() {
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)
}
