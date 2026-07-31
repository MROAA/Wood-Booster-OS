const agentManifest = [
  {
    id: "product",
    name: "Product Agent",
    icon: "📦",
    status: "ACTIVE",
    description:
      "Vastaa tuotteista, tuoterakenteista, ominaisuuksista ja Wood-Booster-tuotekokonaisuuksista.",
    capabilities: [
      "Tuotteiden suunnittelu",
      "Tuotetietojen tarkistus",
      "Materiaalien ja ominaisuuksien yhdistäminen",
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
    icon: "🪚",
    status: "ACTIVE",
    description:
      "Vastaa valmistuksesta, työvaiheista, materiaaleista, työkaluista ja verstaalla tapahtuvasta työstä.",
    capabilities: [
      "Valmistusohjeet",
      "Työvaiheiden suunnittelu",
      "Työkalujen ja materiaalien käyttö",
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
    icon: "💶",
    status: "ACTIVE",
    description:
      "Vastaa kustannuksista, hinnoittelusta, katteista ja tuotteiden taloudellisesta arvioinnista.",
    capabilities: [
      "Materiaalikustannukset",
      "Työkustannukset",
      "Myyntihinnan arviointi",
    ],
    truthSources: [
      "businessTruth",
      "productTruth",
      "decisionTruth",
    ],
  },

  {
    id: "marketing",
    name: "Marketing Agent",
    icon: "📣",
    status: "ACTIVE",
    description:
      "Vastaa Wood-Booster-brändistä, markkinointiteksteistä, kampanjoista ja sisältöideoista.",
    capabilities: [
      "Markkinointitekstit",
      "Brändin mukainen viestintä",
      "Sisältö- ja kampanjaideat",
    ],
    truthSources: [
      "brandTruth",
      "businessTruth",
      "productTruth",
    ],
  },

  {
    id: "crm",
    name: "CRM Agent",
    icon: "👥",
    status: "ACTIVE",
    description:
      "Vastaa asiakkaisiin, yhteydenpitoon, asiakastietoihin ja myynnin jatkotoimiin liittyvistä tehtävistä.",
    capabilities: [
      "Asiakastietojen käsittely",
      "Viestiluonnokset",
      "Myynnin jatkotoimet",
    ],
    truthSources: [
      "businessTruth",
      "decisionTruth",
      "brandTruth",
    ],
  },
]

function getAgentManifest() {
  return agentManifest.map((agent) => ({
    ...agent,
    capabilities: [...agent.capabilities],
    truthSources: [...agent.truthSources],
  }))
}

function findAgentById(id) {
  return (
    getAgentManifest().find(
      (agent) => agent.id === id,
    ) || null
  )
}

export {
  agentManifest,
  getAgentManifest,
  findAgentById,
}
