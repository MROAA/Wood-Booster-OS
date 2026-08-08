# Instagram Graph API -kutsusekvenssi

Meta Content Publishing API. Tarkista rajapinnan tarkka tila Metan
omasta dokumentaatiosta ennen käyttöä - alustan käyttäytyminen
(erityisesti video/Reels-osuus) on muuttunut ajan myötä.

## Yksi kuva

1. `POST /{ig-user-id}/media` — `image_url`, `caption` → `{id}`
2. `POST /{ig-user-id}/media_publish` — `creation_id` → `{id}`

## Karuselli (2-10 kohdetta)

1. Jokainen kohde: `POST /{ig-user-id}/media`,
   `is_carousel_item=true`, `image_url` tai (`video_url` +
   `media_type=VIDEO`) → `{id: childId}`
2. Kokoava: `POST /{ig-user-id}/media`, `media_type=CAROUSEL`,
   `children=[childId, ...]`, `caption`
3. `POST /{ig-user-id}/media_publish`

## Yksi video (Reels)

1. `POST /{ig-user-id}/media` — `video_url`, `caption`,
   `media_type=REELS` → `{id}`. **Asynkroninen** - Meta transkoodaa
   videon.
2. Pollaa `GET /{id}?fields=status_code` kunnes `FINISHED`
   (`IN_PROGRESS` / `FINISHED` / `ERROR` / `EXPIRED`, aikakatkaisu
   ~120s).
3. `POST /{ig-user-id}/media_publish`

## Julkisen URL:n vaatimus

Meta hakee `image_url`/`video_url`-osoitteen itse palvelimiltaan -
`localhost` tai paikallinen LAN-osoite ei toimi. Tämä sovellus
julkaisee jo olemassa olevan `/uploads/projects/{id}/{tiedosto}`
-staattisen polun kautta, mutta vaatii `PUBLIC_BASE_URL`-muuttujan
(esim. Cloudflare Tunnel / ngrok, tai oikea julkinen julkaisu).
Paikallinen tavoitettavuustarkistus (`HEAD`-pyyntö tästä koneesta)
todistaa vain että osoite toimii tästä koneesta käsin - EI että
Metan palvelimet oikeasti tavoittavat sen. Suositus: avaa
muodostettu URL puhelimella mobiilidatalla (ei kotiverkossa) ennen
ensimmäistä oikeaa julkaisua.

## Rajoitukset

Instagram sallii korkeintaan ~25 julkaisua per IG-tili rullaavan
24h aikana tämän rajapinnan kautta. Tämä toteutus ei laske rajaa
itse - Metan oma virheviesti palautetaan sellaisenaan.
