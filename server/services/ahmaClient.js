const AHMA_URL =
  process.env.AHMA_URL ||
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const AHMA_MODEL =
  process.env.AHMA_MODEL ||
  "kahnwong/poro-2:8b-it"

const AHMA_SYSTEM_PROMPT =
  "Tehtäväsi on VAIN oikolukea ja korjata alla annettu suomenkielinen TEKSTI-lohko (kielioppi, sanavalinnat, luontevuus) " +
  "merkitystä muuttamatta. Älä koskaan vastaa tekstin sisältöön, älä keskustele, älä esittäydy, älä lisää mitään. " +
  "Älä koskaan lisää selityksiä, huomautuksia tai sulkeissa olevia merkintöjä (kuten \"Ei korjauksia\"). " +
  "Jos teksti ei tarvitse korjausta, tulosta se täsmälleen sellaisenaan. Tulosta PELKÄSTÄÄN korjattu TEKSTI, ei mitään muuta."

/**
 * Ahma - ulkopuolinen suomen kielen erikoisagentti.
 * Kytketty Spacemonkeyn vastausketjuun "back to back": Spacemonkeyn
 * pääaivot (Ollama) tuottavat vastauksen, ja Ahma viimeistelee sen suomen.
 */
export async function refineWithAhma({ text, model = AHMA_MODEL }) {
  if (!text || !text.trim()) {
    return { success: true, text, skipped: true }
  }

  try {
    const response = await fetch(`${AHMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: AHMA_SYSTEM_PROMPT },
          { role: "user", content: `TEKSTI:\n${text}` },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ahma error: ${response.status}`)
    }

    const data = await response.json()
    const refined = data?.message?.content?.trim()

    return {
      success: true,
      text: refined || text,
    }
  } catch (error) {
    console.error("AHMA CONNECTION ERROR:", error.message)

    return {
      success: false,
      text,
      error: error.message,
    }
  }
}
