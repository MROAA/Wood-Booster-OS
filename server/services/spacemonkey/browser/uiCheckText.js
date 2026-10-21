/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * UI Check Text
 *
 * Selaintestin raportti selkeänä suomena. Samaa tekstiä käytetään
 * keskustelussa ja työtilaan tallennetussa raportissa.
 */

import path from "node:path"

const ERROR_TEXT = {
    "low-memory": "Selainta ei käynnistetty, koska käytettävissä olevaa muistia oli liian vähän.",
    "browser-unavailable": "Selainta (Playwright) ei voitu käynnistää.",
    "unknown-scenario": "Tuntematon testi.",
    timeout: "Testi ylitti aikarajan, ja selain suljettiin.",
    cancelled: "Testi keskeytettiin, ja selain suljettiin.",
}

function stepText(step) {

    switch (step.action) {
        case "open":
            return `Avaa sivu ${step.detail}`
        case "heading":
            return `Otsikko "${step.detail}" näkyy`
        case "countLinks":
            return `Projektilinkkejä näkyy: ${step.detail}`
        case "clickLink":
            return `Klikkaa linkkiä ${step.detail}`
        case "expectPath":
            return `Osoite on ${step.detail}`
        case "headingInClickedLink":
            return `Sivun otsikko "${step.detail}" vastaa klikattua projektia`
        case "screenshot":
            return `Kuvakaappaus ${path.basename(String(step.detail))}`
        default:
            return `${step.action}: ${step.detail}`
    }

}

export function formatUiCheck(report) {

    const passed = report.steps.filter(step => step.ok === true).length

    const total = report.steps.length

    const lines = [
        `Käyttöliittymätesti: ${report.scenarioName || report.scenarioId} - ` +
        (report.ok ? "LÄPÄISTY" : "EPÄONNISTUI") +
        (total > 0 ? ` (${passed}/${total} askelta)` : ""),
    ]

    if (report.error) {
        lines.push(ERROR_TEXT[report.error] || `Virhe: ${report.error}`)
    }

    report.steps.forEach((step, index) => {
        const status = step.ok === true ? "ok" : step.ok === false ? `EPÄONNISTUI: ${step.detail}` : "ohitettu"

        lines.push(`${index + 1}. ${step.ok === false || step.ok === null ? step.action : stepText(step)} - ${status}`)
    })

    lines.push(
        "",
        `Sivuvirheet: ${report.pageErrors.length} · Konsolivirheet: ${report.consoleErrors.length} · ` +
        `Epäonnistuneet pyynnöt: ${report.failedRequests.length} · Estetyt pyynnöt: ${report.blockedRequests.length}`,
    )

    for (const error of report.pageErrors.slice(0, 3)) {
        lines.push(`- Sivuvirhe: ${error}`)
    }

    for (const request of report.failedRequests.slice(0, 3)) {
        lines.push(`- Epäonnistui: ${request.url} (${request.status || request.error})`)
    }

    for (const request of report.blockedRequests.slice(0, 3)) {
        lines.push(`- Estetty: ${request.method} ${request.url}`)
    }

    lines.push(
        "",
        "Testi ajettiin eristetyssä selaimessa: uusi selainprofiili, vain HQ:n paikalliset osoitteet ja vain lukevat pyynnöt sallittu.",
    )

    return lines.join("\n")

}
