/**
 * Wood-Booster HQ
 * Boosterverse Association Engine
 *
 * Boosterversen assosiatiivinen "hermosto".
 *
 * Tarkoitus:
 * - yhdistää asioita toisiinsa
 * - löytää merkityksellisiä suhteita
 * - ylläpitää kevyttä association graphia runtime-muistissa
 * - tarjota Spacemonkeylle liittyviä käsitteitä ja objekteja
 *
 * Esimerkkejä:
 *
 * Aurora <-> tammi
 * Aurora <-> asiakas
 * tammi <-> öljyvaha
 * projekti <-> kuvat
 * projekti <-> tarjous
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - muuta projektidataa
 * - tee automaatioita
 * - päätä asioita käyttäjän puolesta
 */

const MODULE_ID = "boosterverse-association-engine"
const MODULE_VERSION = "1.0.0"

const MAX_NODES = 5000
const MAX_EDGES = 20000

const graph = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  nodes: new Map(),
  edges: new Map(),

  counters: {
    nodesCreated: 0,
    edgesCreated: 0,
    associationsStrengthened: 0,
    searches: 0,
  },
}


/**
 * Luo turvallisen association-id:n.
 */
function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


/**
 * Alustaa moduulin.
 */
function initializeBoosterverseAssociationEngine() {
  if (graph.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const timestamp = new Date().toISOString()

  graph.initialized = true
  graph.startedAt = timestamp
  graph.updatedAt = timestamp

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
  }
}


/**
 * Luo tai päivittää graph-solmun.
 *
 * Esimerkki:
 *
 * upsertNode({
 *   id: "project-aurora",
 *   type: "project",
 *   label: "Aurora-pöytä"
 * })
 */
function upsertNode({
  id = null,
  type = "concept",
  label = null,
  data = null,
  importance = 0.5,
  trust = 1,
  tags = [],
} = {}) {
  ensureInitialized()

  const nodeId =
    sanitizeString(id) ||
    createId("bv-node")

  const existing = graph.nodes.get(nodeId)

  if (existing) {
    existing.type =
      sanitizeString(type) ||
      existing.type

    existing.label =
      sanitizeString(label) ||
      existing.label

    existing.data =
      data !== undefined
        ? data
        : existing.data

    existing.importance =
      clampNumber(
        importance,
        0,
        1
      )

    existing.trust =
      clampNumber(
        trust,
        0,
        1
      )

    existing.tags =
      mergeTags(
        existing.tags,
        tags
      )

    existing.updatedAt =
      new Date().toISOString()

    touch()

    return {
      success: true,
      created: false,
      node: clone(existing),
    }
  }

  if (graph.nodes.size >= MAX_NODES) {
    return {
      success: false,
      error: "Association node limit reached",
    }
  }

  const timestamp =
    new Date().toISOString()

  const node = {
    id: nodeId,

    type:
      sanitizeString(type) ||
      "concept",

    label:
      sanitizeString(label),

    data,

    importance:
      clampNumber(
        importance,
        0,
        1
      ),

    trust:
      clampNumber(
        trust,
        0,
        1
      ),

    tags:
      normalizeTags(tags),

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  graph.nodes.set(
    nodeId,
    node
  )

  graph.counters.nodesCreated += 1

  touch()

  return {
    success: true,
    created: true,
    node: clone(node),
  }
}


/**
 * Luo yhteyden kahden solmun välille.
 *
 * Relation-esimerkkejä:
 *
 * uses
 * belongs_to
 * related_to
 * created_for
 * finished_with
 * contains
 * learned_from
 */
function associate({
  from,
  to,
  relation = "related_to",
  weight = 0.5,
  confidence = 1,
  source = "system",
  metadata = null,
} = {}) {
  ensureInitialized()

  const fromId =
    sanitizeString(from)

  const toId =
    sanitizeString(to)

  if (!fromId || !toId) {
    return {
      success: false,
      error:
        "Both from and to node ids are required",
    }
  }

  if (!graph.nodes.has(fromId)) {
    return {
      success: false,
      error: `Unknown source node: ${fromId}`,
    }
  }

  if (!graph.nodes.has(toId)) {
    return {
      success: false,
      error: `Unknown target node: ${toId}`,
    }
  }

  const safeRelation =
    sanitizeString(relation) ||
    "related_to"

  const edgeKey =
    createEdgeKey(
      fromId,
      toId,
      safeRelation
    )

  const existing =
    graph.edges.get(edgeKey)

  if (existing) {
    existing.weight =
      clampNumber(
        Math.max(
          existing.weight,
          weight
        ),
        0,
        1
      )

    existing.confidence =
      clampNumber(
        Math.max(
          existing.confidence,
          confidence
        ),
        0,
        1
      )

    existing.uses += 1

    existing.updatedAt =
      new Date().toISOString()

    if (metadata !== null) {
      existing.metadata = metadata
    }

    graph.counters.associationsStrengthened += 1

    touch()

    return {
      success: true,
      created: false,
      edge: clone(existing),
    }
  }

  if (graph.edges.size >= MAX_EDGES) {
    return {
      success: false,
      error:
        "Association edge limit reached",
    }
  }

  const timestamp =
    new Date().toISOString()

  const edge = {
    id: createId("bv-edge"),

    from: fromId,
    to: toId,

    relation: safeRelation,

    weight:
      clampNumber(
        weight,
        0,
        1
      ),

    confidence:
      clampNumber(
        confidence,
        0,
        1
      ),

    source:
      sanitizeString(source),

    metadata,

    uses: 1,

    createdAt: timestamp,
    updatedAt: timestamp,
  }

  graph.edges.set(
    edgeKey,
    edge
  )

  graph.counters.edgesCreated += 1

  touch()

  return {
    success: true,
    created: true,
    edge: clone(edge),
  }
}


/**
 * Helpompi tapa luoda kaksi solmua
 * ja yhteys niiden välille samalla kertaa.
 */
function associateEntities({
  fromEntity,
  toEntity,
  relation = "related_to",
  weight = 0.5,
  confidence = 1,
  source = "system",
} = {}) {
  ensureInitialized()

  if (!fromEntity || !toEntity) {
    return {
      success: false,
      error:
        "Both entities are required",
    }
  }

  const fromNode =
    upsertNode(fromEntity)

  if (!fromNode.success) {
    return fromNode
  }

  const toNode =
    upsertNode(toEntity)

  if (!toNode.success) {
    return toNode
  }

  return associate({
    from: fromNode.node.id,
    to: toNode.node.id,
    relation,
    weight,
    confidence,
    source,
  })
}


/**
 * Palauttaa suorat yhteydet solmulle.
 */
function getAssociations(
  nodeId,
  {
    limit = 50,
    minWeight = 0,
  } = {}
) {
  ensureInitialized()

  const safeNodeId =
    sanitizeString(nodeId)

  if (!safeNodeId) {
    return []
  }

  graph.counters.searches += 1

  const results = []

  for (const edge of graph.edges.values()) {
    if (
      edge.from !== safeNodeId &&
      edge.to !== safeNodeId
    ) {
      continue
    }

    if (edge.weight < minWeight) {
      continue
    }

    const neighbourId =
      edge.from === safeNodeId
        ? edge.to
        : edge.from

    const neighbour =
      graph.nodes.get(
        neighbourId
      )

    if (!neighbour) {
      continue
    }

    results.push({
      direction:
        edge.from === safeNodeId
          ? "outgoing"
          : "incoming",

      relation:
        edge.relation,

      weight:
        edge.weight,

      confidence:
        edge.confidence,

      node:
        clone(neighbour),

      edge:
        clone(edge),
    })
  }

  return results
    .sort(
      (a, b) =>
        associationScore(b) -
        associationScore(a)
    )
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 50
      )
    )
}


/**
 * Etsii nodeja tekstin perusteella.
 *
 * Tämä on vasta yksinkertainen
 * ei-semanttinen haku.
 */
function searchNodes(
  query,
  limit = 20
) {
  ensureInitialized()

  const normalized =
    sanitizeString(query)
      ?.toLowerCase()

  if (!normalized) {
    return []
  }

  graph.counters.searches += 1

  const matches = []

  for (const node of graph.nodes.values()) {
    const haystack = [
      node.id,
      node.type,
      node.label,
      ...(node.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (!haystack.includes(normalized)) {
      continue
    }

    matches.push({
      ...clone(node),

      score:
        node.importance *
        node.trust,
    })
  }

  return matches
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(
      0,
      Math.max(
        1,
        Number(limit) || 20
      )
    )
}


/**
 * Löytää korkeintaan depth-tason
 * assosiaatioverkoston.
 *
 * Tätä voidaan myöhemmin käyttää
 * Spacemonkeyn context-builderissä.
 */
function traverseAssociations(
  startNodeId,
  {
    depth = 2,
    maxResults = 100,
    minWeight = 0.1,
  } = {}
) {
  ensureInitialized()

  const startId =
    sanitizeString(
      startNodeId
    )

  if (
    !startId ||
    !graph.nodes.has(startId)
  ) {
    return {
      success: false,
      nodes: [],
      edges: [],
    }
  }

  const safeDepth =
    Math.max(
      1,
      Math.min(
        Number(depth) || 2,
        5
      )
    )

  const visited =
    new Set([startId])

  const queue = [
    {
      nodeId: startId,
      depth: 0,
    },
  ]

  const foundNodes = []
  const foundEdges = []

  while (
    queue.length > 0 &&
    foundNodes.length <
      maxResults
  ) {
    const current =
      queue.shift()

    if (
      current.depth >=
      safeDepth
    ) {
      continue
    }

    const associations =
      getAssociations(
        current.nodeId,
        {
          limit:
            maxResults,
          minWeight,
        }
      )

    for (const item of associations) {
      foundEdges.push(
        item.edge
      )

      if (
        visited.has(
          item.node.id
        )
      ) {
        continue
      }

      visited.add(
        item.node.id
      )

      foundNodes.push({
        ...item.node,
        depth:
          current.depth + 1,
        relation:
          item.relation,
        associationWeight:
          item.weight,
      })

      queue.push({
        nodeId:
          item.node.id,
        depth:
          current.depth + 1,
      })

      if (
        foundNodes.length >=
        maxResults
      ) {
        break
      }
    }
  }

  return {
    success: true,

    startNode:
      clone(
        graph.nodes.get(
          startId
        )
      ),

    nodes:
      foundNodes,

    edges:
      uniqueEdges(
        foundEdges
      ),
  }
}


/**
 * Palauttaa koko graphin kevyen tilannekuvan.
 */
function getAssociationSummary() {
  ensureInitialized()

  const nodeTypes = {}
  const relations = {}

  for (const node of graph.nodes.values()) {
    nodeTypes[node.type] =
      (nodeTypes[node.type] || 0) + 1
  }

  for (const edge of graph.edges.values()) {
    relations[edge.relation] =
      (relations[edge.relation] || 0) + 1
  }

  return {
    nodes: graph.nodes.size,
    edges: graph.edges.size,

    nodeTypes,
    relations,

    counters:
      clone(
        graph.counters
      ),

    updatedAt:
      graph.updatedAt,
  }
}


/**
 * Health check.
 */
function getBoosterverseAssociationEngineHealth() {
  return {
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    healthy: true,

    status:
      graph.initialized
        ? "running"
        : "idle",

    metrics: {
      nodes:
        graph.nodes.size,

      edges:
        graph.edges.size,

      searches:
        graph.counters.searches,

      strengthened:
        graph.counters
          .associationsStrengthened,
    },

    updatedAt:
      graph.updatedAt,
  }
}


/**
 * Runtime-graphin tyhjennys testeihin.
 *
 * Ei koske tietokantaan.
 */
function clearAssociationGraph() {
  graph.nodes.clear()
  graph.edges.clear()

  graph.updatedAt =
    new Date().toISOString()

  return {
    success: true,
    status: "cleared",
  }
}


/**
 * Luo uniikin edge keyn.
 */
function createEdgeKey(
  from,
  to,
  relation
) {
  return `${from}::${relation}::${to}`
}


/**
 * Assosiaation ranking.
 */
function associationScore(item) {
  return (
    item.weight *
    item.confidence *
    item.node.importance *
    item.node.trust
  )
}


/**
 * Poistaa duplicate-edget.
 */
function uniqueEdges(edges) {
  const seen = new Set()
  const result = []

  for (const edge of edges) {
    if (!edge?.id) {
      continue
    }

    if (seen.has(edge.id)) {
      continue
    }

    seen.add(edge.id)
    result.push(edge)
  }

  return result
}


/**
 * Tagien turvallinen normalisointi.
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return []
  }

  return [
    ...new Set(
      tags
        .map(sanitizeString)
        .filter(Boolean)
    ),
  ]
}


/**
 * Yhdistää tagit.
 */
function mergeTags(
  oldTags,
  newTags
) {
  return normalizeTags([
    ...(Array.isArray(oldTags)
      ? oldTags
      : []),

    ...(Array.isArray(newTags)
      ? newTags
      : []),
  ])
}


/**
 * String-normalisointi.
 */
function sanitizeString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const string =
    String(value).trim()

  return string || null
}


/**
 * Lukuarvon rajaus.
 */
function clampNumber(
  value,
  min,
  max
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(
    Math.max(
      number,
      min
    ),
    max
  )
}


/**
 * Päivittää graphin ajan.
 */
function touch() {
  graph.updatedAt =
    new Date().toISOString()
}


/**
 * Varmistaa alustuksen.
 */
function ensureInitialized() {
  if (!graph.initialized) {
    initializeBoosterverseAssociationEngine()
  }
}


/**
 * Estää ulkoista koodia muuttamasta
 * sisäisiä objekteja vahingossa.
 */
function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}


export {
  MODULE_ID,
  MODULE_VERSION,

  initializeBoosterverseAssociationEngine,

  upsertNode,

  associate,

  associateEntities,

  getAssociations,

  searchNodes,

  traverseAssociations,

  getAssociationSummary,

  getBoosterverseAssociationEngineHealth,

  clearAssociationGraph,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Association Engine",

  version:
    MODULE_VERSION,

  description:
    "Boosterversen assosiatiivinen tietoverkko ja Spacemonkeyn yhteyksien löytämisen peruskerros.",

  initialize:
    initializeBoosterverseAssociationEngine,

  upsertNode,

  associate,

  associateEntities,

  getAssociations,

  searchNodes,

  traverseAssociations,

  getAssociationSummary,

  health:
    getBoosterverseAssociationEngineHealth,
}
