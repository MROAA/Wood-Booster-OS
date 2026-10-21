/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * System Status Text
 *
 * systemObserver.js:n raportti selkeänä suomena. Samaa tekstiä
 * käytetään keskusteluvastauksessa ja työtilaan tallennetussa
 * raportissa, jotta ne eivät voi kertoa eri asiaa.
 */

function gigabytes(bytes) {

    if (bytes === null || bytes === undefined) {
        return "?"
    }

    return (bytes / 1024 ** 3).toFixed(1).replace(".", ",")

}

function decimal(value) {

    return Number(value).toFixed(2).replace(".", ",")

}

const SERVICE_STATE_TEXT = {
    active: "käynnissä",
    inactive: "pysäytetty",
    failed: "kaatunut",
    activating: "käynnistymässä",
    deactivating: "pysähtymässä",
    unknown: "tila ei selvinnyt",
}

export function formatSystemStatus(report) {

    const memory = report.memory

    const swapUsed = memory.swapTotalBytes !== null && memory.swapFreeBytes !== null
        ? memory.swapTotalBytes - memory.swapFreeBytes
        : null

    const lines = [
        "Koneen tila (luettu nyt, tavallisena käyttäjänä, ilman root-oikeuksia):",
        `- Muisti: käytettävissä ${gigabytes(memory.availableBytes)} / ${gigabytes(memory.totalBytes)} Gt; ` +
        `swap käytössä ${gigabytes(swapUsed)} / ${gigabytes(memory.swapTotalBytes)} Gt`,
        `- Kuorma (1/5/15 min): ${decimal(report.load.load1)} / ${decimal(report.load.load5)} / ` +
        `${decimal(report.load.load15)} (${report.runtime.cpuCount} ydintä)`,
    ]

    for (const disk of report.disks) {
        lines.push(`- ${disk.label}: ${gigabytes(disk.freeBytes)} / ${gigabytes(disk.totalBytes)} Gt vapaana`)
    }

    lines.push("", "Palvelut:")

    for (const service of report.services) {
        lines.push(`- ${service.name}: ${SERVICE_STATE_TEXT[service.state] || service.state}`)
    }

    lines.push("", "Terveystarkistukset:")

    for (const endpoint of report.endpoints) {
        lines.push(
            `- ${endpoint.name}: ` +
            (endpoint.ok ? `vastaa (${endpoint.status})` : `ei vastaa${endpoint.status ? ` (${endpoint.status})` : ""}`),
        )
    }

    if (report.processes.length > 0) {
        lines.push(
            "",
            "Kehitysprosessit (vain nimi ja muisti): " +
            report.processes
                .map(process => `${process.label} ${process.count} kpl, ${gigabytes(process.rssBytes)} Gt`)
                .join("; "),
        )
    }

    lines.push(
        "",
        `Git: haara ${report.git.branch || "?"}, commit ${report.git.commit || "?"}, ` +
        `${report.git.uncommittedChanges} commitoimatonta muutosta.`,
    )

    if (report.warnings.length > 0) {
        lines.push("", "Huomiot:", ...report.warnings.map(warning => `- ${warning.text}`))
    }

    return lines.join("\n")

}
