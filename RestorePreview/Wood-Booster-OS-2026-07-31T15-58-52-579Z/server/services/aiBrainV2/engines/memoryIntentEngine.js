/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MEMORY INTENT ENGINE v1.0

Vastuut:

- tunnistaa suorat muistipyynnöt
- ei käytä kielimallia
- ei kirjoita tietokantaan
- ei hyväksy muistoja
- palauttaa vain päätöksen

Esimerkkejä:

"Muista tämä: ..."
"Tallenna tämä muistiin: ..."
"Pidä tämä muistissa: ..."

Tämä moduuli valmistaa Memory Pipelinea.

=====================================
*/


const MEMORY_COMMAND_PATTERNS = [
  /^muista tämä\s*[:,-]?\s*/i,

  /^muista tämä pysyvästi\s*[:,-]?\s*/i,

  /^muista pysyvästi\s*[:,-]?\s*/i,

  /^tallenna tämä muistiin\s*[:,-]?\s*/i,

  /^tallenna muistiin\s*[:,-]?\s*/i,

  /^pidä tämä muistissa\s*[:,-]?\s*/i,

  /^laita tämä muistiin\s*[:,-]?\s*/i,
]


function normalizeText(
  value,
) {
  return String(
    value || "",
  )
    .trim()
}


function detectMemoryIntent(
  message,
) {
  const text =
    normalizeText(
      message,
    )

  if (!text) {
    return {
      matched:
        false,

      content:
        null,

      confidence:
        0,
    }
  }


  for (
    const pattern
    of MEMORY_COMMAND_PATTERNS
  ) {

    if (
      pattern.test(text)
    ) {

      const content =
        text
          .replace(
            pattern,
            "",
          )
          .trim()


      return {
        matched:
          true,

        content:
          content ||
          null,

        confidence:
          1,

        reason:
          "Käyttäjä antoi suoran muistipyynnön.",
      }
    }
  }


  return {
    matched:
      false,

    content:
      null,

    confidence:
      0,

    reason:
      "Ei tunnistettu muistipyyntöä.",
  }
}


export {
  detectMemoryIntent,
}
