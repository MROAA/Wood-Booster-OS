import {
  getKnowledgeRegistry
} from "./registry/knowledgeRegistry.js"


const registry =
  getKnowledgeRegistry()


console.log(
  "REGISTERED KNOWLEDGE SOURCES"
)


console.log(
  registry
)
