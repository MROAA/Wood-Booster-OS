# Wood-Booster HQ — Constitution (Perustuslaki)

*Master Blueprint, Volume II.*

Nämä ovat Wood-Booster HQ:n muuttumattomat suunnitteluperiaatteet.
Ne ohjaavat projektia riippumatta siitä, miltä teknologia näyttää
10, 50 tai 100 vuoden kuluttua. Kun uusi ominaisuus, näkymä tai
automaatio suunnitellaan, se testataan näitä lakeja vasten — jos se
on ristiriidassa jonkin lain kanssa, laki voittaa.

Tämä dokumentti on siirretty ja koostettu tiedostosta
`src/data/spacemonkey/Perustuslaki.md`, joka sisälsi alun perin
sekä Vision-sisällön että tämän Constitutionin samassa tiedostossa.
Useita lyhyempiä, päällekkäisiä "10 lakia" -listoja on lähetetty
myöhemmin osana Master Blueprint -keskustelua (esim. "Ihminen ennen
tekoälyä", "Yksi tieto", "Offline First", "AI ehdottaa, ihminen
päättää") — ne kaikki sisältyvät jo tähän 28-kohtaiseen listaan,
joka on yksityiskohtaisin ja siksi kanoninen versio. Tämä tiedosto
on ainoa lähde ("Yksi totuus", laki 5) — älä ylläpidä toista
kopiota Constitutionista muualla.

---

1. **Ihminen ennen ohjelmistoa** — ohjelma mukautuu käyttäjän
   työskentelytapaan, käyttäjän ei tarvitse opetella monimutkaista
   ohjelmaa. (Kattaa myös myöhemmin sanoitetun version "ihminen
   ennen tekoälyä" — koskee sekä ohjelmistoa että AI:ta.)

2. **Työ ennen ominaisuuksia** — jokainen uusi ominaisuus vastaa
   kysymykseen "nopeuttaako tämä oikeasti käyttäjän työtä?" Jos
   vastaus on ei, ominaisuutta ei lisätä. (Sisältää myös
   "hyödyllisyys ennen monimutkaisuutta" ja "jokainen ominaisuus
   säästää aikaa tai sitä ei rakenneta".)

3. **Hiljainen käyttöliittymä** — ei jatkuvaa huomion pyytämistä,
   ei turhia ilmoituksia, ei vilkkuvia elementtejä, ei mainoksia,
   ei ylimääräisiä animaatioita.

4. **Jokaisella pikselillä on tarkoitus** — jos elementti ei auta
   käyttäjää tekemään työtään paremmin, sitä ei ole.

5. **Yksi totuus** — samaa tietoa ei tallenneta useaan paikkaan
   (esim. asiakasta ei päivitetä kolmessa eri näkymässä, eikä
   Constitutionia ylläpidetä kahdessa tiedostossa).

6. **Projekti on kaiken keskus** — asiakas, materiaalit, tarjoukset,
   laskutus, kuvat, videot, muistiinpanot ja AI liittyvät kaikki
   projektiin.

7. **Offline on oletus** — internet on lisäominaisuus, työn pitää
   onnistua myös ilman verkkoyhteyttä.

8. **AI ei korvaa käyttäjää** — AI ehdottaa, ihminen päättää.

9. **AI selittää toimintansa** — suosituksen antaessaan AI:n pitäisi
   pystyä kertomaan mihin tieto perustuu.

10. **Nopea kaikilla koneilla** — toimii hyvin myös muutaman vuoden
    vanhalla kannettavalla. Nopeus menee näyttävyyden edelle.

11. **Ei turhaa odottelua** — näkymän avaus, haku ja tallennus lähes
    välittömiä.

12. **Muokattava työtila** — jokainen käyttäjä voi rakentaa oman
    näkymänsä (esim. puuseppä: projektit/työvaiheet/materiaalit;
    toimitusjohtaja: tarjoukset/myynti/raportit).

13. **Kaikki löytyy haulla** — hakukenttä on tärkeämpi kuin
    monimutkaiset valikot. ("Yksi haku.")

14. **Vähemmän klikkauksia** — yleisimmät tehtävät mahdollisimman
    vähillä vaiheilla.

15. **Muista mitä käyttäjä tekee** — viimeksi avatut projektit,
    suosikkimateriaalit, yleisimmät asiakkaat.

16. **Käyttäjän aika on arvokasta** — älä koskaan pyydä syöttämään
    samaa tietoa kahdesti.

17. **Luotettava ennen kaikkea** — parempi että toiminto puuttuu
    kuin että se toimii epäluotettavasti.

18. **Avoin arkkitehtuuri** — AI-malli, tietokanta, käyttöliittymä
    ja tiedostojärjestelmä voidaan kaikki korvata; ydin pysyy samana.

19. **Modulaarisuus** — yksi moduuli = yksi vastuu (esim. Media
    Studio, Social Studio, Inventory, CRM), eivät riipu toisistaan
    enempää kuin on tarpeen.

20. **Kaikki on laajennettavaa** — uusia moduuleja voidaan asentaa
    ilman että ydintä tarvitsee muuttaa.

21. **Turvallisuus oletuksena** — käyttäjän tiedot ovat
    oletusarvoisesti yksityisiä.

22. **Omistajuus** — yrityksen tieto kuuluu yritykselle; vienti ja
    varmuuskopiointi ovat aina mahdollisia. ("Käyttäjä omistaa
    datansa.")

23. **Pitkä käyttöikä** — tavoitteena ei ole seurata muotia, vaan
    käyttöliittymä joka näyttää hyvältä myös 10 vuoden kuluttua.

24. **Dokumentoi automaattisesti** — järjestelmä kirjaa työn
    etenemistä automaattisesti aina kun mahdollista.

25. **Sisällöntuotanto kuuluu työnkulkuun** — valmistuneesta
    projektista voidaan luoda helposti tarjousmateriaalia,
    tuotekuvia, verkkosivusisältöä, somejulkaisuja ja lyhyt
    esittelyvideo.

26. **Opi yrityksestä** — järjestelmä tunnistaa ajan myötä
    suosituimmat materiaalit, kannattavimmat projektit, usein
    toistuvat työvaiheet.

27. **Yksi ekosysteemi** — ei kokoelma irrallisia ohjelmia, vaan
    yhtenäinen ympäristö jossa kaikki moduulit käyttävät samaa
    tietoa ja näyttävät samalta.

28. **Kauneus syntyy selkeydestä** — käyttöliittymän ei tarvitse
    olla näyttävä, sen pitää tuntua rauhalliselta. Kun käyttäjä
    avaa sovelluksen, hänen pitäisi ajatella: "Tässä on helppo
    tehdä töitä."

---

## Tunnuslause

"Wood-Booster HQ säästää käyttäjän aikaa, säilyttää yrityksen
tiedon ja tekee päivittäisestä työstä miellyttävämpää."

Tämä toimii suodattimena: jos uusi ominaisuus ei säästä aikaa, auta
tiedon säilyttämisessä tai paranna käyttökokemusta, sen paikkaa
kannattaa harkita uudelleen.
