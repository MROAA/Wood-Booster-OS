import { execFile } from "node:child_process"

import { promisify } from "node:util"

import { PROJECT_ROOT } from "../spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js"

const execFileAsync = promisify(execFile)

/*
 * "Tarkista PR:n tila" -toiminnon taustalla oleva pelkkä luku - ei
 * skilli/workflow (sama kategoria kuin verifyProposedChange.js/
 * triggerGitGuardianBackup()), koska tämä ei koskaan kirjoita mitään,
 * ei koske tiedostoja, eikä tarvitse worktreetä - pelkkä `gh pr view`
 * jo kirjautuneen gh:n kautta, ajettuna suoraan PROJECT_ROOTissa.
 * Ei automaattista pollausta/taustatyötä - tarkistetaan vain kun
 * ihminen sitä nimenomaan pyytää.
 */
export async function checkPullRequestStatus(prNumber) {

    const { stdout } = await execFileAsync(
        "gh",
        ["pr", "view", String(prNumber), "--json", "state,url"],
        { cwd: PROJECT_ROOT, timeout: 15000, maxBuffer: 1_000_000, env: process.env },
    )

    const { state, url } = JSON.parse(stdout)

    return { state, url }

}
