/**
 * Altrakon vaihtoehtoinen päättely- ja riskianalyysikerros (Versio 1.0).
 * Tunnistaa dynaamisesti erilaisia riskejä ja tarjoaa monipuolisempia vaihtoehtoja.
 */
export class AlternativeReasoning {
  evaluateRisk(decisionText) {
    const text = (decisionText || "").toLowerCase();
    
    // Tarkistus 1: Massiiviset muutokset / laajuusriski
    if (text.includes("kaikki") || text.includes("50 moduulin") || text.includes("massiivinen") || text.includes("kerralla")) {
      return {
        level: "KORKEA",
        warning: "Laaja tai hallitsematon muutoskoko kerralla. Suuri riski regressioille.",
        alternative: "Pilko muutos pienempiin eriin (batching) ja ota käyttöön vaiheittain."
      };
    }

    // Tarkistus 2: Tietoturvaan tai autentikaatioon liittyvät riskit
    if (text.includes("poista turva") || text.includes("salasana") || text.includes("julkinen") || text.includes("bypass")) {
      return {
        level: "KORKEA",
        warning: "Mahdollinen tietoturvariski tai suojauksien ohitus havaittu.",
        alternative: "Vahvista autentikaatio ja varmista, että rajapinnat on suojattu asianmukaisesti."
      };
    }

    // Tarkistus 3: Kiire / pikaratkaisut
    if (text.includes("pikaratkaisu") || text.includes("hätä") || text.includes("hack") || text.includes("temporary")) {
      return {
        level: "KESKITASO",
        warning: "Pikaratkaisut voivat kerryttää teknistä velkaa.",
        alternative: "Dokumentoi tekninen velka heti ja varaa aika refaktoroinnille seuraavassa sprintissä."
      };
    }

    // Oletus: Matala riski
    return {
      level: "MATALA",
      warning: "Ei merkittäviä rakenteellisia tai toiminnallisia riskejä havaittu.",
      alternative: "Voit edetä nykyisellä suunnitelmalla turvallisin mielin."
    };
  }
}

export const alternativeReasoning = new AlternativeReasoning();
