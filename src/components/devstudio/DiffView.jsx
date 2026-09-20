/*
 * Diff-näkymä. Diff on jo laskettu palvelimella (ks.
 * devCodeChangeStudio.js:n diffLines-kutsu), joten frontend ei
 * tarvitse omaa diff-kirjastoa - vain väritys valmiille
 * {added, removed, value, count}-paloille.
 *
 * Jaettu DevChatPanel.jsx:n ja VerificationResultViewer.jsx:n kesken,
 * jotta diffin piirtotapa ei voi eriytyä kahdeksi hieman erilaiseksi
 * toteutukseksi.
 */
import Prism from "prismjs"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-json"
import "prismjs/components/prism-python"
import "prismjs/components/prism-markdown"

const LANGUAGE_BY_EXTENSION = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  md: "markdown",
  css: "css",
  html: "markup",
  py: "python",
}

function resolveGrammar(filePath) {

  if (!filePath) {

    return null

  }

  const extension = filePath.split(".").pop().toLowerCase()
  const langId = LANGUAGE_BY_EXTENSION[extension]

  if (!langId || !Prism.languages[langId]) {

    return null

  }

  return { langId, grammar: Prism.languages[langId] }

}

function DiffView({ diff, filePath }) {

  if (!diff || diff.length === 0) {

    return null

  }

  const resolved = resolveGrammar(filePath)

  return (

    <pre
      className="
        wood-scroll
        max-h-72
        overflow-auto
        rounded-lg
        border
        border-[var(--wood-border)]
        bg-[var(--wood-bg)]
        p-3
        text-xs
        leading-relaxed
        whitespace-pre-wrap
      "
    >

      {
        diff.map(
          (chunk, index) => (

            <span
              key={index}
              className={
                chunk.added
                  ? "block bg-emerald-950/40 text-emerald-300"
                  : chunk.removed
                    ? "block bg-red-950/40 text-red-300 line-through"
                    : "block text-[var(--wood-muted)]"
              }
            >

              {
                (
                  chunk.added
                    ? "+ "
                    : chunk.removed
                      ? "- "
                      : "  "
                )
              }

              {
                resolved
                  ? (
                    <code
                      className="wood-code"
                      dangerouslySetInnerHTML={
                        {
                          __html: Prism.highlight(chunk.value, resolved.grammar, resolved.langId),
                        }
                      }
                    />
                  )
                  : chunk.value
              }

            </span>

          )
        )
      }

    </pre>

  )

}

export default DiffView
