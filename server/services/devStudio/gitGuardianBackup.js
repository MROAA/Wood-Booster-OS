const GIT_GUARDIAN_BACKUP_URL = "http://127.0.0.1:8002/api/gitguardian/backup"

/*
 * Ylimääräinen turvaverkko Dev Studion oman varmuuskopio+Peruuta-
 * mekanismin päällä (ks. revertCodeChangeSkill.js): pyytää Git
 * Guardiania ottamaan koko projektista checkpointin ennen kuin Dev
 * Studio kirjoittaa hyväksytyn muutoksen levylle.
 *
 * Ei koskaan estä eikä hidasta itse kirjoitusta - kutsutaan
 * odottamatta (fire-and-forget, kutsuja ei await:aa tätä), ja
 * jokainen virhe (esim. Python-taustapalvelu portissa 8002 ei ole
 * päällä) niellään hiljaa täällä. Git Guardian on nimenomaan "extra"
 * turvaverkko - Dev Studion oma Peruuta-mekanismi ei riipu tästä
 * mitenkään, joten sen puuttuminen ei saa koskaan estää tavallista
 * työskentelyä.
 */
export function triggerGitGuardianBackup() {

  fetch(GIT_GUARDIAN_BACKUP_URL, { method: "POST" })
    .then(response => {

      if (!response.ok) {

        console.warn(
          "[git-guardian] varmuuskopiopyyntö epäonnistui, status:",
          response.status,
        )

      }

    })
    .catch(error => {

      console.warn(
        "[git-guardian] varmuuskopiopyyntö ei tavoittanut palvelua:",
        error.message,
      )

    })

}
