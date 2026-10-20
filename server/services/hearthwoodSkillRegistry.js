/**
 * Hearthwood Dev Studio
 * Spacemonkey Skill Registry V1
 *
 * Keskitetty luettelo Spacemonkeyn taidoista.
 *
 * Registry ei suorita työkaluja.
 * Se kertoo, mitä järjestelmässä on toteutettu
 * ja mitä kehitetään seuraavaksi.
 */

const SKILLS = [
  {
    id: "code-analysis",
    name: "Code Analyst",
    category: "development",
    status: "available",
    description:
      "Tutkii Hearthwoodin lähdekoodia ja selittää sen toimintaa.",
    capabilities: [
      "source-reading",
      "function-verification",
      "dependency-analysis",
    ],
    endpoint: "/api/hearthwood-dev/analyze",
    requiresApproval: false,
  },

  {
    id: "change-planning",
    name: "Development Planner",
    category: "development",
    status: "available",
    description:
      "Suunnittelee Hearthwoodin kehitysmuutoksia muuttamatta pelin tiedostoja.",
    capabilities: [
      "change-planning",
      "source-evidence",
      "file-impact-planning",
    ],
    endpoint: "/api/hearthwood-dev/plan",
    requiresApproval: false,
  },

  {
    id: "project-awareness",
    name: "Project Explorer",
    category: "development",
    status: "available",
    description:
      "Tutkii Hearthwood-projektin sallittuja tiedostoja ja rakennetta.",
    capabilities: [
      "project-file-discovery",
      "source-inspection",
    ],
    endpoint: null,
    requiresApproval: false,
  },

  {
    id: "image-studio",
    name: "Image Studio",
    category: "media",
    status: "api-ready",
    description:
      "Tutkii kuvia, muuttaa kuvakokoja ja valmistaa PNG-esikatseluja.",
    capabilities: [
      "image-inspection",
      "image-resize",
      "png-conversion",
    ],
    endpoint: "/api/hearthwood-dev/image",
    requiresApproval: false,
    notes:
      "Alkuperäiset kuvat säilytetään. Keskustelukäyttöliittymän lopputesti on vielä tekemättä.",
  },

  {
    id: "audio-studio",
    name: "Audio Engineer",
    category: "media",
    status: "planned",
    description:
      "Käsittelee Hearthwoodin äänitehosteita, tunnelmaääniä ja musiikkia.",
    capabilities: [
      "audio-inspection",
      "audio-trimming",
      "audio-normalization",
      "audio-mixing",
      "audio-looping",
    ],
    endpoint: null,
    requiresApproval: true,
    notes:
      "FFmpeg on asennettu. Audio Studion palvelua ei ole vielä toteutettu.",
  },

  {
    id: "game-design",
    name: "Game Designer",
    category: "game-development",
    status: "planned",
    description:
      "Tutkii taistelumekaniikkoja, hahmoluokkia ja pelitasapainoa.",
    capabilities: [
      "combat-analysis",
      "class-balance",
      "difficulty-analysis",
      "mechanic-design",
    ],
    endpoint: null,
    requiresApproval: false,
  },

  {
    id: "qa-testing",
    name: "QA Tester",
    category: "quality",
    status: "planned",
    description:
      "Suorittaa tarkistuksia, etsii regressioita ja raportoi ongelmat.",
    capabilities: [
      "build-verification",
      "test-execution",
      "regression-reporting",
    ],
    endpoint: null,
    requiresApproval: true,
  },

  {
    id: "lore-keeper",
    name: "Lore Keeper",
    category: "creative",
    status: "planned",
    description:
      "Auttaa kehittämään Hearthwoodin maailmaa, tarinoita ja hahmoja.",
    capabilities: [
      "lore-analysis",
      "character-consistency",
      "story-development",
    ],
    endpoint: null,
    requiresApproval: false,
  },

  {
    id: "project-manager",
    name: "AI Project Manager",
    category: "management",
    status: "planned",
    description:
      "Auttaa priorisoimaan kehitystä, suunnittelemaan sprinttejä ja seuraamaan etenemistä.",
    capabilities: [
      "sprint-planning",
      "task-prioritization",
      "progress-reporting",
    ],
    endpoint: null,
    requiresApproval: false,
  },

  {
    id: "asset-manager",
    name: "Asset Manager",
    category: "media",
    status: "planned",
    description:
      "Hallinnoi pelin kuvia, ääniä ja muita resurssitiedostoja.",
    capabilities: [
      "asset-inventory",
      "unused-asset-detection",
      "asset-validation",
    ],
    endpoint: null,
    requiresApproval: true,
  },
]

const VALID_STATUSES = new Set([
  "available",
  "api-ready",
  "planned",
])

function copySkill(skill) {
  return {
    ...skill,
    capabilities: [...skill.capabilities],
  }
}

export function listHearthwoodSkills() {
  return SKILLS.map(copySkill)
}

export function getHearthwoodSkill(skillId) {
  if (typeof skillId !== "string") {
    return null
  }

  const skill = SKILLS.find(
    item => item.id === skillId,
  )

  return skill ? copySkill(skill) : null
}

export function getAvailableHearthwoodSkills() {
  return SKILLS
    .filter(skill => skill.status === "available")
    .map(copySkill)
}

export function getHearthwoodSkillSummary() {
  const statuses = {
    available: 0,
    "api-ready": 0,
    planned: 0,
  }

  for (const skill of SKILLS) {
    if (VALID_STATUSES.has(skill.status)) {
      statuses[skill.status]++
    }
  }

  return {
    total: SKILLS.length,
    statuses,
    skills: SKILLS.map(skill => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      status: skill.status,
    })),
  }
}
