/*
 * Tiivistää `gh pr view --json statusCheckRollup`:n palauttaman
 * listan yhdeksi tilaksi Dev Studion näkymää varten. Lista voi
 * sisältää sekä uudempaa CheckRun- (status/conclusion) että
 * vanhempaa StatusContext-muotoa (state) - GitHubin oma rajapinta
 * palauttaa kumpaa tahansa __typename:n mukaan, joten molemmat
 * muodot käsitellään.
 *
 * Tyhjä lista -> "none" on täysin normaali tulos (pelkkä
 * dokumenttimuutos, polkusuodatettu työnkulku, tai PR joka on avattu
 * ennen tätä ominaisuutta) - ei koskaan tulkita virheeksi.
 */

const PENDING_CHECK_RUN_STATUSES = new Set([
    "QUEUED",
    "IN_PROGRESS",
    "PENDING",
    "WAITING",
    "REQUESTED",
])

const FAILING_CHECK_RUN_CONCLUSIONS = new Set([
    "FAILURE",
    "CANCELLED",
    "TIMED_OUT",
    "ACTION_REQUIRED",
    "STARTUP_FAILURE",
])

const PENDING_STATUS_CONTEXT_STATES = new Set([
    "PENDING",
    "EXPECTED",
])

const FAILING_STATUS_CONTEXT_STATES = new Set([
    "FAILURE",
    "ERROR",
])

function isPending(check) {

    if (check.status) {
        return PENDING_CHECK_RUN_STATUSES.has(check.status)
    }

    return PENDING_STATUS_CONTEXT_STATES.has(check.state)

}

function isFailing(check) {

    if (check.conclusion) {
        return FAILING_CHECK_RUN_CONCLUSIONS.has(check.conclusion)
    }

    if (check.state) {
        return FAILING_STATUS_CONTEXT_STATES.has(check.state)
    }

    return false

}

export function deriveCheckStatusSummary(statusCheckRollup) {

    const checks = Array.isArray(statusCheckRollup) ? statusCheckRollup : []

    if (checks.length === 0) {
        return "none"
    }

    if (checks.some(isPending)) {
        return "pending"
    }

    if (checks.some(isFailing)) {
        return "failing"
    }

    return "passing"

}
