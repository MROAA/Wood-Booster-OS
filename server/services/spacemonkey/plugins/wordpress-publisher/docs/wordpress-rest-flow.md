# WordPress REST -julkaisu

## Sovellussalasana (Application Password)

WordPress 5.6+:ssa sisäänrakennettu tunnistautumistapa erillisille
sovelluksille, ei OAuth-kirjautumista:

1. Kirjaudu wp-adminiin.
2. Käyttäjät → Profiili (oma tili) → "Sovellussalasanat".
3. Anna nimi (esim. "Wood-Booster OS"), luo.
4. Kopioi näytetty salasana `WORDPRESS_APPLICATION_PASSWORD`:ksi
   (näytetään vain kerran).

Tämä yhdistetään käyttäjätunnukseen (`WORDPRESS_USERNAME`) HTTP
Basic Authina jokaisessa pyynnössä
(`packs/WordPressPack/tools/WordPressRESTTool.js`).

## Käytetyt kentät

`POST/PUT wp-json/wp/v2/posts` (tai `/posts/{id}` päivitykselle):

- `title` — otsikko (WordPress kääntää tämän `title.rendered`iksi).
- `content` — sisältö (HTML tai pelkkä teksti, WP renderöi).
- `excerpt` — valinnainen ote.
- `status` — `publish` (julkinen heti), `draft` (WP-luonnos, ei
  näy sivustolla), `future` (ajastettu — vaatii myös `date`-kentän,
  ei toteutettu tässä versiossa).

Onnistunut vastaus sisältää numeerisen `id`:n ja `link`-kentän
(pysyvä osoite). Virhevastauksessa on `code`/`message`-kentät eikä
numeerista `id`:tä — tämä on ainoa tapa erottaa onnistuminen
epäonnistumisesta, koska `WordPressRESTTool` ei tarkista
`response.ok`:ta itse.

## Uudelleenjulkaisu

Jos `BlogPostDraft.wordpressPostId` on jo asetettu (aiempi
julkaisu onnistui), seuraava `/publish`-kutsu päivittää saman
artikkelin sen sijaan että loisi uuden.
