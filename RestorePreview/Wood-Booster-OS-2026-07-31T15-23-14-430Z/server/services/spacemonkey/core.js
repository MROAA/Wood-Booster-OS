/*
  Spacemonkey Core

  Käyttöjärjestelmän AI-ytimen perusta.

  Vastaa:
  - Spacemonkey identiteetistä
  - Core-tilan muodostamisesta
  - moduulien yhdistämisestä

  Ei vielä:
  - AI Brain kutsuja
  - Memory integraatiota
  - Environment skannausta

  Tämä on ensimmäinen kerros.
*/


const CORE_VERSION = "1.0.0"


function createSpacemonkeyCore({
  identity,
  personality,
  environment,
  capabilities,
}) {

  return {

    name: "Spacemonkey",

    version: CORE_VERSION,

    role:
      "AI käyttöjärjestelmän operaattori",

    status:
      "initialized",

    identity:
      identity || null,

    personality:
      personality || null,

    environment:
      environment || null,

    capabilities:
      capabilities || [],

    createdAt:
      new Date().toISOString(),

  }

}


function getSpacemonkeyCoreInfo(){

  return {

    name:
      "Spacemonkey",

    version:
      CORE_VERSION,

    purpose:
      "Henkilökohtainen AI-käyttöjärjestelmän ydin",

    architecture:
      "Modular AI Core",

    layers:[

      "identity",

      "personality",

      "memory",

      "environment",

      "knowledge",

      "capability",

      "action",

    ],

  }

}


export {

  createSpacemonkeyCore,

  getSpacemonkeyCoreInfo,

}
