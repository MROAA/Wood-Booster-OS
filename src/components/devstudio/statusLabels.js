/*
 * Yhteiset tila-selitteet Dev Studion kaikille näkymille (Chat,
 * Useampi tiedosto, Historia). Aiemmin nämä olivat lähes identtisinä
 * kopioina DevChatPanel.jsx:ssä ja SetBubble.jsx:ssä - Historia
 * tarvitsee kaikki neljä yhdessä paikassa, joten "Yksi totuus" sen
 * sijaan että syntyisi kolmas kopio.
 */

export const DRAFT_STATUS_LABELS = {

  draft: "Odottaa hyväksyntää",

  approved: "Hyväksytty",

  rejected: "Hylätty",

  written: "Kirjoitettu levylle",

  write_failed: "Kirjoitus epäonnistui",

  conflict: "Tiedosto muuttunut",

  reverted: "Peruutettu",

  revert_conflict: "Peruutus estetty (tiedosto muuttunut)",

  revert_failed: "Peruutus epäonnistui",

  pr_open: "Pull Request avattu",

  pr_failed: "Pull Requestin luonti epäonnistui",

  pr_merged: "Yhdistetty (merged)",

  pr_closed: "Suljettu ilman yhdistämistä",

  pr_revert_open: "Peruutus-PR avattu",

  pr_revert_failed: "Peruutus-PR:n luonti epäonnistui",

  pr_revert_merged: "Peruutus yhdistetty",

  pr_revert_closed: "Peruutus-PR suljettu ilman yhdistämistä",

}

/*
 * Tilat joissa CodeChangeDraftSet vielä odottaa Marcin toimenpidettä -
 * käytetään päättämään mitkä paketit palautetaan interaktiivisina
 * kupliina chatin uudelleenlatauksen jälkeen (ks. ChatPanel.jsx ja
 * MultiFileChatPanel.jsx). "written" ja "rejected" ovat lopputiloja,
 * eivät koskaan tässä joukossa.
 */
export const NON_TERMINAL_SET_STATUSES = new Set([
  "planning",
  "plan_ready",
  "draft",
  "approved",
  "partial_write_failed",
  "pr_failed",
])

export const SET_STATUS_LABELS = {

  plan_ready: "Suunnitelma odottaa hyväksyntää",

  draft: "Odottaa hyväksyntää",

  approved: "Hyväksytty",

  rejected: "Hylätty",

  written: "Kirjoitettu levylle",

  partial_write_failed: "Osa epäonnistui",

  pr_open: "Pull Request avattu",

  pr_failed: "Pull Requestin luonti epäonnistui",

  pr_merged: "Yhdistetty (merged)",

  pr_closed: "Suljettu ilman yhdistämistä",

  pr_revert_open: "Peruutus-PR avattu",

  pr_revert_failed: "Peruutus-PR:n luonti epäonnistui",

  pr_revert_merged: "Peruutus yhdistetty",

  pr_revert_closed: "Peruutus-PR suljettu ilman yhdistämistä",

}

export const FILE_STATUS_LABELS = {

  blocked: "Estetty",

  planned: "Suunniteltu",

  generated: "Valmis tarkistettavaksi",

  generate_failed: "Generointi epäonnistui",

  written: "Kirjoitettu",

  pr_written: "Kirjoitettu (PR:ssä)",

  write_failed: "Kirjoitus epäonnistui",

  conflict: "Tiedosto muuttunut",

  reverted: "Peruutettu",

  revert_conflict: "Peruutus estetty (tiedosto muuttunut)",

  revert_failed: "Peruutus epäonnistui",

}

export const TEST_STATUS_DISPLAY = {

  passed: { icon: "✓", label: "Testi läpäisi", className: "text-emerald-400" },

  failed: { icon: "✗", label: "Testi epäonnistui", className: "text-red-400" },

  timeout: { icon: "⏱", label: "Testi aikakatkaistiin", className: "text-amber-400" },

  error: { icon: "⚠", label: "Tarkistus epäonnistui", className: "text-amber-400" },

  skipped: { icon: "—", label: "Ei toiminnallista testiä", className: "text-[var(--wood-muted)]" },

  vacuous: { icon: "?", label: "Testi ei todista mitään", className: "text-amber-400" },

}

/*
 * PR:n GitHub Actions -tarkistusten tila (ks. checkPullRequestStatus/
 * deriveCheckStatusSummary.js). "none" on täysin normaali tulos, ei
 * virhe - näytetään silti neutraalilla värillä eikä piiloteta
 * kokonaan, jotta ero "ei vielä tarkistettu" ja "tarkistettu, ei
 * tarkistuksia" -tilojen välillä ei häviä.
 */
export const CHECK_STATUS_LABELS = {

  passing: { icon: "✓", label: "Tarkistukset läpäisty", className: "text-emerald-400" },

  failing: { icon: "✗", label: "Tarkistukset epäonnistuivat", className: "text-red-400" },

  pending: { icon: "⏳", label: "Tarkistukset käynnissä", className: "text-amber-400" },

  none: { icon: "—", label: "Ei tarkistuksia", className: "text-[var(--wood-muted)]" },

}
