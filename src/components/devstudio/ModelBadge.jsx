/*
 * Pieni merkki jossa näkyy mikä Ollama-malli tuotti tämän luonnoksen.
 * "model" voi olla null/undefined (esim. suunnitelmatasolla ennen
 * Marc-valintaa, tai käsin kirjoitettu Python-luonnos), jolloin
 * näytetään "Oletusmalli" - ei koskaan pelkkä tyhjä tila, koska ero
 * "ei vielä tiedossa" ja "oletusta käytettiin" olisi muuten epäselvä.
 */
function ModelBadge({ model }) {

  return (

    <span
      className="
        shrink-0
        rounded-full
        border
        border-[var(--wood-border)]
        px-2.5
        py-0.5
        text-[10px]
        text-[var(--wood-muted)]
      "
    >
      🧠 {model || "Oletusmalli"}
    </span>

  )

}

export default ModelBadge
