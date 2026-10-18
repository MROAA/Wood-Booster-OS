// Hearthwood - fast hover explanations (Marc 2026-10-18: "selitys kun
// hoveroi kursorilla tulee liian hitaasti" on the battlefield).
//
// Purpose: the browser's own `title` tooltip waits ~1 s and can't be sped
// up. FastTips takes over every `title` inside one container: on hover it
// lifts the element's title into its own themed pop-up, shown almost at once
// (and instantly when moving from one explained thing to the next), and puts
// the title back when the pointer leaves - so markup, tests and screen
// readers keep the plain `title` attribute as the single source of text.
//
// Usage: <FastTips containerRef={ref} /> next to the container it serves.
// Dependencies: React + react-dom portal (the pop-up lives on <body>, so a
// transformed ancestor can't shift or clip it).
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const SHOW_DELAY_MS = 80 // first tip; moving between tips is instant
const GAP = 8

export default function FastTips({ containerRef }) {
  const [tip, setTip] = useState(null) // { text, x, y, place }
  const current = useRef(null) // { el, text }
  const timer = useRef(null)
  const popRef = useRef(null)

  useEffect(() => {
    const root = containerRef?.current
    if (!root) return undefined

    const restore = () => {
      const c = current.current
      if (c && c.el.isConnected && !c.el.getAttribute("title")) c.el.setAttribute("title", c.text)
      current.current = null
    }
    const hide = () => {
      clearTimeout(timer.current)
      restore()
      setTip(null)
    }
    const place = (el, text) => {
      const r = el.getBoundingClientRect()
      setTip({ text, x: r.left + r.width / 2, top: r.top, bottom: r.bottom })
    }
    const onOver = (e) => {
      const el = e.target instanceof Element ? e.target.closest("[title]") : null
      if (!el || !root.contains(el)) return
      const text = el.getAttribute("title")
      if (!text) return
      if (current.current?.el === el) return
      const wasOpen = !!current.current
      restore()
      // lift the title so the slow native tooltip never appears
      el.removeAttribute("title")
      current.current = { el, text }
      clearTimeout(timer.current)
      if (wasOpen) place(el, text)
      else timer.current = setTimeout(() => current.current?.el === el && place(el, text), SHOW_DELAY_MS)
    }
    const onOut = (e) => {
      const c = current.current
      if (!c) return
      const to = e.relatedTarget
      if (to instanceof Node && c.el.contains(to)) return
      // moving straight onto another explained thing: onOver takes over
      const next = to instanceof Element ? to.closest("[title]") : null
      if (next && root.contains(next) && next !== c.el) return
      hide()
    }
    root.addEventListener("pointerover", onOver)
    root.addEventListener("pointerout", onOut)
    root.addEventListener("pointerdown", hide)
    window.addEventListener("scroll", hide, true)
    return () => {
      root.removeEventListener("pointerover", onOver)
      root.removeEventListener("pointerout", onOut)
      root.removeEventListener("pointerdown", hide)
      window.removeEventListener("scroll", hide, true)
      hide()
    }
  }, [containerRef])

  // Keep the pop-up on screen: above the element when there's room below
  // too little, centred, clamped to the viewport edges.
  const [pos, setPos] = useState(null)
  useEffect(() => {
    if (!tip || !popRef.current) {
      setPos(null)
      return
    }
    const w = popRef.current.offsetWidth
    const h = popRef.current.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const below = tip.bottom + GAP + h <= vh - 4
    const top = below ? tip.bottom + GAP : Math.max(4, tip.top - GAP - h)
    const left = Math.min(vw - w - 6, Math.max(6, tip.x - w / 2))
    setPos({ left, top })
  }, [tip])

  if (!tip) return null
  return createPortal(
    <div
      ref={popRef}
      className="hw-fast-tip"
      role="tooltip"
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
      data-ready={pos ? "true" : undefined}
    >
      {tip.text}
    </div>,
    document.body,
  )
}
