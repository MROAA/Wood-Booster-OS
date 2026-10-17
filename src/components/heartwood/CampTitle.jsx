// A Market / Headquarters title read from data/heartwood/marketUi.js
// (editable in Studio > "Market & Päämaja Texts").
import { marketUiText } from "../../data/heartwood/marketUi"

// `plain` = no rune slot; `runeInline` = rune drawn as its own glyph.
export default function UiTitle({ as: Tag = "h2", className, k, extra = null, plain = false, runeInline = false }) {
  const t = marketUiText(k)
  const useAttr = !plain && !runeInline && t.rune
  return (
    <Tag className={className} data-rune={useAttr ? t.rune : undefined} title={t.meaning || undefined}>
      {runeInline && t.rune && (
        <span className="hwq-title-rune" aria-hidden="true">
          {t.rune}
        </span>
      )}
      {t.name}
      {extra}
      {t.subtitle && <small>{t.subtitle}</small>}
    </Tag>
  )
}
