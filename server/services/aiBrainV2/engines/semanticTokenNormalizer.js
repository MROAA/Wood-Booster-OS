/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SEMANTIC TOKEN NORMALIZER V2.1

Vastuut:
- normalisoi tekstin hakua varten
- tunnistaa Wood-Booster omat termit
- yhdistää kirjoitusasut samaan käsitteeseen

=====================================
*/


const TOKEN_ALIASES = {

  spacmonkey:
    "spacemonkey",

  spacemonkey:
    "spacemonkey",

  spacemonkeyai:
    "spacemonkey",


}



function normalizeSemanticText(value) {

  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9_\-\s]/gi,
      " ",
    )
    .replace(
      /[_\-]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()

}



function normalizeToken(value) {

  return normalizeSemanticText(value)
    .replace(
      /\s+/g,
      "",
    )

}



function expandSemanticToken(value) {

  const token =
    normalizeToken(value)


  if (!token) {
    return []
  }


  const normalizedAlias =
    TOKEN_ALIASES[token] ||
    token


  const result =
    new Set()


  result.add(
    normalizedAlias,
  )


  if (
    normalizedAlias ===
    "spacemonkey"
  ) {

    result.add(
      "ai",
    )

    result.add(
      "identity",
    )

  }


  return [
    ...result,
  ]

}



function expandSemanticTokens(tokens) {

  const result =
    new Set()


  for (
    const token
    of Array.isArray(tokens)
      ? tokens
      : []
  ) {

    for (
      const expanded
      of expandSemanticToken(token)
    ) {

      result.add(
        expanded,
      )

    }

  }


  return [
    ...result,
  ]

}



export {
  expandSemanticToken,
  expandSemanticTokens,
  normalizeSemanticText,
}
