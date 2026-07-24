/*
=====================================
WOOD-BOOSTER AI BRAIN V2

BRAIN VERSION

Vastuut:
- määrittelee AI Brain V2:n version
- kertoo nykyisen kehitysvaiheen
- tarjoaa yhtenäisen versionumeron
- estää version kovakoodaamisen
  useisiin eri tiedostoihin

Tämä tiedosto ei:
- suorita AI-logiikkaa
- rekisteröi moduuleja
- käynnistä Brain Runtimea
- kutsu kielimallia
- sisällä henkilötietoja
=====================================
*/


const BRAIN_VERSION = {
  major:
    2,

  minor:
    0,

  patch:
    0,

  channel:
    "mvp",

  stage:
    "development",

  codename:
    "Spacemonkey",

  architecture:
    "Modular AI Operating System",

  compatibility: {
    api:
      "v2",

    runtime:
      "v2",

    moduleSystem:
      "v2",
  },
}


function createVersionNumber() {
  return [
    BRAIN_VERSION.major,
    BRAIN_VERSION.minor,
    BRAIN_VERSION.patch,
  ].join(".")
}


function createVersionLabel() {
  const versionNumber =
    createVersionNumber()

  if (!BRAIN_VERSION.channel) {
    return versionNumber
  }

  return (
    `${versionNumber}-` +
    BRAIN_VERSION.channel
  )
}


function getBrainVersion() {
  return {
    ...BRAIN_VERSION,

    version:
      createVersionNumber(),

    label:
      createVersionLabel(),

    compatibility: {
      ...BRAIN_VERSION.compatibility,
    },
  }
}


function getBrainVersionSummary() {
  return {
    version:
      createVersionNumber(),

    label:
      createVersionLabel(),

    stage:
      BRAIN_VERSION.stage,

    channel:
      BRAIN_VERSION.channel,

    codename:
      BRAIN_VERSION.codename,
  }
}


export {
  BRAIN_VERSION,
  createVersionNumber,
  createVersionLabel,
  getBrainVersion,
  getBrainVersionSummary,
}
