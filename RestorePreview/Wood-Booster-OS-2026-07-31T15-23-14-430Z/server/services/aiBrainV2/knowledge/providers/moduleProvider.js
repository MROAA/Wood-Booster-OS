/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE KNOWLEDGE PROVIDER

Yhdistää:
Module Data Layer
        ↓
Knowledge Layer

Ei suorita moduuleja.
Tarjoaa vain tietoa.
=====================================
*/


import {
  buildModuleDataLayer,
} from "../../data/moduleDataLayer.js"



function createModuleKnowledgeDocument(
  moduleKnowledge,
) {
  return {
    id:
      moduleKnowledge.id,

    type:
      "module",

    source:
      moduleKnowledge.source,

    category:
      moduleKnowledge.category,

    priority:
      moduleKnowledge.priority,

    content:
      moduleKnowledge.content,

    metadata:
      moduleKnowledge.metadata,
  }
}



function loadModuleKnowledge({
  includeDisabled = true,
} = {}) {

  const moduleDataLayer =
    buildModuleDataLayer({
      includeDisabled,
    })


  if (
    !moduleDataLayer.success
  ) {
    return {
      success:
        false,

      source:
        "module-provider",

      documents:
        [],

      error:
        moduleDataLayer.error,
    }
  }


  const documents =
    moduleDataLayer.knowledge
      .map(
        createModuleKnowledgeDocument,
      )


  return {
    success:
      true,

    source:
      "module-provider",

    version:
      "1.0.0",

    total:
      documents.length,

    documents,

    metadata: {
      moduleCount:
        moduleDataLayer.totalModules,

      activeModules:
        moduleDataLayer.activeModules,

      disabledModules:
        moduleDataLayer.disabledModules,
    },
  }
}



function getModuleKnowledgeSummary() {

  const result =
    loadModuleKnowledge()


  return {
    success:
      result.success,

    source:
      result.source,

    total:
      result.total || 0,

    metadata:
      result.metadata || null,

    error:
      result.error || null,
  }
}



export {
  loadModuleKnowledge,
  getModuleKnowledgeSummary,
}
