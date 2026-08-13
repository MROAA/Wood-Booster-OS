# Esimerkki: julkaise hyväksytty blogiluonnos

Edellyttää että luonnos on jo `status: "approved"`
(`PUT /api/blog-drafts/:id/approve`).

```bash
curl -X PUT http://localhost:3001/api/blog-drafts/1/publish
```

Onnistuessa (`200`):

```json
{
  "id": 1,
  "status": "published",
  "wordpressPostId": "42",
  "wordpressPermalink": "https://esimerkki.fi/?p=42",
  "publishedAt": "2026-08-08T10:00:00.000Z"
}
```

Ilman tunnuksia (`422`):

```json
{
  "error": "WordPress-sivustoa ei ole yhdistetty. Aseta WORDPRESS_BASE_URL, WORDPRESS_USERNAME ja WORDPRESS_APPLICATION_PASSWORD ympäristömuuttujiksi.",
  "code": "credentials_not_configured",
  "draft": { "id": 1, "status": "publish_failed", "...": "..." }
}
```

Testaus ilman WordPress-yhteyttä:

```bash
WORDPRESS_DRY_RUN=true npm start
curl -X PUT http://localhost:3001/api/blog-drafts/1/publish
```
