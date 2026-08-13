# Instagram Publisher

Boosterverse-plugin joka julkaisee jo hyväksytyn (`status: "approved"`)
`SocialPostDraft`in oikeasti Instagramiin Meta Graph API:n kautta.

## Rakenne

- `tools/instagramGraphAPITool.js` — oikea Graph API -kutsu (media
  container → julkaisu). `ToolBus`-yhteensopiva.
- `skills/publishInstagramPostSkill.js` — lukee luonnoksen ja sen
  valitut tiedostot, rakentaa julkiset URL:t, kutsuu Toolia.
- `workflows/publishInstagramPostWorkflow.js` — ajaa skillin.
- `capabilities/`, `permissions/` — kuvaukset, eivät suorita mitään.

## Ei koskaan automaattinen

Tämä plugin ei koskaan itse päätä julkaista. Se suorittaa vain
`PUT /api/social-drafts/:id/publish` -kutsun kautta, ja reitti
kieltäytyy jos luonnoksen `status` ei ole `"approved"` —
`server/ai-knowledge/AI_BRAIN_705_SOCIAL_MEDIA_INTEGRATION.txt`.

## Ympäristömuuttujat

Pakolliset oikeaa julkaisua varten:

- `INSTAGRAM_USER_ID` — Instagram Business -tilin ID (ei @-tunnus).
- `META_PAGE_ACCESS_TOKEN` (tai `META_USER_ACCESS_TOKEN`) — Facebook-
  sivun access token, jolla on `instagram_content_publish`-oikeus.
- `PUBLIC_BASE_URL` — julkinen HTTPS-osoite josta `/uploads/...`
  on tavoitettavissa (Meta hakee media-URL:t itse palvelimeltaan,
  `localhost` ei toimi). Ks. `docs/graph-api-flow.md`.

Valinnaiset:

- `META_GRAPH_API_VERSION` (oletus `v21.0`).
- `INSTAGRAM_DRY_RUN=true` — testaa koko putki ilman verkkokutsuja.

Jos `INSTAGRAM_USER_ID`/access token puuttuu, julkaisu epäonnistuu
siististi virhekoodilla `credentials_not_configured` — ei kaadu.

## Testaus

`node --test server/services/spacemonkey/plugins/instagram-publisher/tests/`
