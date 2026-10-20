
import fs from "node:fs/promises"
import path from "node:path"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"
import FileSearchSkill from "./spacemonkey/skills/filesystem/FileSearchSkill.js"

const SOURCE_DIRECTORIES = [
  "src/data/heartwood",
  "src/services/heartwood",
  "src/components/heartwood",
  "src/components/hearthwood-studio",
  "src/pages",
  "server/services/heartwood",
  "server/services/hearthwood",
  "server/routes",
]

const ALLOWED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
])

const TOPICS = [
  {
    id: "mana",
    keywords: ["mana", "resurss", "resource"],
    filenameWords: ["mana", "resource", "resources"],
    weight: 20,
  },
  {
    id: "hero",
    keywords: ["sankar", "hahmo", "hero"],
    filenameWords: ["hero", "heroes", "unit", "units"],
    weight: 15,
  },
  {
    id: "ability",
    keywords: ["kyky", "kyv", "skill", "abilit"],
    filenameWords: ["ability", "abilities", "skill", "skills"],
    weight: 14,
  },
  {
    id: "class",
    keywords: ["luokka", "class"],
    filenameWords: ["class", "classes"],
    weight: 14,
  },
  {
    id: "enemy",
    keywords: ["viholl", "enemy"],
    filenameWords: ["enemy", "enemies"],
    weight: 14,
  },
  {
    id: "battle",
    keywords: ["taistelu", "combat", "battle", "tactics"],
    filenameWords: ["battle", "combat", "tactics"],
    weight: 12,
  },
  {
    id: "map",
    keywords: ["kartta", "map"],
    filenameWords: ["map", "campaign"],
    weight: 12,
  },
  {
    id: "story",
    keywords: ["tarina", "story", "lore"],
    filenameWords: ["story", "narrative", "lore"],
    weight: 12,
  },
  {
    id: "item",
    keywords: ["esine", "item", "gear", "relic"],
    filenameWords: ["item", "items", "gear", "relic", "relics"],
    weight: 12,
  },
  {
    id: "market",
    keywords: ["kauppa", "market", "shop"],
    filenameWords: ["market", "merchant", "shop"],
    weight: 12,
  },
  {
    id: "visual",
    keywords: ["ulkoasu", "visuaal", "theme", "style"],
    filenameWords: ["theme", "style", "layout"],
    weight: 12,
  },
]

function promptWords(prompt) {
  return (
    String(prompt || "")
      .toLowerCase()
      .match(/[a-zäöå0-9]+/g) || []
  )
}

function filenameWords(filePath) {
  const basename = path.basename(
    filePath,
    path.extname(filePath),
  )

  return basename
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || []
}

function activeTopicsFor(prompt) {
  const words = promptWords(prompt)

  return TOPICS
    .filter(topic =>
      words.some(word =>
        topic.keywords.some(keyword =>
          word.includes(keyword)
        )
      )
    )
    .sort((a, b) => b.weight - a.weight)
}

function scoreFile(filePath, topics, words) {
  const tokens = filenameWords(filePath)
  const tokenSet = new Set(tokens)

  let score = 0
  const matchedTopics = []

  for (const topic of topics) {
    const matched = topic.filenameWords.some(
      word => tokenSet.has(word)
    )

    if (matched) {
      score += topic.weight
      matchedTopics.push(topic.id)
    }
  }

  for (const word of words) {
    if (
      word.length >= 4 &&
      tokenSet.has(word)
    ) {
      score += 3
    }
  }

  if (score > 0) {
    if (
      filePath.startsWith(
        "src/services/heartwood/"
      )
    ) {
      score += 3
    } else if (
      filePath.startsWith(
        "src/data/heartwood/"
      )
    ) {
      score += 2
    }
  }

  return {
    filePath,
    score,
    exists: true,
    matchedTopics,
  }
}

export async function listHearthwoodProjectFiles() {
  const skill = new FileSearchSkill()
  const files = new Set()

  for (const relativeDirectory of SOURCE_DIRECTORIES) {
    const directory = path.join(
      PROJECT_ROOT,
      relativeDirectory,
    )

    try {
      await fs.access(directory)
    } catch {
      continue
    }

    const result = await skill.execute({
      directory,
      search: ".",
    })

    for (const absolutePath of result.results) {
      const relativePath = path.relative(
        PROJECT_ROOT,
        absolutePath,
      ).replaceAll("\\", "/")

      if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
      ) {
        continue
      }

      if (
        !ALLOWED_EXTENSIONS.has(
          path.extname(relativePath).toLowerCase()
        )
      ) {
        continue
      }

      if (
        relativePath.startsWith("src/pages/") &&
        !/heartwood|hearthwood/i.test(
          path.basename(relativePath)
        )
      ) {
        continue
      }

      if (
        relativePath.startsWith("server/routes/") &&
        !/heartwood|hearthwood/i.test(
          path.basename(relativePath)
        )
      ) {
        continue
      }

      files.add(relativePath)
    }
  }

  return [...files].sort()
}

export async function findHearthwoodProjectFiles(
  prompt,
  limit = 25,
) {
  const files = await listHearthwoodProjectFiles()
  const topics = activeTopicsFor(prompt)
  const words = promptWords(prompt)

  const ranked = files
    .map(filePath =>
      scoreFile(filePath, topics, words)
    )
    .filter(item => item.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      a.filePath.localeCompare(b.filePath)
    )

  const maxResults = Math.max(
    1,
    Math.min(limit, 50),
  )

  const selected = []
  const selectedPaths = new Set()

  function add(item) {
    if (
      !item ||
      selectedPaths.has(item.filePath) ||
      selected.length >= maxResults
    ) {
      return
    }

    selected.push(item)
    selectedPaths.add(item.filePath)
  }

  for (const topic of topics) {
    add(
      ranked.find(item =>
        item.matchedTopics.includes(topic.id)
      )
    )
  }

  for (const item of ranked) {
    if (selected.length >= maxResults) {
      break
    }

    add(item)
  }

  return {
    project: "hearthwood",
    projectRoot: PROJECT_ROOT,
    totalFiles: files.length,
    matches: selected,
  }
}
