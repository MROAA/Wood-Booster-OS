# Wood-Booster OS — Human Model

*Master Blueprint, Volume IV.*

Wood-Booster OS ei mallinna ohjelmaa — se mallintaa puusepän työn.
Tämä on hienovarainen mutta merkittävä ero: sen sijaan että
lähdettäisiin liikkeelle näkymistä kuten "Projektit", "CRM" tai
"Varasto", lähdetään liikkeelle oikeasta työpäivästä. Jokainen
moduuli, automaatio ja Spacemonkeyn toiminto syntyy tukemaan näitä
todellisia työnkulkuja — ei toisinpäin.

## Digitaalinen verstas

Koko sovellus jäljittelee oikeaa verstasta:

- **Työpöytä** — ei "dashboard", vaan työpöytä: missä työ tapahtuu.
- **Työkalupakki** — kaikki työkalut samassa paikassa (tarjous,
  kuvat, videot, AI, materiaalit, laskuri, muistikirja). Ei tarvitse
  etsiä.
- **Materiaalivarasto, projektihylly, piirustuspöytä, muistikirja,
  arkisto** — jokaiselle fyysisen verstaan osalle on digitaalinen
  vastine.

Työkalut vaihtuvat automaattisesti sen mukaan mitä käyttäjä tekee:
kun alkaa kirjoittaa tarjousta, tarjoustyökalut nousevat esiin; kun
on verstaalla, verstaan työkalut. **Käyttäjä ei vaihda ohjelmaa —
ohjelma vaihtaa työkalut.**

## Roolit, ei käyttäjät

Sama ihminen toimii päivän aikana useassa roolissa, ja järjestelmän
pitää tunnistaa kumpi on kyseessä ja näyttää sen mukaista tietoa:

| Rooli | Näkyvä konteksti |
|---|---|
| Puuseppä / verstaalla | mitat, materiaalit, työvaiheet, kuvat |
| Suunnittelija | luonnokset, materiaalivaihtoehdot, aiemmat projektit |
| Yrittäjä / toimistossa | tarjoukset, sähköpostit, asiakkaat, laskutus |
| Markkinoija / sisällöntuottaja | tuoreet kuvat, videot, luonnokset, analytiikka |
| Asiakaspalvelija | asiakashistoria, avoimet keskustelut |

Tätä kutsutaan **Utility Engine** -periaatteeksi: jokainen ominaisuus
perustellaan jatkuvasti kysymyksellä "auttaako tämä tekemään
enemmän puutyötä, säästämään aikaa vai kasvattamaan liiketoimintaa?"
— jos ei, sitä ei nosteta esiin.

## Todellinen työpäivä

Työpäivän malli, jota vasten moduulit suunnitellaan, ei ole
näkymälista vaan tapahtumaketju:

Asiakas soittaa → projekti syntyy → materiaali arvioidaan → tarjous
syntyy → rakennus alkaa → kuvat tallentuvat → some-luonnos valmistuu
→ asiakas saa ilmoituksen → portfolio päivittyy → AI oppii.

Jokainen näkymä ja automaatio sijoittuu johonkin tämän ketjun
kohtaan. Kun uutta ominaisuutta harkitaan, kysytään: mihin
työpäivän vaiheeseen tämä kuuluu, ja mitä käyttäjä siinä vaiheessa
oikeasti yrittää saada aikaan?

## Analyysikehikko uusille ominaisuuksille

Ennen kuin jotain automatisoidaan tai rakennetaan, käydään läpi:

1. Mitä käyttäjä tekee?
2. Miksi hän tekee sen?
3. Kuinka kauan se kestää?
4. Mikä siinä hidastaa?
5. Mitä siitä voidaan automatisoida?

Automaatio ei synny arvauksesta vaan havainnosta: kun sama toiminto
toistuu riittävän monta kertaa, järjestelmä huomaa sen, ehdottaa
automaatiota, käyttäjä hyväksyy, ja järjestelmä oppii.

## Hyötyverkko

Yksi käyttäjän toiminto ei saisi vaatia saman tiedon syöttämistä
moneen paikkaan. Sen sijaan yksi tapahtuma synnyttää turvallisesti
useita hyötyjä automaattisesti:

Kuva lisätään projektiin → projekti päivittyy → työvaihe päivittyy →
asiakas saa ilmoituksen → some-luonnos syntyy → portfolio päivittyy
→ AI oppii.

Tämä on sama periaate kuin projektien, asiakkaiden ja laskujen
yhdistämistyö, joka tässä sovelluksessa on jo tehty taaksepäin —
Hyötyverkko yleistää sen eteenpäin katsovaksi
suunnitteluperiaatteeksi.

## Ihminen ennen käyttöliittymää

Käyttöliittymän tavoite on tuntua rauhalliselta, ei näyttävältä.
Animaatiot ovat sallittuja mutta hillittyjä ja tehokkaita — sivu ei
saa koskaan tuntua hitaalta. Kun ohjelma avataan, tavoite ei ole
vaikuttava dashboard vaan lyhyt, olennainen tilannekuva: mikä
projekti on kesken, kuka odottaa vastausta, mikä materiaali on
loppumassa.

Katso myös: [`02_CONSTITUTION.md`](02_CONSTITUTION.md) (erityisesti
lait 1, 3, 4, 12) ja [`05_SPACEMONKEY_CODEX.md`](05_SPACEMONKEY_CODEX.md)
(miten Spacemonkey osallistuu tähän työpäivään keskeyttämättä sitä).
