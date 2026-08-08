# WordPress Publisher

Boosterverse-plugin joka julkaisee jo hyväksytyn (`status: "approved"`)
`BlogPostDraft`in oikeasti WordPressiin WordPress REST API:n kautta.

## Rakenne

- `tools/wordPressPublishTool.js` — kääre olemassa olevan
  `WordPressRESTTool`in (`packs/WordPressPack/tools/`) ympärillä,
  `ToolBus`-yhteensopiva.
- `skills/publishWordPressPostSkill.js` — lukee luonnoksen, kutsuu
  Toolia.
- `workflows/publishWordPressPostWorkflow.js` — ajaa skillin.
- `capabilities/`, `permissions/` — kuvaukset, eivät suorita mitään.

## Ei koskaan automaattinen

Tämä plugin suorittaa vain `PUT /api/blog-drafts/:id/publish`
-kutsun kautta, ja reitti kieltäytyy jos luonnoksen `status` ei ole
`"approved"`.

## Ympäristömuuttujat

Pakolliset oikeaa julkaisua varten:

- `WORDPRESS_BASE_URL` — sivuston osoite (esim.
  `https://esimerkki.fi`).
- `WORDPRESS_USERNAME` — WordPress-käyttäjätunnus.
- `WORDPRESS_APPLICATION_PASSWORD` — luodaan wp-adminissa kohdasta
  Käyttäjät → Profiili → Sovellussalasanat. Ei sama kuin oma
  kirjautumissalasana. Ks. `docs/wordpress-rest-flow.md`.

Valinnainen:

- `WORDPRESS_DRY_RUN=true` — testaa koko putki ilman verkkokutsuja.

Jos tunnukset puuttuvat, julkaisu epäonnistuu siististi
virhekoodilla `credentials_not_configured` — ei kaadu.

## Testaus

`node --test server/services/spacemonkey/plugins/wordpress-publisher/tests/`
