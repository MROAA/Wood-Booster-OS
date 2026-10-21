/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Protected Paths
 *
 * Polut joita Spacemonkey ei listaa, lue eikä indeksoi tavallisena
 * projektitietona: salaisuudet, avaimet, tietokannat, varmuuskopiot,
 * yksityiset turvamuistiinpanot ja riippuvuushakemistot. Käytetään
 * suhteellisiin JA absoluuttisiin polkuihin - tarkistus katsoo
 * jokaista polun osaa.
 */

const PROTECTED_SEGMENTS = new Set([
    ".git",
    "node_modules",
    ".hearthwood-security",
    ".ssh",
    ".gnupg",
    "secrets",
    "secret",
    "credentials",
    "backups",
    "backup",
])

const PROTECTED_FILE_PATTERNS = [
    /^\.env(\..*)?$/i,
    /^\.npmrc$/i,
    /^\.netrc$/i,
    /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
    /\.(pem|key|p12|pfx|keystore|jks|kdbx)$/i,
    /\.(db|sqlite|sqlite3|db-journal|db-wal)$/i,
    /(^|[._-])(secret|secrets|credential|credentials|token|tokens)([._-]|$)/i,
]

function isProtectedPath(filePath) {

    const parts = String(filePath || "")
        .split(/[\\/]+/)
        .filter(Boolean)

    if (parts.length === 0) {
        return false
    }

    if (parts.some(part => PROTECTED_SEGMENTS.has(part.toLowerCase()))) {
        return true
    }

    const fileName = parts[parts.length - 1]

    return PROTECTED_FILE_PATTERNS.some(pattern => pattern.test(fileName))

}

export { isProtectedPath }
