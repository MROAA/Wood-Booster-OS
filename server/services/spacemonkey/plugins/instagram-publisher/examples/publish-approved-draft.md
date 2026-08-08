# Esimerkki: julkaise hyväksytty luonnos

Edellyttää että luonnos on jo `status: "approved"`
(`PUT /api/social-drafts/:id/approve`).

```bash
curl -X PUT http://localhost:3001/api/social-drafts/1/publish
```

Onnistuessa (`200`):

```json
{
  "id": 1,
  "status": "published",
  "publishedPostId": "17912345678901234",
  "publishedPermalink": "https://www.instagram.com/p/xxxxxxxxxxx/",
  "publishedAt": "2026-08-08T10:00:00.000Z"
}
```

Ilman tunnuksia (`422`):

```json
{
  "error": "Instagram-tiliä ei ole yhdistetty. Aseta INSTAGRAM_USER_ID ja META_PAGE_ACCESS_TOKEN (tai META_USER_ACCESS_TOKEN) ympäristömuuttujiksi.",
  "code": "credentials_not_configured",
  "draft": { "id": 1, "status": "publish_failed", "...": "..." }
}
```

Testaus ilman Meta-yhteyttä:

```bash
INSTAGRAM_DRY_RUN=true PUBLIC_BASE_URL=http://localhost:3001 npm start
curl -X PUT http://localhost:3001/api/social-drafts/1/publish
```
