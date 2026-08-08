const agents = [

  {
    id: "spacemonkey",

    name: "Spacemonkey Core",

    version: "1.0.0",

    icon: "🐒",

    status: "Active",

    capability:
      "Identity & System Operation",

    description:
      "Wood-Booster HQ:n ydinoperaattori.",

    capabilities: [
      "System Operation",
      "Identity Management",
      "Memory Control",
      "Decision Support",
    ],

    truthSources: [
      "systemTruth",
      "decisionTruth",
    ],
  },



  {
    id: "product",

    name: "Product Agent",

    version: "1.0.0",

    icon: "📦",

    status: "Active",

    capability:
      "Product Intelligence",

    description:
      "Tuotteiden suunnittelu ja tuotetieto.",

    capabilities: [
      "Tuotteiden suunnittelu",
      "Tuotetietojen tarkistus",
      "Materiaalien yhdistäminen",
    ],

    truthSources: [
      "productTruth",
      "brandTruth",
      "decisionTruth",
    ],
  },



  {
    id: "workshop",

    name: "Workshop Agent",

    version: "1.0.0",

    icon: "🛠️",

    status: "Active",

    capability:
      "Workshop Intelligence",

    description:
      "Valmistusprosessit ja materiaalien ymmärtäminen.",

    capabilities: [
      "Valmistusohjeet",
      "Työvaiheiden suunnittelu",
      "Työkalut ja materiaalit",
    ],

    truthSources: [
      "workshopTruth",
      "productTruth",
      "decisionTruth",
    ],
  },



  {
    id: "pricing",

    name: "Pricing Agent",

    version: "1.0.0",

    icon: "💶",

    status: "Active",

    capability:
      "Cost Analysis",

    description:
      "Hinnoittelu ja kannattavuuden arviointi.",

    capabilities: [
      "Materiaalikustannukset",
      "Hinnoittelu",
      "Kannattavuuslaskenta",
    ],

    truthSources: [
      "businessTruth",
      "decisionTruth",
    ],
  },



  {
    id: "marketing",

    name: "Marketing Agent",

    version: "1.0.0",

    icon: "📣",

    status: "Active",

    capability:
      "Brand Intelligence",

    description:
      "Brändi ja markkinointi.",

    capabilities: [
      "Markkinointitekstit",
      "Brändiviestintä",
      "Sisältöideat",
    ],

    truthSources: [
      "brandTruth",
      "businessTruth",
    ],
  },



  {
    id: "crm",

    name: "CRM Agent",

    version: "1.0.0",

    icon: "👥",

    status: "Active",

    capability:
      "Customer Intelligence",

    description:
      "Asiakkuuksien hallinta.",

    capabilities: [
      "Asiakastiedot",
      "Asiakkuuksien seuranta",
      "CRM-toiminnot",
    ],

    truthSources: [
      "customerTruth",
      "businessTruth",
    ],
  },



  {
    id: "general",

    name: "General AI",

    version: "1.0.0",

    icon: "🤖",

    status: "Active",

    capability:
      "General Reasoning",

    description:
      "Yleinen AI Brain keskustelu.",

    capabilities: [
      "Yleinen keskustelu",
      "Päättely",
      "Avustaminen",
    ],

    truthSources: [
      "systemTruth",
    ],
  },

]



export function getAgents() {

  return agents

}
