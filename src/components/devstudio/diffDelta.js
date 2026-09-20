/*
 * Tiivis "+N -M" -rivimäärä koko diffille, käytetään SetBubble.jsx:n
 * monitiedostosuunnitelman kompaktissa otsikkorivissä. Oma tiedostonsa
 * (ei osa DiffView.jsx:ää) koska DiffView.jsx on komponentti - jos
 * tämä olisi siellä nimettynä exporttina komponentin rinnalla, Fast
 * Refresh ei enää toimisi kummallekaan (oxlint:
 * react(only-export-components)).
 */

function countLines(value) {

  if (!value) {

    return 0

  }

  return value.split("\n").filter(line => line.length > 0).length

}

/*
 * diffLines (npm-paketti "diff") laskee jo jokaiselle palalle valmiin
 * count-kentän - summataan se suoraan (vastaa git diff --stat
 * -semantiikkaa: yksi 40 rivin uudelleenkirjoitus on yksi "pala" mutta
 * 40 riviä, ei "yksi muutos"). countLines on varakeino siltä varalta
 * että jokin kutsuja joskus rakentaisi paloja ilman count-kenttää.
 */
export function computeDiffDelta(diff) {

  if (!Array.isArray(diff)) {

    return { added: 0, removed: 0 }

  }

  return diff.reduce(
    (totals, chunk) => ({
      added: totals.added + (chunk.added ? (chunk.count ?? countLines(chunk.value)) : 0),
      removed: totals.removed + (chunk.removed ? (chunk.count ?? countLines(chunk.value)) : 0),
    }),
    { added: 0, removed: 0 },
  )

}
