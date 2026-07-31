/*
WOOD-BOOSTER AI BRAIN V2 - DECISION OVERRIDE BRIDGE
Vastuut: ohittaa Decision Modulen "conversation" oletusvalinnan jos capability-kerros loysi vahvan osuman.
Ei koskaan muuta decisionModule.js:aa. Ei koskaan ohita jo tehtya tasmallista valintaa.
*/

const MIN_OVERRIDE_CONFIDENCE = 10

const CAPABILITY_TO_TARGET_MODULE = {
  "memory-learning": "memory-learning",
  "memory": "memory",
  "credentials": "credentials",
  "action": "action",
  "conversation": "conversation",
  "spacemonkey": "spacemonkey_identity",
}

function applyCapabilityOverride({ decisionOutput, capabilityContext }) {
  if (!decisionOutput || decisionOutput.decision !== "delegate") {
    return { ...decisionOutput, overrideApplied: false, overrideReason: "Ei ohitettu: decision ei ole delegate." }
  }

  if (decisionOutput.targetModule !== "conversation") {
    return { ...decisionOutput, overrideApplied: false, overrideReason: "Ei ohitettu: tasmallinen valinta jo tehty." }
  }

  const primaryModule = capabilityContext?.primaryModule || null

  if (!primaryModule) {
    return { ...decisionOutput, overrideApplied: false, overrideReason: "Ei ohitettu: capability-osumaa ei loytynyt." }
  }

  if (primaryModule.confidence < MIN_OVERRIDE_CONFIDENCE) {
    return { ...decisionOutput, overrideApplied: false, overrideReason: "Ei ohitettu: confidence liian matala." }
  }

  const mappedTarget = CAPABILITY_TO_TARGET_MODULE[primaryModule.moduleId] || null

  if (!mappedTarget) {
    return { ...decisionOutput, overrideApplied: false, overrideReason: "Ei ohitettu: ei tunnettua kohdemoduulia." }
  }

  return {
    ...decisionOutput,
    targetModule: mappedTarget,
    reason: `Ohitettu: capability loysi vahvan osuman moduulille "${mappedTarget}" (confidence ${primaryModule.confidence}).`,
    overrideApplied: true,
    overrideReason: "Alkuperainen valinta oli conversation, ohitettiin capability-osuman perusteella.",
    overrideSource: { moduleId: primaryModule.moduleId, confidence: primaryModule.confidence },
  }
}

export { applyCapabilityOverride }
