
import fs from "node:fs/promises"
import path from "node:path"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"
import FileSearchSkill from "./spacemonkey/skills/filesystem/FileSearchSkill.js"
import {
  taskTerms,
  nameWords,
  wordMatches,
  termHits,
  extractDefinitions,
} from "./hearthwoodSourceIndex.js"

const MAX_FILE_BYTES = 512000
const MAX_CONTENT_SCORE = 80

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

/**
 * Content relevance: definition names and their leading comments that
 * mention task terms. A file name match alone no longer decides.
 */
async function readSource(filePath) {
  try {
    const absolute = path.join(PROJECT_ROOT, filePath)
    const stats = await fs.stat(absolute)
    if (!stats.isFile() || stats.size > MAX_FILE_BYTES) return ""
    return await fs.readFile(absolute, "utf8")
  } catch {
    return ""
  }
}

/**
 * Project-wide term rarity (idf in 0..1): a word found in most files
 * ("power") says little about which file implements the task.
 */
function projectTermWeights(contents, words, inferred = []) {
  const total = contents.length
  const weights = new Map()
  for (const term of words) {
    const df = contents.filter(content => termHits(content, [term]).length).length
    const idf = Math.log((total + 1) / (df + 1)) / Math.log(total + 1)
    // Glossary guesses about intent weigh half of what the user wrote.
    weights.set(term, inferred.includes(term) ? idf / 2 : idf)
  }
  return weights
}

function contentScore(content, terms, weights) {
  if (!content) return { score: 0, symbols: [] }
  const sum = list => list.reduce((n, term) => n + (weights.get(term) ?? 1), 0)
  let score = 6 * sum(termHits(content, terms.words))
  const symbols = []
  for (const definition of extractDefinitions(content)) {
    const own = nameWords(definition.name)
    const nameHits = terms.symbols.includes(definition.name) ? 3 :
      sum(terms.words.filter(term => own.some(word => wordMatches(word, term))))
    const commentHits = sum(termHits(definition.leadingComment, terms.words))
    if (nameHits) symbols.push({ name: definition.name, nameHits })
    score += 24 * nameHits + 8 * commentHits
  }
  symbols.sort((x, y) => y.nameHits - x.nameHits)
  return {
    score: Math.round(Math.min(MAX_CONTENT_SCORE, score)),
    symbols: symbols.slice(0, 5).map(symbol => symbol.name),
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

  const terms = taskTerms(prompt)
  const contents = []
  for (const filePath of files) contents.push(await readSource(filePath))
  const weights = projectTermWeights(contents, terms.words, terms.inferred)
  const scored = []
  for (const [index, filePath] of files.entries()) {
    const item = scoreFile(filePath, topics, words)
    const content = contentScore(contents[index], terms, weights)
    scored.push({ ...item, score: item.score + content.score, matchedSymbols: content.symbols })
  }

  const ranked = scored
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
